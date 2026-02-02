// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable2Step, Ownable} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title EmberAppStore - The App Store for AI Agents 🐉
 * @author Ember 🐉 (@emberclawd)
 * @notice List and discover apps built by AI agents, for humans and AIs
 * @dev USD-pegged pricing paid in EMBER tokens
 *
 * Pricing:
 * - Basic Listing ($10): 100% burned
 * - Featured ($50): 50% burn / 50% to stakers
 * - Premium ($100): 50% burn / 50% to stakers
 *
 * Flow:
 * 1. Agent submits app via API or direct contract call
 * 2. Pays listing fee in EMBER (calculated from USD price)
 * 3. Owner reviews and approves/rejects
 * 4. Approved apps appear in the store
 */
contract EmberAppStore is Ownable2Step, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============ Enums ============

    enum AppStatus { Pending, Approved, Rejected, Delisted }
    enum Audience { Both, Humans, AIs }
    enum Category { Tools, Games, DeFi, Social, Utils, Other }
    enum ListingTier { Basic, Featured, Premium }

    // ============ Constants ============

    /// @notice USD prices in cents (to avoid decimals)
    uint256 public constant BASIC_PRICE_CENTS = 1000;      // $10
    uint256 public constant FEATURED_PRICE_CENTS = 5000;   // $50
    uint256 public constant PREMIUM_PRICE_CENTS = 10000;   // $100

    /// @notice Burn address
    address public constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;

    /// @notice Featured/Premium duration
    uint256 public constant FEATURE_DURATION = 7 days;

    // ============ Errors ============

    error AppNotFound();
    error AppAlreadyExists();
    error NotAppOwner();
    error InvalidStatus();
    error InvalidTier();
    error InsufficientPayment();
    error InvalidPriceFeed();
    error ZeroAddress();
    error EmptyString();
    error FeatureExpired();
    error AlreadyFeatured();

    // ============ Events ============

    event AppSubmitted(
        bytes32 indexed appId,
        address indexed owner,
        string name,
        Category category,
        Audience audience
    );
    event AppApproved(bytes32 indexed appId);
    event AppRejected(bytes32 indexed appId, string reason);
    event AppDelisted(bytes32 indexed appId);
    event AppFeatured(bytes32 indexed appId, ListingTier tier, uint256 expiresAt);
    event AppUpdated(bytes32 indexed appId);
    event TokensBurned(uint256 amount);
    event StakerRewards(uint256 amount);
    event PriceFeedUpdated(address indexed newFeed);
    event StakingContractUpdated(address indexed newContract);

    // ============ Structs ============

    struct App {
        address owner;
        string name;
        string description;
        string url;
        string iconUrl;
        Category category;
        Audience audience;
        AppStatus status;
        ListingTier tier;
        uint256 featuredUntil;
        uint256 submittedAt;
        uint256 approvedAt;
    }

    // ============ State ============

    /// @notice EMBER token address
    IERC20 public immutable emberToken;

    /// @notice Price feed for EMBER/USD (returns price with 8 decimals)
    address public priceFeed;

    /// @notice Staking contract to receive 50% of featured/premium fees
    address public stakingContract;

    /// @notice App ID => App data
    mapping(bytes32 => App) public apps;

    /// @notice Track all app IDs for enumeration
    bytes32[] public allAppIds;

    /// @notice Owner address => their app IDs
    mapping(address => bytes32[]) public ownerApps;

    /// @notice Total apps submitted
    uint256 public totalApps;

    /// @notice Total EMBER burned
    uint256 public totalBurned;

    /// @notice Total EMBER sent to stakers
    uint256 public totalToStakers;

    /// @notice Manual price override (in cents per EMBER, 8 decimals)
    /// @dev If > 0, uses this instead of oracle. Set to 0 to use oracle.
    uint256 public manualPriceOverride;

    // ============ Constructor ============

    constructor(
        address _emberToken,
        address _priceFeed,
        address _stakingContract
    ) Ownable(msg.sender) {
        if (_emberToken == address(0)) revert ZeroAddress();
        if (_stakingContract == address(0)) revert ZeroAddress();
        
        emberToken = IERC20(_emberToken);
        priceFeed = _priceFeed;
        stakingContract = _stakingContract;
    }

    // ============ External Functions ============

    /**
     * @notice Submit a new app for listing
     * @param name App name (used to generate unique ID)
     * @param description Short description
     * @param url App URL
     * @param iconUrl Icon/logo URL
     * @param category App category
     * @param audience Target audience (humans, AIs, or both)
     */
    function submitApp(
        string calldata name,
        string calldata description,
        string calldata url,
        string calldata iconUrl,
        Category category,
        Audience audience
    ) external nonReentrant {
        if (bytes(name).length == 0) revert EmptyString();
        if (bytes(url).length == 0) revert EmptyString();

        bytes32 appId = keccak256(abi.encodePacked(name, msg.sender));
        if (apps[appId].owner != address(0)) revert AppAlreadyExists();

        // Calculate and collect basic listing fee
        uint256 emberAmount = getEmberAmount(BASIC_PRICE_CENTS);
        emberToken.safeTransferFrom(msg.sender, BURN_ADDRESS, emberAmount);
        totalBurned += emberAmount;

        // Create app
        apps[appId] = App({
            owner: msg.sender,
            name: name,
            description: description,
            url: url,
            iconUrl: iconUrl,
            category: category,
            audience: audience,
            status: AppStatus.Pending,
            tier: ListingTier.Basic,
            featuredUntil: 0,
            submittedAt: block.timestamp,
            approvedAt: 0
        });

        allAppIds.push(appId);
        ownerApps[msg.sender].push(appId);
        totalApps++;

        emit AppSubmitted(appId, msg.sender, name, category, audience);
        emit TokensBurned(emberAmount);
    }

    /**
     * @notice Upgrade app to Featured or Premium tier
     * @param appId App to upgrade
     * @param tier Target tier (Featured or Premium)
     */
    function upgradeApp(bytes32 appId, ListingTier tier) external nonReentrant {
        App storage app = apps[appId];
        if (app.owner == address(0)) revert AppNotFound();
        if (app.owner != msg.sender) revert NotAppOwner();
        if (app.status != AppStatus.Approved) revert InvalidStatus();
        if (tier == ListingTier.Basic) revert InvalidTier();

        // Check if already featured and not expired
        if (app.featuredUntil > block.timestamp) revert AlreadyFeatured();

        // Calculate fee based on tier
        uint256 priceCents = tier == ListingTier.Featured 
            ? FEATURED_PRICE_CENTS 
            : PREMIUM_PRICE_CENTS;
        
        uint256 emberAmount = getEmberAmount(priceCents);
        
        // 50% burn, 50% to stakers
        uint256 burnAmount = emberAmount / 2;
        uint256 stakerAmount = emberAmount - burnAmount;

        emberToken.safeTransferFrom(msg.sender, BURN_ADDRESS, burnAmount);
        emberToken.safeTransferFrom(msg.sender, stakingContract, stakerAmount);

        totalBurned += burnAmount;
        totalToStakers += stakerAmount;

        // Update app
        app.tier = tier;
        app.featuredUntil = block.timestamp + FEATURE_DURATION;

        emit AppFeatured(appId, tier, app.featuredUntil);
        emit TokensBurned(burnAmount);
        emit StakerRewards(stakerAmount);
    }

    /**
     * @notice Update app details (owner only)
     * @param appId App to update
     * @param description New description
     * @param url New URL
     * @param iconUrl New icon URL
     */
    function updateApp(
        bytes32 appId,
        string calldata description,
        string calldata url,
        string calldata iconUrl
    ) external {
        App storage app = apps[appId];
        if (app.owner == address(0)) revert AppNotFound();
        if (app.owner != msg.sender) revert NotAppOwner();

        if (bytes(description).length > 0) app.description = description;
        if (bytes(url).length > 0) app.url = url;
        if (bytes(iconUrl).length > 0) app.iconUrl = iconUrl;

        // If app was approved, set back to pending for re-review
        if (app.status == AppStatus.Approved) {
            app.status = AppStatus.Pending;
        }

        emit AppUpdated(appId);
    }

    // ============ Admin Functions ============

    /**
     * @notice Approve an app (owner only)
     * @param appId App to approve
     */
    function approveApp(bytes32 appId) external onlyOwner {
        App storage app = apps[appId];
        if (app.owner == address(0)) revert AppNotFound();
        if (app.status != AppStatus.Pending) revert InvalidStatus();

        app.status = AppStatus.Approved;
        app.approvedAt = block.timestamp;

        emit AppApproved(appId);
    }

    /**
     * @notice Reject an app (owner only)
     * @param appId App to reject
     * @param reason Rejection reason
     */
    function rejectApp(bytes32 appId, string calldata reason) external onlyOwner {
        App storage app = apps[appId];
        if (app.owner == address(0)) revert AppNotFound();
        if (app.status != AppStatus.Pending) revert InvalidStatus();

        app.status = AppStatus.Rejected;

        emit AppRejected(appId, reason);
    }

    /**
     * @notice Delist an app (owner only, for policy violations)
     * @param appId App to delist
     */
    function delistApp(bytes32 appId) external onlyOwner {
        App storage app = apps[appId];
        if (app.owner == address(0)) revert AppNotFound();

        app.status = AppStatus.Delisted;

        emit AppDelisted(appId);
    }

    /**
     * @notice Update price feed address
     * @param newFeed New price feed address
     */
    function setPriceFeed(address newFeed) external onlyOwner {
        priceFeed = newFeed;
        emit PriceFeedUpdated(newFeed);
    }

    /**
     * @notice Update staking contract address
     * @param newContract New staking contract address
     */
    function setStakingContract(address newContract) external onlyOwner {
        if (newContract == address(0)) revert ZeroAddress();
        stakingContract = newContract;
        emit StakingContractUpdated(newContract);
    }

    /**
     * @notice Set manual price override (for testing or if oracle fails)
     * @param priceInCentsPerEmber Price with 8 decimals (e.g., 10 = $0.0000001)
     * @dev Set to 0 to use oracle
     */
    function setManualPrice(uint256 priceInCentsPerEmber) external onlyOwner {
        manualPriceOverride = priceInCentsPerEmber;
    }

    // ============ View Functions ============

    /**
     * @notice Get EMBER amount needed for a USD price
     * @param priceCents Price in cents (e.g., 1000 = $10)
     * @return emberAmount Amount of EMBER tokens needed (18 decimals)
     */
    function getEmberAmount(uint256 priceCents) public view returns (uint256) {
        uint256 emberPriceCents = getEmberPrice();
        if (emberPriceCents == 0) revert InvalidPriceFeed();
        
        // priceCents is in cents (2 decimals)
        // emberPriceCents is price per EMBER in cents with 8 decimals
        // We want EMBER amount with 18 decimals
        
        // Formula: (priceCents * 10^18 * 10^8) / emberPriceCents
        return (priceCents * 1e26) / emberPriceCents;
    }

    /**
     * @notice Get current EMBER price in cents (8 decimals)
     * @return price Price per EMBER in cents with 8 decimals
     */
    function getEmberPrice() public view returns (uint256) {
        if (manualPriceOverride > 0) {
            return manualPriceOverride;
        }
        
        if (priceFeed == address(0)) {
            // Default fallback price: $0.001 per EMBER = 0.1 cents = 10000000 (8 decimals)
            return 10000000;
        }

        // TODO: Implement actual oracle call (Chainlink/Pyth)
        // For now, return fallback
        return 10000000; // $0.001 per EMBER
    }

    /**
     * @notice Get app details
     * @param appId App ID
     * @return app App struct
     */
    function getApp(bytes32 appId) external view returns (App memory) {
        return apps[appId];
    }

    /**
     * @notice Get app ID from name and owner
     * @param name App name
     * @param owner App owner address
     * @return appId Computed app ID
     */
    function getAppId(string calldata name, address owner) external pure returns (bytes32) {
        return keccak256(abi.encodePacked(name, owner));
    }

    /**
     * @notice Get all apps by an owner
     * @param owner Owner address
     * @return appIds Array of app IDs
     */
    function getOwnerApps(address owner) external view returns (bytes32[] memory) {
        return ownerApps[owner];
    }

    /**
     * @notice Get total number of apps
     * @return count Total app count
     */
    function getAppCount() external view returns (uint256) {
        return allAppIds.length;
    }

    /**
     * @notice Get apps by status (paginated)
     * @param status Filter by status
     * @param offset Start index
     * @param limit Max results
     * @return appIds Array of matching app IDs
     */
    function getAppsByStatus(
        AppStatus status,
        uint256 offset,
        uint256 limit
    ) external view returns (bytes32[] memory) {
        // Count matching apps first
        uint256 matchCount = 0;
        for (uint256 i = 0; i < allAppIds.length; i++) {
            if (apps[allAppIds[i]].status == status) {
                matchCount++;
            }
        }

        // Apply pagination
        if (offset >= matchCount) {
            return new bytes32[](0);
        }
        
        uint256 resultCount = matchCount - offset;
        if (resultCount > limit) {
            resultCount = limit;
        }

        bytes32[] memory result = new bytes32[](resultCount);
        uint256 found = 0;
        uint256 added = 0;

        for (uint256 i = 0; i < allAppIds.length && added < resultCount; i++) {
            if (apps[allAppIds[i]].status == status) {
                if (found >= offset) {
                    result[added] = allAppIds[i];
                    added++;
                }
                found++;
            }
        }

        return result;
    }

    /**
     * @notice Check if an app is currently featured
     * @param appId App ID
     * @return isFeatured True if featured and not expired
     */
    function isAppFeatured(bytes32 appId) external view returns (bool) {
        App storage app = apps[appId];
        return app.featuredUntil > block.timestamp && 
               (app.tier == ListingTier.Featured || app.tier == ListingTier.Premium);
    }

    /**
     * @notice Get listing price in EMBER for each tier
     * @return basic EMBER for basic listing
     * @return featured EMBER for featured upgrade
     * @return premium EMBER for premium upgrade
     */
    function getListingPrices() external view returns (
        uint256 basic,
        uint256 featured,
        uint256 premium
    ) {
        basic = getEmberAmount(BASIC_PRICE_CENTS);
        featured = getEmberAmount(FEATURED_PRICE_CENTS);
        premium = getEmberAmount(PREMIUM_PRICE_CENTS);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console2} from "forge-std/Test.sol";
import {EmberAppStore} from "../src/EmberAppStore.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @notice Mock EMBER token for testing
contract MockEmber is ERC20 {
    constructor() ERC20("EMBER", "EMBER") {
        _mint(msg.sender, 1_000_000_000 ether);
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract EmberAppStoreTest is Test {
    EmberAppStore public store;
    MockEmber public ember;
    
    address public owner = address(this);
    address public agent1 = address(0x1111);
    address public agent2 = address(0x2222);
    address public stakingContract = address(0x3333);
    
    // Constants from contract
    uint256 constant BASIC_PRICE_CENTS = 1000;      // $10
    uint256 constant FEATURED_PRICE_CENTS = 5000;   // $50
    uint256 constant PREMIUM_PRICE_CENTS = 10000;   // $100
    address constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;
    
    function setUp() public {
        ember = new MockEmber();
        store = new EmberAppStore(
            address(ember),
            address(0), // No oracle, use fallback price
            stakingContract
        );
        
        // Fund test agents
        ember.mint(agent1, 1_000_000 ether);
        ember.mint(agent2, 1_000_000 ether);
        
        // Approve store to spend tokens
        vm.prank(agent1);
        ember.approve(address(store), type(uint256).max);
        vm.prank(agent2);
        ember.approve(address(store), type(uint256).max);
    }

    // ============ Submission Tests ============

    function test_SubmitApp() public {
        vm.prank(agent1);
        store.submitApp(
            "MyAgent",
            "An awesome AI agent",
            "https://myagent.com",
            "https://myagent.com/icon.png",
            EmberAppStore.Category.Tools,
            EmberAppStore.Audience.Both
        );

        bytes32 appId = store.getAppId("MyAgent", agent1);
        EmberAppStore.App memory app = store.getApp(appId);
        
        assertEq(app.owner, agent1);
        assertEq(app.name, "MyAgent");
        assertTrue(app.status == EmberAppStore.AppStatus.Pending);
        assertEq(store.totalApps(), 1);
    }

    function test_SubmitApp_BurnsTokens() public {
        uint256 burnBalanceBefore = ember.balanceOf(BURN_ADDRESS);
        uint256 agent1BalanceBefore = ember.balanceOf(agent1);
        
        vm.prank(agent1);
        store.submitApp(
            "MyAgent",
            "An awesome AI agent",
            "https://myagent.com",
            "https://myagent.com/icon.png",
            EmberAppStore.Category.Tools,
            EmberAppStore.Audience.Both
        );

        uint256 expectedBurn = store.getEmberAmount(BASIC_PRICE_CENTS);
        
        assertEq(ember.balanceOf(BURN_ADDRESS), burnBalanceBefore + expectedBurn);
        assertEq(ember.balanceOf(agent1), agent1BalanceBefore - expectedBurn);
        assertEq(store.totalBurned(), expectedBurn);
    }

    function test_SubmitApp_RevertWhen_DuplicateName() public {
        vm.startPrank(agent1);
        store.submitApp(
            "MyAgent",
            "First version",
            "https://myagent.com",
            "",
            EmberAppStore.Category.Tools,
            EmberAppStore.Audience.Both
        );

        vm.expectRevert(EmberAppStore.AppAlreadyExists.selector);
        store.submitApp(
            "MyAgent",
            "Second version",
            "https://myagent2.com",
            "",
            EmberAppStore.Category.Tools,
            EmberAppStore.Audience.Both
        );
        vm.stopPrank();
    }

    function test_SubmitApp_SameNameDifferentOwner() public {
        vm.prank(agent1);
        store.submitApp(
            "MyAgent",
            "Agent 1's version",
            "https://agent1.com",
            "",
            EmberAppStore.Category.Tools,
            EmberAppStore.Audience.Both
        );

        vm.prank(agent2);
        store.submitApp(
            "MyAgent",
            "Agent 2's version",
            "https://agent2.com",
            "",
            EmberAppStore.Category.Tools,
            EmberAppStore.Audience.Both
        );

        assertEq(store.totalApps(), 2);
    }

    function test_SubmitApp_RevertWhen_EmptyName() public {
        vm.prank(agent1);
        vm.expectRevert(EmberAppStore.EmptyString.selector);
        store.submitApp(
            "",
            "Description",
            "https://myagent.com",
            "",
            EmberAppStore.Category.Tools,
            EmberAppStore.Audience.Both
        );
    }

    function test_SubmitApp_RevertWhen_EmptyUrl() public {
        vm.prank(agent1);
        vm.expectRevert(EmberAppStore.EmptyString.selector);
        store.submitApp(
            "MyAgent",
            "Description",
            "",
            "",
            EmberAppStore.Category.Tools,
            EmberAppStore.Audience.Both
        );
    }

    // ============ Approval Tests ============

    function test_ApproveApp() public {
        vm.prank(agent1);
        store.submitApp(
            "MyAgent",
            "Description",
            "https://myagent.com",
            "",
            EmberAppStore.Category.Tools,
            EmberAppStore.Audience.Both
        );

        bytes32 appId = store.getAppId("MyAgent", agent1);
        
        store.approveApp(appId);
        
        EmberAppStore.App memory app = store.getApp(appId);
        assertTrue(app.status == EmberAppStore.AppStatus.Approved);
        assertTrue(app.approvedAt > 0);
    }

    function test_RejectApp() public {
        vm.prank(agent1);
        store.submitApp(
            "MyAgent",
            "Description",
            "https://myagent.com",
            "",
            EmberAppStore.Category.Tools,
            EmberAppStore.Audience.Both
        );

        bytes32 appId = store.getAppId("MyAgent", agent1);
        
        store.rejectApp(appId, "Malicious content detected");
        
        EmberAppStore.App memory app = store.getApp(appId);
        assertTrue(app.status == EmberAppStore.AppStatus.Rejected);
    }

    function test_ApproveApp_RevertWhen_NotOwner() public {
        vm.prank(agent1);
        store.submitApp(
            "MyAgent",
            "Description",
            "https://myagent.com",
            "",
            EmberAppStore.Category.Tools,
            EmberAppStore.Audience.Both
        );

        bytes32 appId = store.getAppId("MyAgent", agent1);
        
        vm.prank(agent2);
        vm.expectRevert();
        store.approveApp(appId);
    }

    // ============ Upgrade Tests ============

    function test_UpgradeToFeatured() public {
        // Submit and approve
        vm.prank(agent1);
        store.submitApp(
            "MyAgent",
            "Description",
            "https://myagent.com",
            "",
            EmberAppStore.Category.Tools,
            EmberAppStore.Audience.Both
        );

        bytes32 appId = store.getAppId("MyAgent", agent1);
        store.approveApp(appId);

        // Upgrade to featured
        uint256 burnBefore = ember.balanceOf(BURN_ADDRESS);
        uint256 stakerBefore = ember.balanceOf(stakingContract);
        
        vm.prank(agent1);
        store.upgradeApp(appId, EmberAppStore.ListingTier.Featured);

        uint256 expectedFee = store.getEmberAmount(FEATURED_PRICE_CENTS);
        uint256 expectedBurn = expectedFee / 2;
        uint256 expectedStaker = expectedFee - expectedBurn;

        assertEq(ember.balanceOf(BURN_ADDRESS), burnBefore + expectedBurn);
        assertEq(ember.balanceOf(stakingContract), stakerBefore + expectedStaker);
        
        EmberAppStore.App memory app = store.getApp(appId);
        assertTrue(app.tier == EmberAppStore.ListingTier.Featured);
        assertTrue(app.featuredUntil > block.timestamp);
        assertTrue(store.isAppFeatured(appId));
    }

    function test_UpgradeToPremium() public {
        // Submit and approve
        vm.prank(agent1);
        store.submitApp(
            "MyAgent",
            "Description",
            "https://myagent.com",
            "",
            EmberAppStore.Category.Tools,
            EmberAppStore.Audience.Both
        );

        bytes32 appId = store.getAppId("MyAgent", agent1);
        store.approveApp(appId);

        // Upgrade to premium
        vm.prank(agent1);
        store.upgradeApp(appId, EmberAppStore.ListingTier.Premium);

        EmberAppStore.App memory app = store.getApp(appId);
        assertTrue(app.tier == EmberAppStore.ListingTier.Premium);
    }

    function test_UpgradeApp_RevertWhen_NotApproved() public {
        vm.prank(agent1);
        store.submitApp(
            "MyAgent",
            "Description",
            "https://myagent.com",
            "",
            EmberAppStore.Category.Tools,
            EmberAppStore.Audience.Both
        );

        bytes32 appId = store.getAppId("MyAgent", agent1);

        vm.prank(agent1);
        vm.expectRevert(EmberAppStore.InvalidStatus.selector);
        store.upgradeApp(appId, EmberAppStore.ListingTier.Featured);
    }

    function test_UpgradeApp_RevertWhen_AlreadyFeatured() public {
        // Submit and approve
        vm.prank(agent1);
        store.submitApp(
            "MyAgent",
            "Description",
            "https://myagent.com",
            "",
            EmberAppStore.Category.Tools,
            EmberAppStore.Audience.Both
        );

        bytes32 appId = store.getAppId("MyAgent", agent1);
        store.approveApp(appId);

        // First upgrade
        vm.prank(agent1);
        store.upgradeApp(appId, EmberAppStore.ListingTier.Featured);

        // Try to upgrade again
        vm.prank(agent1);
        vm.expectRevert(EmberAppStore.AlreadyFeatured.selector);
        store.upgradeApp(appId, EmberAppStore.ListingTier.Premium);
    }

    function test_UpgradeApp_CanReupgradeAfterExpiry() public {
        // Submit and approve
        vm.prank(agent1);
        store.submitApp(
            "MyAgent",
            "Description",
            "https://myagent.com",
            "",
            EmberAppStore.Category.Tools,
            EmberAppStore.Audience.Both
        );

        bytes32 appId = store.getAppId("MyAgent", agent1);
        store.approveApp(appId);

        // First upgrade
        vm.prank(agent1);
        store.upgradeApp(appId, EmberAppStore.ListingTier.Featured);

        // Fast forward past expiry
        vm.warp(block.timestamp + 8 days);
        assertFalse(store.isAppFeatured(appId));

        // Should be able to upgrade again
        vm.prank(agent1);
        store.upgradeApp(appId, EmberAppStore.ListingTier.Premium);
        assertTrue(store.isAppFeatured(appId));
    }

    // ============ Update Tests ============

    function test_UpdateApp() public {
        vm.prank(agent1);
        store.submitApp(
            "MyAgent",
            "Old description",
            "https://old.com",
            "",
            EmberAppStore.Category.Tools,
            EmberAppStore.Audience.Both
        );

        bytes32 appId = store.getAppId("MyAgent", agent1);
        store.approveApp(appId);

        vm.prank(agent1);
        store.updateApp(appId, "New description", "https://new.com", "https://icon.com");

        EmberAppStore.App memory app = store.getApp(appId);
        assertEq(app.description, "New description");
        assertEq(app.url, "https://new.com");
        assertEq(app.iconUrl, "https://icon.com");
        // Should go back to pending for re-review
        assertTrue(app.status == EmberAppStore.AppStatus.Pending);
    }

    function test_UpdateApp_RevertWhen_NotOwner() public {
        vm.prank(agent1);
        store.submitApp(
            "MyAgent",
            "Description",
            "https://myagent.com",
            "",
            EmberAppStore.Category.Tools,
            EmberAppStore.Audience.Both
        );

        bytes32 appId = store.getAppId("MyAgent", agent1);

        vm.prank(agent2);
        vm.expectRevert(EmberAppStore.NotAppOwner.selector);
        store.updateApp(appId, "Hacked", "https://evil.com", "");
    }

    // ============ View Tests ============

    function test_GetListingPrices() public view {
        (uint256 basic, uint256 featured, uint256 premium) = store.getListingPrices();
        
        // With default $0.001 price, $10 = 10,000 EMBER
        assertGt(basic, 0);
        assertGt(featured, basic);
        assertGt(premium, featured);
    }

    function test_GetAppsByStatus() public {
        // Submit multiple apps
        vm.startPrank(agent1);
        store.submitApp("App1", "Desc", "https://1.com", "", EmberAppStore.Category.Tools, EmberAppStore.Audience.Both);
        store.submitApp("App2", "Desc", "https://2.com", "", EmberAppStore.Category.Games, EmberAppStore.Audience.Humans);
        store.submitApp("App3", "Desc", "https://3.com", "", EmberAppStore.Category.DeFi, EmberAppStore.Audience.AIs);
        vm.stopPrank();

        // Approve one
        bytes32 app1Id = store.getAppId("App1", agent1);
        store.approveApp(app1Id);

        // Get pending apps
        bytes32[] memory pendingApps = store.getAppsByStatus(EmberAppStore.AppStatus.Pending, 0, 10);
        assertEq(pendingApps.length, 2);

        // Get approved apps
        bytes32[] memory approvedApps = store.getAppsByStatus(EmberAppStore.AppStatus.Approved, 0, 10);
        assertEq(approvedApps.length, 1);
    }

    function test_GetOwnerApps() public {
        vm.startPrank(agent1);
        store.submitApp("App1", "Desc", "https://1.com", "", EmberAppStore.Category.Tools, EmberAppStore.Audience.Both);
        store.submitApp("App2", "Desc", "https://2.com", "", EmberAppStore.Category.Games, EmberAppStore.Audience.Both);
        vm.stopPrank();

        bytes32[] memory agent1Apps = store.getOwnerApps(agent1);
        assertEq(agent1Apps.length, 2);

        bytes32[] memory agent2Apps = store.getOwnerApps(agent2);
        assertEq(agent2Apps.length, 0);
    }

    // ============ Admin Tests ============

    function test_SetManualPrice() public {
        // Default price should be $0.001 = 10000000 (in cents with 8 decimals)
        assertEq(store.getEmberPrice(), 10000000);

        // Set to $0.01 = 1000000000 (100x higher)
        store.setManualPrice(100000000);
        assertEq(store.getEmberPrice(), 100000000);

        // Listing should cost 10x less EMBER now
        uint256 basicPrice = store.getEmberAmount(BASIC_PRICE_CENTS);
        // At $0.01 per EMBER, $10 = 1000 EMBER
        assertEq(basicPrice, 1000 ether);
    }

    function test_DelistApp() public {
        vm.prank(agent1);
        store.submitApp(
            "BadApp",
            "Description",
            "https://bad.com",
            "",
            EmberAppStore.Category.Tools,
            EmberAppStore.Audience.Both
        );

        bytes32 appId = store.getAppId("BadApp", agent1);
        store.approveApp(appId);
        
        store.delistApp(appId);

        EmberAppStore.App memory app = store.getApp(appId);
        assertTrue(app.status == EmberAppStore.AppStatus.Delisted);
    }

    // ============ Fuzz Tests ============

    function testFuzz_SubmitMultipleApps(uint8 count) public {
        vm.assume(count > 0 && count <= 50);
        
        vm.startPrank(agent1);
        for (uint256 i = 0; i < count; i++) {
            string memory name = string(abi.encodePacked("App", vm.toString(i)));
            store.submitApp(
                name,
                "Description",
                "https://app.com",
                "",
                EmberAppStore.Category.Tools,
                EmberAppStore.Audience.Both
            );
        }
        vm.stopPrank();

        assertEq(store.totalApps(), count);
        assertEq(store.getOwnerApps(agent1).length, count);
    }
}

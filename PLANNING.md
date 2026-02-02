# Ember App Store - Planning

## One-Liner
An app store where AI agents list their apps and pay EMBER tokens.

## Problem Statement
AI agents are building apps but have no central place to list and discover them.
Traditional app stores don't cater to agent-built apps or the agent economy.

## Success Criteria
- [ ] Agents can submit apps via contract
- [ ] USD-pegged pricing (paid in EMBER)
- [ ] Basic listings: 100% burned
- [ ] Featured/Premium: 50% burn, 50% to stakers
- [ ] Review queue for owner approval
- [ ] Frontend at apps.ember.engineer

## Scope

### IN (MVP)
- Submit app with metadata
- Approve/reject apps (owner)
- Upgrade to featured/premium tiers
- View apps by status/category
- EMBER token payment

### OUT (Future)
- Actual oracle integration (using fallback price for now)
- User ratings/reviews
- App analytics
- API endpoints for programmatic listing
- Search functionality

### NON-GOALS
- Hosting apps (we just list them)
- Processing payments for apps (that's on the app creator)
- Mobile app store

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| EMBER price volatility | Listings become too cheap/expensive | USD-pegged pricing |
| Spam submissions | Cluttered store | Listing fee + manual review |
| Malicious apps listed | Reputation damage | Manual review before approval |
| Oracle failure | Can't calculate prices | Fallback price + manual override |

## Architecture

```
┌─────────────────────────────────────────┐
│           EmberAppStore.sol             │
├─────────────────────────────────────────┤
│ - submitApp() → burns $10 EMBER         │
│ - upgradeApp() → 50/50 burn/stakers     │
│ - approveApp() → owner only             │
│ - rejectApp() → owner only              │
│ - delistApp() → owner only              │
├─────────────────────────────────────────┤
│ Views:                                  │
│ - getApp(), getAppsByStatus()           │
│ - getListingPrices(), isAppFeatured()   │
└─────────────────────────────────────────┘
```

## Pricing

| Tier | USD Price | EMBER Destination |
|------|-----------|-------------------|
| Basic | $10 | 100% burn |
| Featured | $50 | 50% burn / 50% stakers |
| Premium | $100 | 50% burn / 50% stakers |

Featured/Premium last 7 days, can be renewed after expiry.

## Contract Addresses

| Item | Address | Chain |
|------|---------|-------|
| EmberAppStore (testnet) | 0xaf5894aBDeeFA800a0D1c01502d3D6691263DeBa | Base Sepolia |
| EmberAppStore (mainnet) | TBD | Base Mainnet |
| EMBER Token | 0x1b6A569DD61EdCe3C383f30E32b7A489E8441B09 | Base |
| Staking Contract | TBD (EmberStaking) | Base |

## Timeline

- [x] Contract written
- [x] Tests passing (24)
- [x] Self-audit 3x (AUDIT_STATUS.md created)
- [x] Deploy testnet (Base Sepolia)
- [ ] Frontend MVP
- [ ] Deploy mainnet
- [ ] Announce on X

## Notes

- Using fallback price of $0.001/EMBER until oracle integration
- Manual price override available for owner
- App IDs are keccak256(name, owner) - same name can be used by different owners

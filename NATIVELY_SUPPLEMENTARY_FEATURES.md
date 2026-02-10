# Supplementary Features & Enhancements for ghetto.finance Android App

This document covers features present in the web app that were not fully detailed in the main 10 phases.

---

## MISSING FEATURE 1: Complete Escrow Contract Integration

**Status:** Phase 5 covers basic checkout, but several critical escrow functions are missing.

**Contract Address:** 0xC05B7db1C24027BC062088F8F10C38836e660392 (Polygon Mainnet)

### Missing Escrow Functions to Implement:

#### 1. Seller Agreement Flow (Phase 5 Enhancement)
Before a buyer can fund an order, the seller must agree and have collateral deposited.

**When creating order:**
- Call `escrow.agreeToOrder(orderId)` as the seller
- This holds GHETTO collateral equivalent to order amount
- Only after seller agrees can buyer fund the order

**Seller Collateral Management:**
- `depositGhettoCollateral(amount)` - deposit GHETTO to enable selling (min 100 GHETTO)
- `getAvailableCollateral(seller)` - check how much collateral is available for new orders
- `withdrawGhettoCollateral(amount)` - withdraw excess collateral (must maintain minimum)

**UI Changes:**
- In Seller Dashboard (Phase 9), add "Collateral Balance" card showing:
  - Total deposited GHETTO
  - Held amount (locked in active orders)
  - Available amount (free to use or withdraw)
- "Deposit Collateral" and "Withdraw Collateral" buttons

#### 2. Order Fulfillment Flow (Phase 6 Enhancement)
**Seller Actions:**
- After order is funded, call `escrow.markAsShipped(orderId)`
- This sets deliveryDeadline = now + 7 days

**Buyer Actions:**
- Call `escrow.confirmDelivery(orderId)` to release funds to seller
- Auto-complete: anyone can call `escrow.autoCompleteOrder(orderId)` after 7-day window expires

**Seller Earnings Withdrawal:**
- After order completes, seller's balance is stored in contract
- Call `escrow.withdrawSellerBalance(tokenAddress)` to claim earnings
- Show "Available to Withdraw" balance in Seller Dashboard

#### 3. Dispute Resolution Flow (Phase 6 Enhancement)
**Raising Dispute:**
- Call `escrow.raiseDispute(orderId)` as buyer or seller
- This changes order status to Disputed and blocks auto-completion

**Admin/Mediator Resolution:**
- Admin calls `escrow.resolveDispute(orderId, favorBuyer: bool)`
- If favorBuyer=true: refund buyer, release seller collateral
- If favorBuyer=false: pay seller, complete order normally

#### 4. Order Cancellation (Phase 6 Enhancement)
- Call `escrow.cancelOrder(orderId)` for unfunded orders only
- Releases seller's held collateral

**Full Escrow Integration Checklist:**
- [ ] depositGhettoCollateral() on seller onboarding
- [ ] createOrder() when buyer clicks "Buy Now"
- [ ] agreeToOrder() when seller accepts order
- [ ] fundOrder() when buyer pays
- [ ] markAsShipped() when seller ships
- [ ] confirmDelivery() when buyer receives item
- [ ] autoCompleteOrder() for expired orders
- [ ] withdrawSellerBalance() to claim earnings
- [ ] raiseDispute() for problems
- [ ] resolveDispute() for mediators
- [ ] cancelOrder() for unfunded orders

---

## MISSING FEATURE 2: Sponsorship Marketplace

**Status:** Mentioned briefly in Phase 9, but not implemented. This is a core revenue model.

**Overview:** Sponsors (investors) stake GHETTO tokens to sellers in exchange for a percentage of their sales revenue.

### Implementation Guide:

#### Sponsorship Request Creation (Seller Side)
Add to Seller Dashboard (Phase 9):

**Create Sponsorship Request Screen:**
- Title (e.g., "Expand Electronics Inventory")
- Description (what the funding will be used for)
- Amount Requested (GHETTO tokens needed)
- Revenue Percentage (what % of sales goes to sponsors, e.g., 10%)
- Duration (30/60/90/180 days)
- Category (Inventory, Marketing, Equipment, etc.)
- "Submit Request" button - inserts to sponsorship_requests table

**My Sponsorship Requests (in Seller Dashboard):**
- List of seller's requests with status: draft, active, funded, expired, cancelled
- Each card shows: title, amount requested, amount funded, revenue %, status
- "Edit" or "Cancel" for draft requests
- Analytics for funded requests:
  - Total invested
  - Total revenue shared
  - Active sponsors count
  - Earnings vs. payout ratio

#### Sponsorship Investment (Sponsor Side)
Add new tab to main navigation OR section in Wallet tab:

**Sponsorship Marketplace Screen:**
- Browse active sponsorship requests from all sellers
- Filter by: category, amount, revenue %, seller rating
- Each card shows:
  - Seller @handle, rating, verified badge
  - Request title and description
  - Amount requested / amount funded (progress bar)
  - Revenue percentage offered
  - Duration remaining
  - "Invest" button

**Invest in Request Screen:**
- Show request details
- Input amount to invest (in GHETTO)
- Calculate your percentage share of the request
- Estimated monthly revenue (based on seller's sales history)
- Risk disclaimer
- "Confirm Investment" button - inserts to sponsorship_investments table

**My Investments Dashboard:**
- List of all investments with status
- Each card shows:
  - Request title, seller @handle
  - Amount invested, percentage share
  - Revenue earned to date
  - ROI percentage
  - Status: active, completed, expired
- Total portfolio summary:
  - Total invested
  - Total earned
  - Average ROI
  - Active investments count

#### Automatic Revenue Sharing (Backend Integration)
When an order completes:
1. Query active sponsorships for the seller
2. Calculate sponsor payouts from order total
3. Distribute revenue:
   - Sponsor gets their percentage
   - Seller gets remaining amount
4. Record transaction in sponsorship_transactions table
5. Update investment.revenue_earned

**Tables Used:**
- `sponsorship_requests` - seller funding requests
- `sponsorship_investments` - sponsor stakes
- `sponsorship_transactions` - revenue share history

**Supabase Queries:**
- SELECT from sponsorship_requests WHERE status='active'
- INSERT into sponsorship_investments
- SELECT from sponsorship_investments WHERE sponsor_id = me
- INSERT into sponsorship_transactions on order completion

---

## MISSING FEATURE 3: Atomic Swaps (Direct Token Trading)

**Status:** Not mentioned in any phase. This is for P2P token swaps without going through marketplace.

**Contract Address:** TBD (needs deployment)

**Overview:** Users can directly swap tokens with each other using the AtomicSwap smart contract.

### Implementation as New Feature (Optional):

**Swap Tab (add as 6th tab OR section in Wallet tab):**

**Create Swap Screen:**
- Your offer: select token (GHETTO/USDC/MATIC) and amount
- You want: select token and amount
- Recipient address (or search by @handle)
- Duration: 1 hour / 6 hours / 1 day / 3 days / 7 days
- "Create Swap" button - calls atomicSwap.createSwap()

**Active Swaps List:**
- Swaps I initiated
- Swaps where I'm the recipient
- Each card shows:
  - Counterparty @handle
  - Your tokens <-> Their tokens
  - Status: waiting for deposits, partially funded, completed, expired, cancelled
  - Time remaining
  - Action buttons: "Deposit Tokens" or "Cancel"

**Deposit Flow:**
- Approve token for AtomicSwap contract
- Call depositInitiatorTokens() or depositRecipientTokens()
- When both parties deposit, swap completes automatically
- Tokens are immediately transferred to respective parties

**Contract Functions:**
- `createSwap(swapId, recipient, initiatorToken, recipientToken, initiatorAmount, recipientAmount, duration)`
- `depositInitiatorTokens(swapId)` - initiator deposits their tokens
- `depositRecipientTokens(swapId)` - recipient deposits their tokens
- `cancelSwap(swapId)` - either party can cancel, refunds deposited tokens
- `getSwap(swapId)` - query swap details

---

## MISSING FEATURE 4: Enhanced Reown/WalletConnect Integration

**Status:** Mentioned in Phase 4 with project ID, but needs more detail.

**Project ID:** b9b4eef80d3ef333b26790780966d938

### Complete Reown Integration:

#### Dependencies (build.gradle):
```kotlin
implementation("com.walletconnect:android-core:1.x.x")
implementation("com.walletconnect:web3modal:1.x.x")
```

#### Reown Setup (in Application class or main activity):
```kotlin
val projectId = "b9b4eef80d3ef333b26790780966d938"
val appMetadata = Core.Model.AppMetaData(
    name = "ghetto.finance",
    description = "Decentralized P2P Crypto Marketplace",
    url = "https://ghetto.finance",
    icons = listOf("https://ghetto.finance/icon.png"),
    redirect = "ghettofinance://wc"
)

CoreClient.initialize(
    relayServerUrl = "wss://relay.walletconnect.com",
    projectId = projectId,
    metaData = appMetadata
)
```

#### Wallet Connection Flow:
1. User taps "Connect Wallet" in Wallet tab
2. Show Web3Modal with supported wallets:
   - MetaMask
   - Coinbase Wallet
   - Trust Wallet
   - Rainbow
   - WalletConnect (generic QR code for other wallets)
3. User selects wallet, approves connection in their wallet app
4. Save session and wallet address
5. Update profiles.wallet_address in Supabase

#### Network Switching:
- Ensure connected to Polygon Mainnet (Chain ID 137)
- If wrong network, show "Switch to Polygon" button
- Call wallet_switchEthereumChain RPC method

#### Transaction Signing:
- For all contract interactions, use WalletConnect to sign transactions
- Show transaction preview in modal before signing
- Handle rejections gracefully

#### Session Management:
- Persist session across app restarts
- Auto-reconnect on app launch
- "Disconnect" button clears session

---

## MISSING FEATURE 5: Housing NFT Marketplace (Advanced/Optional)

**Status:** Not covered. This is a complex feature for tokenized real estate.

**Decision:** Recommend skipping for initial Android MVP and keeping web-only for now. Can be added in future phases if needed.

**Reason:** Housing NFTs require:
- Complex legal disclosures
- Investor accreditation verification
- Multi-party escrow (developer, investors, treasurers)
- Project milestone tracking
- Revenue distribution logic

This adds significant complexity and may not be essential for a marketplace-focused mobile app.

---

## MISSING FEATURE 6: Offramper System (Cash-to-Crypto)

**Status:** Not covered. This is for local cash exchanges.

**Decision:** Recommend skipping for initial Android MVP. This feature requires:
- KYC document uploads
- Bank account verification
- Location-based matching
- Trust/reputation system beyond standard marketplace

Can be added later if there's demand, but it's not core to the marketplace experience.

---

## IMPLEMENTATION PRIORITY RECOMMENDATIONS:

**MUST IMPLEMENT:**
1. Complete Escrow Integration - Critical for marketplace functionality
2. Seller Collateral Management - Required for escrow to work
3. Enhanced Reown Integration - Better wallet UX

**SHOULD IMPLEMENT:**
4. Sponsorship Marketplace - Core revenue model, differentiator

**NICE TO HAVE:**
5. Atomic Swaps - Adds trading functionality beyond marketplace

**SKIP FOR MVP:**
6. Housing NFT Marketplace - Too complex for mobile MVP
7. Offramper System - Not essential for core marketplace

---

## DATABASE VERIFICATION:

All required Supabase tables exist:
- ✅ profiles (with wallet_address)
- ✅ products (with condition, quantity)
- ✅ orders (with tracking fields)
- ✅ dispute_cases
- ✅ auctions, auction_bids
- ✅ conversations, messages
- ✅ posts, follows, bookmarks
- ✅ sponsorship_requests
- ✅ sponsorship_investments
- ✅ sponsorship_transactions
- ✅ atomic_swaps
- ✅ contract_deployments
- ✅ referral_codes, referral_balances, referral_transactions
- ✅ terms_acceptances

The backend is fully ready.

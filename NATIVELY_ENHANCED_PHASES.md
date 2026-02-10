# Enhanced Natively.dev Prompts - Critical Updates

These are enhanced versions of specific phases that need more detail for complete implementation.

---

## ENHANCED PHASE 5 of 10: Shopping Cart & Complete Escrow Checkout

```
Enhanced Phase 5 of 10: Shopping Cart & Complete Escrow Checkout. Building on Phase 1-4. This implements the full escrow purchase flow.

ESCROW CONTRACT: 0xC05B7db1C24027BC062088F8F10C38836e660392 on Polygon Mainnet

CART SCREEN (same as original Phase 5)

SELLER COLLATERAL REQUIREMENT:
Before sellers can receive orders, they must deposit GHETTO collateral. Add to Seller Dashboard:
- "Collateral Status" card showing:
  - Total deposited: XX GHETTO
  - Held in orders: XX GHETTO
  - Available: XX GHETTO
- "Deposit Collateral" button (min 100 GHETTO)
- Call escrow.depositGhettoCollateral(amount) via WalletConnect
- "Withdraw Collateral" button (only available amount, maintains minimum)
- Call escrow.withdrawGhettoCollateral(amount)

CHECKOUT FLOW (Enhanced with Seller Agreement):

Step 1 — Payment Method (same as original)

Step 2 — Create Order On-Chain:
- Call escrow.createOrder(orderId, sellerAddress, amount, paymentToken)
- This creates order in contract with status=Created
- Save order to Supabase orders table with status='created', escrow_tx_hash

Step 3 — Wait for Seller Agreement:
- Seller receives notification "New Order Pending"
- Seller views order details in their dashboard
- Seller clicks "Accept Order" which calls escrow.agreeToOrder(orderId)
- This holds GHETTO collateral (1:1 with order value)
- Buyer sees "Waiting for seller to accept..." with loading spinner
- When seller agrees, buyer proceeds to Step 4

Step 4 — Fund Order:
- If paying with ERC-20: approve token for escrow contract
- Call escrow.fundOrder(orderId)
- Payment is transferred to escrow contract
- Order status changes to 'funded'
- Update Supabase orders table status='funded', funded_at timestamp

Step 5 — Success:
- Green checkmark, "Order Placed!"
- Order ID, escrow transaction hash link
- "View Order" button to order tracking screen

SELLER ACTIONS (after order funded):
- In Seller Dashboard, seller sees "Ship Order" button
- Seller adds tracking number (optional)
- Seller calls escrow.markAsShipped(orderId)
- This starts 7-day delivery countdown
- Update Supabase orders: status='shipped', tracking_number, shipped_at

BUY NOW MODAL: same as original, single-item checkout with full 5-step flow
MAKE OFFER MODAL: same as original
```

---

## ENHANCED PHASE 6 of 10: Order Management & Complete Lifecycle

```
Enhanced Phase 6 of 10: Order Management, Delivery Confirmation & Dispute Resolution. Building on Phase 1-5.

ORDER DETAIL SCREEN (Enhanced):

Status Timeline (vertical stepper):
1. Order Created ✓
2. Seller Agreed ✓ (show collateral held badge)
3. Payment Funded ✓ (escrow locked badge)
4. Shipped → current if shipped (tracking info shown)
5. Delivered → current after buyer confirms
6. Completed / Funds Released → final state

BUYER DELIVERY CONFIRMATION:
- After status=shipped, buyer sees "Confirm Delivery" NeonButton
- Tap opens confirmation dialog: "Have you received your order in good condition?"
- "Yes, Confirm Delivery" button calls escrow.confirmDelivery(orderId)
- This immediately releases funds to seller (minus platform fee)
- Seller's held GHETTO collateral is released
- Order status changes to 'completed'
- Update Supabase: status='completed', delivered_at, funds_released_at

AUTO-RELEASE COUNTDOWN:
- If buyer doesn't confirm within 7 days of shipping, show countdown timer
- "Funds auto-release in X days, X hours" in orange text
- After 7 days, anyone can call escrow.autoCompleteOrder(orderId)
- Same effect as manual confirmation: releases funds, completes order

SELLER EARNINGS WITHDRAWAL:
- In Seller Dashboard, show "Available Earnings" card
- Call escrow.getSellerBalance(myAddress, tokenAddress) for each token
- List: "XX USDC available", "XX GHETTO available", etc.
- "Withdraw" button for each token calls escrow.withdrawSellerBalance(tokenAddress)
- Success toast: "Withdrawn XX USDC to your wallet"

DISPUTE FLOW (Enhanced):

"Open Dispute" Button (available 0-3 days after shipping):
- Opens Dispute Creation screen
- Reason: Item Not Received, Not As Described, Damaged, Counterfeit, Other
- Description (required, min 50 chars)
- Evidence: up to 5 photos
- "Submit Dispute" calls escrow.raiseDispute(orderId)
- This changes order status to 'disputed' on-chain and in Supabase
- Creates row in dispute_cases table
- Funds remain locked in escrow, seller collateral remains held

DISPUTE DETAIL SCREEN (Enhanced):
- Case ID, status, timestamps
- Plaintiff and defendant info
- Reason and description
- Evidence gallery (images from both parties)
- Comments thread (real-time updates via Supabase)
- Mediator can see "Resolve Dispute" buttons (admin only):
  - "Refund Buyer" — calls escrow.resolveDispute(orderId, true)
    - Buyer receives full refund
    - Seller's collateral is released
    - Order marked as cancelled
  - "Release to Seller" — calls escrow.resolveDispute(orderId, false)
    - Seller receives payment
    - Order marked as completed
- Resolution shown with outcome badge and mediator comment

ORDER CANCELLATION:
- Only for unfunded orders (status='created' or seller hasn't agreed)
- Buyer or seller can tap "Cancel Order"
- Calls escrow.cancelOrder(orderId)
- Releases seller's held collateral if they had agreed
- Marks order as cancelled in Supabase

COMPLETED ORDERS TAB: same as original
REAL-TIME UPDATES: same as original
```

---

## ENHANCED PHASE 9 of 10: Seller Dashboard, Product Management & Sponsorships

```
Enhanced Phase 9 of 10: Seller Dashboard, Product Management & Sponsorship Marketplace. Building on Phase 1-8.

SELLER DASHBOARD (Enhanced):

Top Stats (5 cards in horizontal scroll):
1. Total Revenue (from completed orders)
2. Available Earnings (ready to withdraw from escrow)
3. Active Listings
4. Total Sales
5. Collateral Status (deposited/held/available GHETTO)

COLLATERAL MANAGEMENT CARD (new):
- Large card showing collateral breakdown:
  - Total Deposited: XXX GHETTO
  - Held in Orders: XX GHETTO (locked during active sales)
  - Available: XXX GHETTO (can be used for new orders or withdrawn)
- "Deposit Collateral" button → input amount (min 100 GHETTO total)
  - Calls escrow.depositGhettoCollateral(amount)
- "Withdraw Collateral" button (disabled if insufficient available)
  - Calls escrow.withdrawGhettoCollateral(amount)
- Info tooltip: "Collateral is required to sell. 100 GHETTO minimum, 1:1 ratio with order values"

EARNINGS WITHDRAWAL CARD (new):
- Show balances ready to withdraw for each token
- Query escrow.getSellerBalance(myAddress, tokenAddress)
- List each token with balance > 0:
  - "XX.XX USDC available"
  - "XX.XX GHETTO available"
  - "X.XX MATIC available"
- Each has "Withdraw" button → calls escrow.withdrawSellerBalance(tokenAddress)

MY LISTINGS: same as original
CREATE/EDIT PRODUCT: same as original
SALES HISTORY: same as original
SELLER VERIFICATION: same as original

SPONSORSHIP MARKETPLACE (NEW SECTION):

"Sponsorships" Tab in Seller Dashboard:

MY SPONSORSHIP REQUESTS:
- List of funding requests I've created
- Each card shows:
  - Title, description
  - Amount requested: XXX GHETTO
  - Amount funded: XX/XXX GHETTO (progress bar)
  - Revenue share: X%
  - Duration: X days remaining
  - Status: draft, active, funded, expired, cancelled
  - Number of sponsors
- Tap card to view details and analytics

CREATE SPONSORSHIP REQUEST (FAB "+" button):
- Title (e.g., "Expand Electronics Inventory")
- Description: what the funds will be used for (min 100 chars)
- Amount Requested: input in GHETTO (min 100, max 10000)
- Revenue Percentage: slider 5-25% (what sponsors earn from my sales)
- Duration: dropdown (30/60/90/180 days)
- Category: Inventory, Marketing, Equipment, Expansion, Other
- "Submit Request" button → inserts to sponsorship_requests table with status='active'
- Success: "Request published! Sponsors can now invest."

REQUEST ANALYTICS SCREEN:
- Total invested, total revenue shared
- Active sponsors list with their investment amounts
- Revenue transactions history
- Projected payout based on current sales rate
- "End Request Early" button (if no longer needed)

SPONSOR INVESTMENTS DASHBOARD (NEW SCREEN):

Accessible from main navigation or Wallet tab:

BROWSE SPONSORSHIP REQUESTS:
- Grid of active requests from all sellers
- Filter chips: All Categories, Inventory, Marketing, Equipment, Expansion
- Sort: Newest, Highest ROI Potential, Nearly Funded, Expiring Soon
- Each card shows:
  - Seller avatar, @handle, rating, verified badge
  - Request title (bold)
  - Progress: XX/XXX GHETTO funded (progress bar)
  - Revenue share: X%
  - Duration: X days remaining
  - Estimated monthly return (based on seller's sales history)
  - "Invest" button

INVEST IN REQUEST SCREEN:
- Full request details
- Seller profile summary (sales history, rating, completed trades)
- Amount to invest: input in GHETTO (min 10)
- Your share calculation: "You will own X.X% of this request"
- Estimated returns: "Based on seller's avg sales, potential XX GHETTO/month"
- Risk disclaimer: "Investments carry risk. Seller performance not guaranteed."
- "Confirm Investment" button → inserts to sponsorship_investments table
- Success: "Investment recorded! You'll earn revenue from future sales."

MY INVESTMENTS:
- List all my sponsorship investments
- Each card shows:
  - Request title, seller @handle
  - Amount invested: XX GHETTO
  - My share: X.X%
  - Revenue earned: XX GHETTO
  - ROI: +XX.X%
  - Status: active, completed, expired
- Tap for detailed analytics

INVESTMENT DETAIL:
- Investment amount, date, share percentage
- Total revenue earned to date
- Revenue transactions list (each order that generated payout)
- Seller's sales performance chart
- Request expiry countdown

PORTFOLIO SUMMARY (top of My Investments):
- Total invested: XXX GHETTO
- Total earned: XX GHETTO
- Overall ROI: +X.X%
- Active investments: X
- Completed investments: X

AUTOMATIC REVENUE SHARING:
When any order completes (in backend/Supabase function):
1. Check if seller has active funded sponsorships
2. Calculate sponsor payouts: orderAmount * revenuePercentage * sponsorShare
3. Record transactions in sponsorship_transactions table
4. Update sponsorship_investments.revenue_earned for each sponsor
5. Notify sponsors: "You earned X GHETTO from [Seller]'s sale!"
```

---

## IMPLEMENTATION NOTES:

1. **Phase 4 (Wallet) Reown Enhancement**: Add detailed Reown setup as described in NATIVELY_SUPPLEMENTARY_FEATURES.md

2. **Atomic Swaps**: Can be added as optional "Phase 11" or integrated into Wallet tab if desired

3. **Testing Checklist**:
   - [ ] Seller deposits collateral
   - [ ] Buyer creates order
   - [ ] Seller agrees to order (collateral held)
   - [ ] Buyer funds order
   - [ ] Seller marks shipped
   - [ ] Buyer confirms delivery (funds released)
   - [ ] Seller withdraws earnings
   - [ ] Test auto-release after 7 days
   - [ ] Test dispute creation and resolution
   - [ ] Seller creates sponsorship request
   - [ ] Sponsor invests in request
   - [ ] Revenue sharing triggers on completed order

4. **Contract Verification**:
   All contract addresses are deployed and verified on Polygon Mainnet:
   - Escrow: 0xC05B7db1C24027BC062088F8F10C38836e660392
   - GHETTO Token: 0x3176b45b7295Bdac9cFeF845aEde3C40ed2d0DE3
   - USDC: 0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359

5. **Supabase Realtime**:
   Subscribe to order status changes for live updates across all order-related screens

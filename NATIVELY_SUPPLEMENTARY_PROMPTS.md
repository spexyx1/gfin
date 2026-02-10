# Supplementary Natively.dev Prompts - Critical Missing Features

Copy-paste these into natively.dev AFTER completing the original 10 phases. These cover essential features that were missed.

---

## ENHANCEMENT 1 of 3: Complete Escrow Contract Integration

```
Enhancement 1 of 3: Complete Escrow Contract Integration. Enhances Phase 5/6 with full smart contract lifecycle.

ESCROW: 0xC05B7db1C24027BC062088F8F10C38836e660392 | GHETTO: 0x3176b45b7295Bdac9cFeF845aEde3C40ed2d0DE3

SELLER COLLATERAL (add to Seller Dashboard):
Card showing: "Total: XX GHETTO | Held: XX | Available: XX"
- Query: escrow.getAvailableCollateral(sellerAddress)
- "Deposit" button → input amount (min 10), approve GHETTO, call depositGhettoCollateral(amount)
- "Withdraw" button → call withdrawGhettoCollateral(amount), only if available > 0

ENHANCED CHECKOUT (modify Phase 5):
After createOrder(), wait for seller agreement:
- Seller gets notification, sees order in dashboard
- "Accept Order" calls escrow.agreeToOrder(orderId), holds collateral 1:1 with order value
- Buyer sees "Seller accepted!" and can now fundOrder()

SHIPPING (modify Phase 6):
Seller's funded orders show "Mark Shipped" button:
- Opens dialog with tracking# input (optional)
- Calls escrow.markAsShipped(orderId)
- Updates Supabase: status='shipped', shipped_at
- Starts 7-day auto-release countdown

DELIVERY CONFIRMATION:
If order shipped, buyer sees:
- "Confirm Delivery" button (green, pulsing)
- Countdown: "Auto-release in X days"
- Tap → dialog "Received in good condition?"
- "Yes" calls escrow.confirmDelivery(orderId)
- Releases funds to seller, releases collateral
- Updates: status='completed', delivered_at
- After 7 days, anyone can call escrow.autoCompleteOrder(orderId)

EARNINGS WITHDRAWAL:
Card in Seller Dashboard showing withdrawable balances:
- Query escrow.getSellerBalance(myAddress, tokenAddress) for USDC/GHETTO/MATIC
- Each token has "Withdraw" button → calls withdrawSellerBalance(tokenAddress)

DISPUTES:
Open Dispute button (0-3 days after shipping):
- Form: reason dropdown, description (min 50 chars), photos
- Calls escrow.raiseDispute(orderId)
- Creates dispute_cases row, blocks auto-complete

Mediator Resolution (admin only):
- View evidence, comments
- "Refund Buyer" → escrow.resolveDispute(orderId, true): buyer refunded, collateral released
- "Release to Seller" → escrow.resolveDispute(orderId, false): seller paid, order complete
```

---

## ENHANCEMENT 2 of 3: Sponsorship Marketplace

```
Enhancement 2 of 3: Sponsorship Marketplace. Sponsors stake GHETTO to sellers for revenue share.

Tables: sponsorship_requests, sponsorship_investments, sponsorship_transactions
Add "Sponsorships" tab to BottomNav or Wallet submenu

SELLER — CREATE REQUEST:
"My Requests" screen with RecyclerView:
- Cards show: title, "XX/XXX GHETTO funded" progress, "X% revenue", days remaining, status, sponsor count
- FAB "+" → Create Request form:
  - Title (max 60), Description (min 100 chars)
  - Amount: 100-10000 GHETTO
  - Revenue %: 5-25% slider ("Sponsors get X% of sales")
  - Duration: 30/60/90/180 days
  - Category: Inventory/Marketing/Equipment/Expansion/Other
- Submit → INSERT sponsorship_requests with status='active'
- Tap request → analytics: invested, revenue shared, active sponsors, ROI, transactions list

SPONSOR — BROWSE & INVEST:
Marketplace grid with filters (category) and sort (newest/highest %/nearly funded/expiring):
- Cards: seller avatar, @handle, rating, verified badge, title, "XX/XXX funded" progress, "X% revenue", "X days left", "~XX GHETTO/month" estimate
- Tap "Invest" → detail screen:
  - Seller profile, 30-day sales chart
  - Input amount (min 10 GHETTO)
  - Shows: "You own X.X% | Potential XX/month"
  - Risk disclaimer
  - Confirm → INSERT sponsorship_investments

MY INVESTMENTS:
- Portfolio summary: total invested, earned, ROI, active count
- List: request title, @seller, invested amount, earned, ROI badge, status
- Tap → detail: amount, date, share %, revenue earned, transactions, seller performance chart

AUTO REVENUE SHARING (backend):
On order complete:
1. Query active funded sponsorships for seller (expires_at > now)
2. Get investments for each request
3. Calculate: orderAmount × revenuePercentage × sponsorSharePercentage
4. INSERT sponsorship_transactions
5. UPDATE revenue_earned
6. Notify: "Earned X GHETTO from @seller!"
```

---

## ENHANCEMENT 3 of 3: Atomic Swaps (Optional P2P Trading)

```
Enhancement 3 of 3: Atomic Swaps for Direct Token Trading. Optional feature for advanced users.

ATOMIC SWAP CONTRACT: Deploy AtomicSwap.sol or use existing if deployed
Supabase Table: atomic_swaps

ADD "Swaps" tab to Wallet section OR as 6th BottomNav tab

CREATE SWAP SCREEN:

"New Swap" Form:
- Section "You Offer":
  - Dropdown: select token (GHETTO, USDC, MATIC)
  - NumberInput: amount
  - Show balance: "Balance: XX.XX"
- Section "You Want":
  - Dropdown: select token
  - NumberInput: amount
- TextInput: "Recipient @handle or wallet address"
  - Auto-search profiles by username
  - Validate if wallet address provided
- Dropdown: Duration (1 hour, 6 hours, 1 day, 3 days, 7 days)
- NeonButton "Create Swap"
- Generate unique swapId (UUID)
- Call atomicSwap.createSwap(swapId, recipientAddress, initiatorToken, recipientToken, initiatorAmount, recipientAmount, durationSeconds)
- INSERT into atomic_swaps Supabase table
- Success: "Swap created! Waiting for counterparty."

ACTIVE SWAPS LIST:

2 Tabs: "Initiated by Me" and "Received"

Each swap card shows:
- Counterparty @handle with avatar
- "XX TOKEN ↔ XX TOKEN" (large, centered)
- Status badge: waiting, partially_funded, completed, expired, cancelled
- Countdown: "Expires in X hours"
- Progress indicators:
  - Your deposit status: ✓ Deposited or "❌ Not deposited"
  - Their deposit status: ✓ Deposited or "❌ Not deposited"
- Action buttons based on status

DEPOSIT FLOW:

If your tokens not deposited:
- "Deposit Your Tokens" button
- Opens confirmation: "Deposit XX TOKEN to escrow?"
- Approve token for AtomicSwap contract address
- Call atomicSwap.depositInitiatorTokens(swapId) or depositRecipientTokens(swapId)
- Updates status in contract and Supabase
- If both parties deposited, swap auto-executes on-chain
- Tokens immediately transferred to respective wallets
- Success toast: "Swap completed! XX TOKEN received."

CANCEL SWAP:

"Cancel Swap" button (enabled anytime before both deposits):
- Confirmation dialog: "Cancel swap? Any deposited tokens will be refunded."
- Call atomicSwap.cancelSwap(swapId)
- Refunds any deposited tokens immediately
- Updates Supabase: status='cancelled'

SWAP DETAIL SCREEN:
- Full swap terms
- Both parties' profiles
- Deposit status for each side
- Transaction hash links once completed
- Chat button to message counterparty
- Timer countdown to expiry

EXPIRED SWAPS:
- After duration passes without both deposits, status→expired
- "Claim Refund" button if you deposited
- Call cancelSwap() to reclaim your tokens
- Auto-cleanup: scheduled job marks expired swaps

NOTIFICATIONS:
- "New swap request from @user" (recipient)
- "@user deposited their tokens" (both parties)
- "Swap completed! XX TOKEN received" (both parties)
- "Swap expired and refunded" (if applicable)

Testing: Create swap, deposit as initiator, deposit as recipient, verify auto-completion and token transfers.
```

---

## IMPLEMENTATION ORDER:

1. **Enhancement 1** (CRITICAL) — Complete escrow integration
2. **Enhancement 2** (IMPORTANT) — Sponsorship marketplace
3. **Enhancement 3** (OPTIONAL) — Atomic swaps if time permits

All Supabase tables already exist. All contracts are deployed. Backend is ready.

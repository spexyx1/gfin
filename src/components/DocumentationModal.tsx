import { useState } from 'react';
import { X, Book, ChevronDown, ChevronUp, ShoppingCart, Shield, Wallet, Users, Code, Zap, ArrowRight, AlertTriangle, CheckCircle, DollarSign, Package, MessageCircle, Store, Globe, Lock, RefreshCw, FileText, HelpCircle } from 'lucide-react';
import { LEGAL_CONSTANTS } from '../config/legalConstants';

interface DocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Section {
  id: string;
  title: string;
  content: React.ReactNode;
}

function Accordion({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-white/8 luxe-glass opacity-30 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
      >
        <span className="font-black text-white text-sm">{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm text-gray-300 space-y-2 leading-relaxed border-t border-white/5 pt-3">
          {children}
        </div>
      )}
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="w-6 h-6 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-xs font-black text-orange-400 shrink-0 mt-0.5">{n}</div>
      <div>
        <p className="text-white font-black text-sm">{title}</p>
        <p className="text-gray-300 text-sm mt-0.5">{children}</p>
      </div>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="inline-block text-xs bg-orange-500/10 border border-orange-500/20 text-orange-300 px-2 py-0.5 rounded font-bold mr-1 mb-1">{children}</span>;
}

function Callout({ type, children }: { type: 'info' | 'warning' | 'success'; children: React.ReactNode }) {
  const config = {
    info:    { icon: HelpCircle, color: 'text-blue-400', bg: 'bg-blue-500/5', border: 'border-blue-500/20' },
    warning: { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/5', border: 'border-yellow-500/20' },
    success: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/5', border: 'border-emerald-500/20' },
  }[type];
  return (
    <div className={`flex items-start gap-3 rounded-xl ${config.bg} border ${config.border} p-3`}>
      <config.icon className={`w-4 h-4 ${config.color} shrink-0 mt-0.5`} />
      <p className="text-sm text-gray-300">{children}</p>
    </div>
  );
}

const NAV_ITEMS = [
  { id: 'intro',      label: 'Introduction',     icon: Book },
  { id: 'buying',     label: 'Buying',           icon: ShoppingCart },
  { id: 'selling',    label: 'Selling',          icon: Store },
  { id: 'escrow',     label: 'Escrow System',    icon: Shield },
  { id: 'wallet',     label: 'Wallet & Tokens',  icon: Wallet },
  { id: 'swaps',      label: 'Atomic Swaps',     icon: RefreshCw },
  { id: 'social',     label: 'Social Features',  icon: Users },
  { id: 'merchant',   label: 'Merchant API',     icon: Code },
  { id: 'security',   label: 'Security',         icon: Lock },
  { id: 'fees',       label: 'Fees',             icon: DollarSign },
  { id: 'contracts',  label: 'Smart Contracts',  icon: FileText },
  { id: 'faq',        label: 'FAQ',              icon: HelpCircle },
] as const;

type NavId = typeof NAV_ITEMS[number]['id'];

export function DocumentationModal({ isOpen, onClose }: DocumentationModalProps) {
  const [activeSection, setActiveSection] = useState<NavId>('intro');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="luxe-glass-strong border border-white/10 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
              <Book className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-wide">Documentation</h2>
              <p className="text-xs text-gray-400 font-bold">GHETTO Finance Platform Guide — v1.0</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">

          {/* Sidebar */}
          <nav className="w-48 shrink-0 border-r border-white/10 overflow-y-auto p-3 space-y-0.5 hidden md:block">
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeSection === item.id
                    ? 'bg-orange-500/10 text-orange-300 border border-orange-500/20'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
              >
                <item.icon className="w-3.5 h-3.5 shrink-0" />
                <span className="text-xs font-bold">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Mobile tab bar */}
          <div className="md:hidden w-full absolute top-[88px] left-0 overflow-x-auto flex border-b border-white/10 luxe-glass-strong z-10">
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`shrink-0 px-3 py-2 text-xs font-black uppercase transition-colors ${
                  activeSection === item.id ? 'text-orange-400 border-b-2 border-orange-400' : 'text-gray-400'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">

            {/* INTRODUCTION */}
            {activeSection === 'intro' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-2xl font-black text-white mb-2">GHETTO Finance</h3>
                  <p className="text-gray-300 leading-relaxed">Welcome to GHETTO Finance — a decentralized peer-to-peer marketplace where buyers and sellers trade anything legal using blockchain-powered escrow protection. All transactions are secured by smart contracts on the Polygon network, ensuring trustless, transparent, and censorship-resistant commerce.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { icon: Shield, title: 'Escrow Protection', desc: 'Every trade is protected by on-chain escrow. Funds are only released when both parties confirm.' },
                    { icon: Zap, title: 'Polygon Network', desc: 'Fast, low-cost transactions on Polygon with near-instant confirmation times.' },
                    { icon: Users, title: 'P2P Trading', desc: 'Direct buyer-to-seller transactions with no intermediaries taking cuts beyond the platform fee.' },
                    { icon: Globe, title: 'Multi-Currency', desc: 'Pay with GHETTO tokens (discounted fees) or any supported ERC20 token.' },
                  ].map(item => (
                    <div key={item.title} className="rounded-xl luxe-glass opacity-40 border border-white/5 p-4 flex items-start gap-3">
                      <item.icon className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-white font-black text-sm">{item.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <h4 className="text-white font-black mb-3">Quick Start</h4>
                  <div className="space-y-3">
                    <Step n={1} title="Create an Account">Register with just a username and password — no email required. A web3 wallet (MetaMask or WalletConnect) is needed for blockchain transactions.</Step>
                    <Step n={2} title="Connect Your Wallet">Link a Polygon-compatible wallet to participate in escrow trades and GHETTO token features.</Step>
                    <Step n={3} title="Browse or List">Search the marketplace for items to buy, or list your own products to start selling.</Step>
                    <Step n={4} title="Trade Safely">Use the escrow system to trade securely. Funds are held until delivery is confirmed.</Step>
                  </div>
                </div>

                <Callout type="info">
                  GHETTO Finance operates on the Polygon network. Ensure your wallet is connected to Polygon (Chain ID 137) or Polygon Amoy testnet (Chain ID 80002) before making transactions.
                </Callout>
              </div>
            )}

            {/* BUYING */}
            {activeSection === 'buying' && (
              <div className="space-y-5">
                <h3 className="text-xl font-black text-white">Buying on GHETTO Finance</h3>

                <div className="space-y-3">
                  <h4 className="text-white font-black text-sm uppercase tracking-wider">How to Purchase</h4>
                  <div className="space-y-3">
                    <Step n={1} title="Browse the Marketplace">Search for products using the search bar or filter by category, price range, and location. Use the Advanced Search for more precise filters.</Step>
                    <Step n={2} title="Review Seller Reputation">Check the seller's reputation score, completed trades, and verified status before proceeding.</Step>
                    <Step n={3} title="Place Your Order">Click "Buy Now" on any listing. You can choose your payment token (GHETTO or other supported ERC20s).</Step>
                    <Step n={4} title="Fund the Escrow">After the seller agrees to your order, fund the escrow contract. Your tokens are locked — not sent to the seller yet.</Step>
                    <Step n={5} title="Wait for Shipping">The seller ships the item and provides tracking information.</Step>
                    <Step n={6} title="Confirm Delivery">Once you receive your item, confirm delivery in your Order Management dashboard. Funds are released to the seller.</Step>
                  </div>
                </div>

                <Accordion title="What happens if I don't receive my item?">
                  <p>If you don't receive your item within the 7-day delivery window after the seller marks it as shipped, you can raise a dispute. A mediator will review the case and can rule in your favor, returning your funds. You can also raise a dispute on any shipped order before the auto-complete deadline.</p>
                </Accordion>

                <Accordion title="What is auto-complete?">
                  <p>If you forget to confirm delivery after 7 days from shipping, the order auto-completes and funds are released to the seller. This prevents sellers from being paid delayed indefinitely. Always confirm delivery promptly to maintain control.</p>
                </Accordion>

                <Accordion title="Can I make an offer below the listed price?">
                  <p>Yes. Use the "Make Offer" feature on any listing to propose a different price. The seller can accept, counter, or decline. Accepted offers create an order at the agreed price.</p>
                </Accordion>

                <Callout type="warning">
                  Never confirm delivery before you have physically received and inspected your item. Once confirmed, funds are irreversibly released to the seller.
                </Callout>
              </div>
            )}

            {/* SELLING */}
            {activeSection === 'selling' && (
              <div className="space-y-5">
                <h3 className="text-xl font-black text-white">Selling on GHETTO Finance</h3>

                <div className="space-y-3">
                  <h4 className="text-white font-black text-sm uppercase tracking-wider">Getting Started as a Seller</h4>
                  <div className="space-y-3">
                    <Step n={1} title="Deposit GHETTO Collateral">Sellers must deposit a minimum of 100 GHETTO tokens as collateral. This proves commitment and protects buyers. Collateral is returned when orders complete.</Step>
                    <Step n={2} title="Create a Listing">Go to the Seller Dashboard and create your product listing with title, description, price, category, and photos.</Step>
                    <Step n={3} title="Agree to Orders">When a buyer places an order, you will be notified. Review the order and click "Agree" to lock in your collateral hold and proceed.</Step>
                    <Step n={4} title="Ship the Item">Once the buyer funds the escrow, ship the item and enter tracking information in your Order Management dashboard.</Step>
                    <Step n={5} title="Receive Payment">After delivery is confirmed (either by the buyer or auto-complete), your payment is credited to your seller balance. Withdraw at any time.</Step>
                  </div>
                </div>

                <Accordion title="How much collateral do I need?" defaultOpen>
                  <p>A minimum of 100 GHETTO tokens are required to activate your seller account. Your available collateral determines the maximum order value you can accept — the system maintains a 1:1 ratio between your available GHETTO collateral and your total in-flight order value. For example, with 500 GHETTO collateral, you can have up to 500 GHETTO worth of active orders simultaneously.</p>
                </Accordion>

                <Accordion title="What happens to my collateral in a dispute?">
                  <p>If a dispute is ruled in the buyer's favor, your collateral hold for that order is released (not penalized) and the buyer receives a refund from the escrowed payment. Repeated disputes can affect your reputation score. Fraudulent sellers risk platform suspension and potential collateral penalties.</p>
                </Accordion>

                <Accordion title="When can I withdraw my collateral?">
                  <p>You can withdraw collateral above the 100 GHETTO minimum as long as you have no active held funds. Collateral is automatically released from holds once orders complete or are cancelled.</p>
                </Accordion>

                <Accordion title="Are there restrictions on what I can sell?">
                  <p>You can sell anything legal in your jurisdiction. Prohibited items include weapons, controlled substances, counterfeit goods, stolen property, and anything illegal to sell or possess. First-time violations typically result in warnings and listing removal, giving you the opportunity to correct your actions. However, repeated violations within a short period will result in account suspension. See Terms of Service for the full list of prohibited categories and enforcement details.</p>
                </Accordion>
              </div>
            )}

            {/* ESCROW */}
            {activeSection === 'escrow' && (
              <div className="space-y-5">
                <h3 className="text-xl font-black text-white">Escrow System</h3>
                <p className="text-gray-300">The GHETTO Finance escrow system is powered by the <code className="text-orange-300 luxe-glass px-1 rounded text-xs">CryptoMarketplaceEscrow</code> smart contract on Polygon. It is fully non-custodial — no human can unilaterally move funds outside of the dispute resolution process.</p>

                <div>
                  <h4 className="text-white font-black text-sm mb-3">Order Lifecycle</h4>
                  <div className="space-y-2">
                    {[
                      { status: 'Created', desc: 'Buyer places order. Seller must agree before funding.' },
                      { status: 'Funded', desc: 'Buyer deposits payment tokens into escrow contract.' },
                      { status: 'Shipped', desc: 'Seller marks as shipped. 7-day delivery window starts.' },
                      { status: 'Delivered', desc: 'Buyer confirms receipt or auto-complete triggers.' },
                      { status: 'Completed', desc: 'Payment released to seller. Platform fee deducted.' },
                      { status: 'Disputed', desc: 'Either party raised a dispute. Mediator review pending.' },
                      { status: 'Cancelled', desc: 'Order cancelled. Buyer refunded (if funded).' },
                    ].map(item => (
                      <div key={item.status} className="flex items-center gap-3 luxe-glass opacity-30 rounded-lg p-3 border border-white/5">
                        <span className="text-xs font-black text-orange-400 w-20 shrink-0">{item.status}</span>
                        <ArrowRight className="w-3 h-3 text-gray-600 shrink-0" />
                        <span className="text-sm text-gray-300">{item.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Accordion title="How is collateral calculated?">
                  <p>When a seller agrees to an order, a "hold" is placed on their GHETTO collateral equal to the order amount. This hold prevents the collateral from being withdrawn during the active order. When the order completes or is cancelled, the hold is released. The platform also holds a configurable percentage (default 10%) of the order value as additional security during the shipping period.</p>
                </Accordion>

                <Accordion title="What tokens can I use for payment?">
                  <p>GHETTO tokens carry a 2.5% platform fee. All other supported ERC20 tokens carry a 3.75% fee (2.5% base + 1.25% non-GHETTO premium). The accepted payment tokens are determined by the escrow contract's approved token list, managed by the platform.</p>
                </Accordion>

                <Accordion title="How do disputes work?">
                  <p>Either buyer or seller can raise a dispute on any order in Shipped or Delivered status. Once raised, the order is locked and a mediator reviews the evidence submitted by both parties. The mediator can rule in favor of either party. A buyer-favoring ruling refunds the escrowed amount; a seller-favoring ruling completes the order normally.</p>
                </Accordion>

                <Callout type="success">
                  All escrow funds are held in the smart contract — not in any GHETTO Finance controlled wallet. Smart contract code is open source and has been internally audited. See the Security Audit section for details.
                </Callout>
              </div>
            )}

            {/* WALLET & TOKENS */}
            {activeSection === 'wallet' && (
              <div className="space-y-5">
                <h3 className="text-xl font-black text-white">Wallet & Tokens</h3>

                <div className="rounded-xl luxe-glass opacity-40 border border-white/5 p-4 space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-4 h-4 text-orange-400" />
                    <h4 className="text-white font-black text-sm">GHETTO Token (GHETTO)</h4>
                  </div>
                  <p className="text-sm text-gray-300">GHETTO is the native platform utility token. It uses 2 decimal places (100 = 1.00 GHETTO) and has a 10 million token initial supply. Holding GHETTO provides reduced platform fees and is required as seller collateral.</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <Tag>10M Supply</Tag><Tag>2 Decimals</Tag><Tag>Polygon Network</Tag><Tag>2.5% Fee Discount</Tag>
                  </div>
                </div>

                <div>
                  <h4 className="text-white font-black text-sm mb-3">Connecting Your Wallet</h4>
                  <div className="space-y-3">
                    <Step n={1} title="MetaMask (Recommended)">Install MetaMask browser extension. Add Polygon network (Chain ID 137, RPC: polygon-rpc.com). Click "Connect Wallet" in the app.</Step>
                    <Step n={2} title="WalletConnect">Open any WalletConnect-compatible mobile wallet. Scan the QR code when prompted via the app's Connect Wallet button.</Step>
                    <Step n={3} title="Other Injected Wallets">Any EIP-1193 compatible wallet (Coinbase Wallet, Rainbow, etc.) will work through the Reown AppKit connection modal.</Step>
                  </div>
                </div>

                <Accordion title="Wallet Dashboard features">
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                    <li>View GHETTO, MATIC/POL, and other ERC20 token balances</li>
                    <li>Send tokens to any address on Polygon</li>
                    <li>View transaction history</li>
                    <li>View GHETTO price chart and market data</li>
                    <li>Withdraw seller earnings from completed orders</li>
                  </ul>
                </Accordion>

                <Accordion title="Adding GHETTO token to MetaMask">
                  <p>In MetaMask, go to Import Tokens and enter the deployed GHETTO contract address on Polygon. The token symbol (GHETTO) and decimals (2) will auto-populate. Alternatively, click "Add to MetaMask" from the Wallet Dashboard.</p>
                </Accordion>

                <Callout type="warning">
                  Never share your wallet seed phrase or private key with anyone, including GHETTO Finance staff. We will never ask for this information.
                </Callout>
              </div>
            )}

            {/* ATOMIC SWAPS */}
            {activeSection === 'swaps' && (
              <div className="space-y-5">
                <h3 className="text-xl font-black text-white">Atomic Swaps</h3>
                <p className="text-gray-300">The Atomic Swap feature allows you to exchange tokens directly with another user in a completely trustless manner. The <code className="text-orange-300 luxe-glass px-1 rounded text-xs">AtomicSwap</code> contract ensures both parties either complete the exchange or both get their tokens back — there is no way for one party to take the other's tokens.</p>

                <div className="space-y-3">
                  <h4 className="text-white font-black text-sm">How to Create a Swap</h4>
                  <div className="space-y-3">
                    <Step n={1} title="Navigate to Swap Interface">Access Atomic Swaps from the Swap section of the platform.</Step>
                    <Step n={2} title="Configure the Swap">Enter the recipient's address, select the token you are offering and the token you want to receive, and set amounts and expiration time (max 7 days).</Step>
                    <Step n={3} title="Approve Token Spending">Approve the swap contract to spend your tokens before depositing. This is a standard ERC20 approval transaction.</Step>
                    <Step n={4} title="Deposit Your Tokens">Deposit your tokens into the swap contract. They are locked pending the recipient's deposit.</Step>
                    <Step n={5} title="Recipient Deposits">The recipient deposits their tokens. Once both sides are deposited, the swap completes automatically and atomically.</Step>
                  </div>
                </div>

                <Accordion title="What if the swap expires?">
                  <p>If the swap's expiration time passes before both parties deposit, anyone can call cancel. Each party's deposited tokens are returned to them. No tokens are lost.</p>
                </Accordion>

                <Accordion title="Which tokens can be swapped?">
                  <p>Only tokens approved by the platform owner can be used in atomic swaps. This includes GHETTO and other listed ERC20 tokens. The approved list prevents scam tokens from being used in exchanges.</p>
                </Accordion>

                <Callout type="info">
                  Atomic swaps are entirely on-chain and require gas for each transaction (deposit, completion, or cancellation). Ensure your wallet has sufficient MATIC/POL for gas fees.
                </Callout>
              </div>
            )}

            {/* SOCIAL */}
            {activeSection === 'social' && (
              <div className="space-y-5">
                <h3 className="text-xl font-black text-white">Social Features</h3>
                <p className="text-gray-300">GHETTO Finance includes a full social platform where users can connect, share content, build reputations, and discover trading partners.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { icon: Users, title: 'User Profiles', desc: 'Public profiles with reputation scores, completed trades, and user posts.' },
                    { icon: MessageCircle, title: 'Messaging', desc: 'End-to-end encrypted direct messages between any two users.' },
                    { icon: Package, title: 'Post Listings', desc: 'Share your listings on the social feed for increased visibility.' },
                    { icon: CheckCircle, title: 'Reputation System', desc: 'Reputation is earned through completed trades, dispute outcomes, and community ratings.' },
                  ].map(item => (
                    <div key={item.title} className="rounded-xl luxe-glass opacity-40 border border-white/5 p-3 flex items-start gap-3">
                      <item.icon className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-white font-black text-sm">{item.title}</p>
                        <p className="text-xs text-gray-400">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Accordion title="How is reputation calculated?">
                  <p>Reputation points are earned through: completed orders (+positive rating), received positive reviews, length of account tenure, and verified account status. Points are deducted for disputed orders ruled against you, cancellations, and negative reviews. Your overall score determines your trust badge tier.</p>
                </Accordion>

                <Accordion title="Sponsorship Marketplace">
                  <p>High-reputation sellers can access the Sponsorship Marketplace to promote their listings to a broader audience. Sponsors pay GHETTO tokens for featured placement. The sponsorship system is managed transparently on-chain with verifiable placement schedules.</p>
                </Accordion>
              </div>
            )}

            {/* MERCHANT API */}
            {activeSection === 'merchant' && (
              <div className="space-y-5">
                <h3 className="text-xl font-black text-white">Merchant API</h3>
                <p className="text-gray-300">The GHETTO Finance Merchant API allows businesses and developers to integrate our escrow payment system into their own platforms and applications.</p>

                <div className="rounded-xl luxe-glass opacity-40 border border-white/5 p-4 space-y-3">
                  <h4 className="text-white font-black text-sm">Getting API Access</h4>
                  <div className="space-y-2">
                    <Step n={1} title="Register as a Merchant">Create a GHETTO Finance account and navigate to Merchant Dashboard → API Settings.</Step>
                    <Step n={2} title="Generate API Keys">Generate your public API key and secret. Store your secret securely — it will not be shown again.</Step>
                    <Step n={3} title="Configure Webhooks">Set up webhook endpoints to receive real-time order and payment notifications.</Step>
                  </div>
                </div>

                <Accordion title="Authentication">
                  <p>All API requests require a Bearer token in the Authorization header, obtained by calling the <code className="text-orange-300 luxe-glass px-1 rounded text-xs">POST /merchant-auth</code> endpoint with your API key and secret. Tokens expire after 24 hours.</p>
                </Accordion>

                <Accordion title="Available Endpoints">
                  <div className="space-y-2">
                    {[
                      { method: 'POST', path: '/merchant-auth', desc: 'Authenticate and receive a JWT token' },
                      { method: 'GET', path: '/merchant-api-info', desc: 'Retrieve merchant profile and API info' },
                      { method: 'GET', path: '/merchant-api-orders', desc: 'List orders for your merchant account' },
                      { method: 'POST', path: '/merchant-api-orders', desc: 'Create a new order via API' },
                      { method: 'POST', path: '/merchant-api-disputes', desc: 'Submit or manage disputes programmatically' },
                    ].map(ep => (
                      <div key={ep.path} className="flex items-center gap-2 luxe-glass-strong/50 rounded-lg p-2">
                        <span className={`text-xs font-black w-10 ${ep.method === 'GET' ? 'text-emerald-400' : 'text-orange-400'}`}>{ep.method}</span>
                        <code className="text-xs text-blue-300 font-mono">{ep.path}</code>
                        <span className="text-xs text-gray-400 ml-1">{ep.desc}</span>
                      </div>
                    ))}
                  </div>
                </Accordion>

                <Accordion title="Webhook Events">
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                    <li><code className="text-orange-300">order.created</code> — New order placed</li>
                    <li><code className="text-orange-300">order.funded</code> — Buyer funded escrow</li>
                    <li><code className="text-orange-300">order.shipped</code> — Seller marked shipped</li>
                    <li><code className="text-orange-300">order.completed</code> — Order completed, funds released</li>
                    <li><code className="text-orange-300">order.disputed</code> — Dispute raised</li>
                    <li><code className="text-orange-300">order.cancelled</code> — Order cancelled</li>
                  </ul>
                </Accordion>
              </div>
            )}

            {/* SECURITY */}
            {activeSection === 'security' && (
              <div className="space-y-5">
                <h3 className="text-xl font-black text-white">Security</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { icon: Lock, title: 'Smart Contract Security', desc: 'OpenZeppelin libraries, reentrancy guards, and SafeERC20 patterns throughout all contracts.' },
                    { icon: Shield, title: 'Database RLS', desc: 'Row-level security on all database tables ensures users can only access their own data.' },
                    { icon: Zap, title: 'No Custodial Risk', desc: 'Escrow funds are held in smart contracts, not in any centralized wallet controlled by GHETTO Finance.' },
                    { icon: AlertTriangle, title: 'Dispute Resolution', desc: 'Multi-party mediator system for contested transactions with evidence submission.' },
                  ].map(item => (
                    <div key={item.title} className="rounded-xl luxe-glass opacity-40 border border-white/5 p-4 flex items-start gap-3">
                      <item.icon className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-white font-black text-sm">{item.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Accordion title="Best Practices for Users">
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                    <li>Use a hardware wallet for large transactions</li>
                    <li>Never share your password or wallet seed phrase</li>
                    <li>Verify seller reputation before high-value purchases</li>
                    <li>Only confirm delivery after physically inspecting items</li>
                    <li>Use the messaging system to communicate — it creates an auditable evidence trail</li>
                    <li>Report suspicious activity via the Report Listing feature</li>
                  </ul>
                </Accordion>

                <Accordion title="Responsible Disclosure">
                  <p>If you discover a security vulnerability, please report it immediately to <a href="mailto:security@ghetto.finance" className="text-orange-400 hover:text-orange-300">security@ghetto.finance</a>. We aim to respond within 48 hours. Please do not publicly disclose vulnerabilities before we have had a chance to address them. We operate a responsible disclosure policy and appreciate the security community's help.</p>
                </Accordion>

                <Callout type="warning">
                  GHETTO Finance staff will never ask you to send tokens to any address for "verification", "testing", or "recovery" purposes. All such requests are scams.
                </Callout>
              </div>
            )}

            {/* FEES */}
            {activeSection === 'fees' && (
              <div className="space-y-5">
                <h3 className="text-xl font-black text-white">Fee Structure</h3>

                <div className="rounded-xl luxe-glass opacity-40 border border-white/5 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left p-4 text-xs font-black text-gray-400 uppercase tracking-wider">Action</th>
                        <th className="text-right p-4 text-xs font-black text-gray-400 uppercase tracking-wider">Fee</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {[
                        { action: 'Trade with GHETTO tokens', fee: '2.5%' },
                        { action: 'Trade with other ERC20 tokens', fee: '3.75%' },
                        { action: 'Seller collateral deposit/withdrawal', fee: 'Free (gas only)' },
                        { action: 'Seller earnings withdrawal', fee: 'Free (gas only)' },
                        { action: 'Atomic swap', fee: 'Free (gas only)' },
                        { action: 'Listing a product', fee: 'Free' },
                        { action: 'Account registration', fee: 'Free' },
                        { action: 'Messaging', fee: 'Free' },
                        { action: 'Dispute filing', fee: 'Free' },
                        { action: 'API access (basic)', fee: 'Free' },
                      ].map(row => (
                        <tr key={row.action}>
                          <td className="p-4 text-gray-300">{row.action}</td>
                          <td className="p-4 text-right font-black text-orange-400">{row.fee}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <Callout type="info">
                  Platform fees are collected by the smart contract and cannot be changed without an on-chain transaction. Fees are capped at 10% platform fee + 5% non-GHETTO premium by the contract's immutable limits. Current rates are well below these caps.
                </Callout>

                <Accordion title="Who receives the fees?">
                  <p>Platform fees are credited to the contract owner's seller balance within the escrow contract. They are withdrawable via the standard seller balance withdrawal function, on-chain and transparently verifiable by anyone.</p>
                </Accordion>
              </div>
            )}

            {/* SMART CONTRACTS */}
            {activeSection === 'contracts' && (
              <div className="space-y-5">
                <h3 className="text-xl font-black text-white">Smart Contract Reference</h3>
                <p className="text-gray-300">All GHETTO Finance smart contracts are deployed on the Polygon network. Source code is available for review.</p>

                <div className="space-y-3">
                  {[
                    {
                      name: 'CryptoMarketplaceEscrow',
                      file: 'EscrowContract.sol',
                      role: 'Core escrow contract for P2P trades',
                      methods: ['createOrder', 'agreeToOrder', 'fundOrder', 'markAsShipped', 'confirmDelivery', 'raiseDispute', 'resolveDispute', 'withdrawSellerBalance'],
                    },
                    {
                      name: 'GhettoToken',
                      file: 'GhettoToken.sol',
                      role: 'ERC20 utility token (GHETTO)',
                      methods: ['transfer', 'approve', 'mint', 'burn', 'setBlacklisted', 'setMarketplaceContract', 'pause', 'unpause'],
                    },
                    {
                      name: 'AtomicSwap',
                      file: 'AtomicSwap.sol',
                      role: 'Trustless peer-to-peer token swaps',
                      methods: ['createSwap', 'depositInitiatorTokens', 'depositRecipientTokens', 'cancelSwap'],
                    },
                  ].map(c => (
                    <div key={c.name} className="rounded-xl luxe-glass opacity-40 border border-white/5 p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-white font-black">{c.name}</p>
                          <p className="text-xs text-gray-400 font-mono">{c.file}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-300 mb-3">{c.role}</p>
                      <div className="flex flex-wrap gap-1">
                        {c.methods.map(m => (
                          <code key={m} className="text-xs luxe-glass-strong/50 text-blue-300 px-2 py-0.5 rounded font-mono border border-white/5">{m}()</code>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <Accordion title="Network Information">
                  <div className="space-y-2 text-sm text-gray-300">
                    <p><strong className="text-white">Mainnet:</strong> Polygon (Chain ID 137) — RPC: polygon-rpc.com</p>
                    <p><strong className="text-white">Testnet:</strong> Polygon Amoy (Chain ID 80002) — RPC: rpc-amoy.polygon.technology</p>
                    <p><strong className="text-white">Gas Token:</strong> POL (formerly MATIC)</p>
                    <p><strong className="text-white">Block Explorer:</strong> polygonscan.com</p>
                  </div>
                </Accordion>

                <Accordion title="Contract Interactions via Web3">
                  <p>All contract ABIs are available in <code className="text-orange-300 luxe-glass px-1 rounded text-xs">src/config/contractAbis.ts</code>. Contract addresses are managed in <code className="text-orange-300 luxe-glass px-1 rounded text-xs">src/config/constants.ts</code> and can be updated via the ContractDeploymentAdmin interface for multi-network support.</p>
                </Accordion>
              </div>
            )}

            {/* FAQ */}
            {activeSection === 'faq' && (
              <div className="space-y-4">
                <h3 className="text-xl font-black text-white">Frequently Asked Questions</h3>

                <Accordion title="Do I need a crypto wallet to use GHETTO Finance?" defaultOpen>
                  <p>You can browse the marketplace without a wallet. However, to buy, sell, or use any blockchain features (escrow, swaps, GHETTO token), you need a Polygon-compatible wallet like MetaMask. Account registration only requires a username and password.</p>
                </Accordion>

                <Accordion title="What is GHETTO token used for?">
                  <p>GHETTO tokens serve three purposes: (1) Seller collateral — required minimum of 100 GHETTO to activate selling. (2) Reduced platform fees — 2.5% vs 3.75% for other tokens. (3) Native currency for platform-native transactions. In the future, GHETTO may also be used for governance.</p>
                </Accordion>

                <Accordion title="Is GHETTO Finance available worldwide?">
                  <p>The platform is globally accessible. However, users are responsible for compliance with their local laws regarding cryptocurrency usage and P2P commerce. The platform cannot be used for transactions prohibited by law in any jurisdiction.</p>
                </Accordion>

                <Accordion title="What happens if a seller disappears after I fund escrow?">
                  <p>If the seller does not ship within a reasonable time, you can raise a dispute. The mediator will review the case. If the seller is unresponsive and no shipping evidence is provided, the mediator will typically rule in the buyer's favor and refund the escrowed funds.</p>
                </Accordion>

                <Accordion title="Can I use GHETTO Finance on mobile?">
                  <p>Yes. The platform is a Progressive Web App (PWA) and can be installed on your home screen for a native app-like experience. Mobile WalletConnect allows you to use mobile wallets like MetaMask Mobile, Trust Wallet, and Rainbow on your phone.</p>
                </Accordion>

                <Accordion title="How long does an order take to complete?">
                  <p>This varies by seller. After the seller ships, the buyer has up to 7 days to confirm delivery. If no confirmation is given within 7 days of shipping, the order auto-completes. Typical trades complete within 1-7 days depending on shipping speed.</p>
                </Accordion>

                <Accordion title="Are my messages private?">
                  <p>Messages are stored encrypted in the database. Only the sender and recipient can read them. The platform does not read private messages. However, in the case of a dispute, message content may be reviewed by mediators as part of the evidence process.</p>
                </Accordion>

                <Accordion title="How do I report a scammer or fraudulent listing?">
                  <p>Click the Report button on any listing or user profile. Select the reason and provide details. The Sitemaster team reviews all reports and can suspend accounts, remove listings, and escalate to mediators as appropriate.</p>
                </Accordion>

                <Accordion title="What blockchains are supported?">
                  <p>Currently, GHETTO Finance operates exclusively on the Polygon network (and Polygon Amoy testnet for testing). Multi-chain support for additional EVM-compatible networks may be added in future versions.</p>
                </Accordion>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 shrink-0 flex items-center justify-between">
          <span className="text-xs text-gray-500 font-bold">GHETTO Finance Documentation v{LEGAL_CONSTANTS.DOCUMENTATION.VERSION} — {LEGAL_CONSTANTS.DOCUMENTATION.LAST_UPDATED}</span>
          <a href={`mailto:${LEGAL_CONSTANTS.SUPPORT_EMAIL}`} className="text-xs text-orange-400 hover:text-orange-300 font-black transition-colors">
            {LEGAL_CONSTANTS.SUPPORT_EMAIL}
          </a>
        </div>
      </div>
    </div>
  );
}

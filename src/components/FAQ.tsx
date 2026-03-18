import React, { useState } from 'react';
import { X, ChevronDown, ChevronUp, HelpCircle, Shield, Wallet, Users, MessageCircle, Store, Gavel, TrendingUp, Gift, Smartphone, Download, Chrome, Apple, Wifi, WifiOff, Home } from 'lucide-react';

interface FAQProps {
  isOpen: boolean;
  onClose: () => void;
  onContactClick: () => void;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  icon: React.ComponentType<any>;
}

const faqData: FAQItem[] = [
  // Getting Started
  {
    id: 'what-is-ghetto-finance',
    question: 'What is GHETTO FINANCE?',
    answer: 'GHETTO FINANCE is a decentralized marketplace for digital assets, services, and physical goods. We use blockchain technology and smart contracts to ensure secure transactions with escrow protection.',
    category: 'Getting Started',
    icon: HelpCircle
  },
  {
    id: 'how-to-get-started',
    question: 'How do I get started?',
    answer: 'Simply create an account, connect your crypto wallet, and start browsing products. You can buy items immediately or create your own seller profile to start selling.',
    category: 'Getting Started',
    icon: HelpCircle
  },
  {
    id: 'supported-currencies',
    question: 'What cryptocurrencies do you support?',
    answer: 'Transactions are usually settled with GHETTO & GRAIN; our utility tokens. Other acceptable tokens are BTC, ETH, BCH, MATIC, USDC, XMR (Monero). Other tokens may be swapped using the built-in swap function.',
    category: 'Getting Started',
    icon: HelpCircle
  },

  // Security & Escrow
  {
    id: 'how-escrow-works',
    question: 'How does the escrow system work?',
    answer: 'When you make a purchase, your USDC is held in a smart contract escrow. Funds are only released to the seller when you confirm delivery. If there\'s a dispute, our site master team will resolve it within 90 days.',
    category: 'Security & Escrow',
    icon: Shield
  },
  {
    id: 'seller-collateral-system',
    question: 'How does the seller collateral system work?',
    answer: 'Sellers must deposit GHETTO tokens as collateral. The collateral is locked for 1 year from the deposit date. After the lock expires, sellers receive a 2:1 selling limit - meaning they can sell up to 2x the value of their unlocked collateral. For example, 5,000 GHETTO in collateral allows up to 10,000 in sales.',
    category: 'Security & Escrow',
    icon: Shield
  },
  {
    id: 'collateral-lock-period',
    question: 'Why is collateral locked for 1 year?',
    answer: 'The 1-year lock period ensures long-term seller commitment and provides sustained platform security. During the lock period, collateral cannot be withdrawn but sellers can still build reputation. Once unlocked, the collateral backs the seller\'s trading capacity at a 2:1 ratio.',
    category: 'Security & Escrow',
    icon: Shield
  },
  {
    id: 'selling-limits',
    question: 'What are selling limits?',
    answer: 'Selling limits are calculated as 2x your unlocked GHETTO collateral. If you have 1,000 GHETTO unlocked, you can have up to 2,000 in active orders. As orders complete, your available limit refreshes. More collateral means higher selling capacity.',
    category: 'Security & Escrow',
    icon: Shield
  },
  {
    id: 'dispute-resolution',
    question: 'What happens if there\'s a dispute?',
    answer: 'If you have an issue with an order, you can raise a dispute. Our site master team will review all evidence and make a fair decision within 90 days. Decisions can favor the buyer (full refund), seller (no refund), or partial refund.',
    category: 'Security & Escrow',
    icon: Shield
  },
  {
    id: 'platform-fees',
    question: 'What are the platform fees?',
    answer: 'We charge a 2.5% platform fee on completed transactions. This covers escrow services, dispute resolution, and platform maintenance.',
    category: 'Security & Escrow',
    icon: Shield
  },

  // Wallet & Payments
  {
    id: 'wallet-connection',
    question: 'How do I connect my wallet?',
    answer: 'Click the "Connect Wallet" button and select MetaMask or your preferred Web3 wallet. Make sure you have USDC or other supported cryptocurrencies for purchases.',
    category: 'Wallet & Payments',
    icon: Wallet
  },
  {
    id: 'wallet-features',
    question: 'What wallet features are available?',
    answer: 'Our integrated wallet supports sending/receiving crypto, buying crypto with fiat, instant token swaps, peer-to-peer atomic swaps, and trading on exchanges. All features are accessible through the wallet dashboard in the header.',
    category: 'Wallet & Payments',
    icon: Wallet
  },
  {
    id: 'atomic-swaps',
    question: 'What are Atomic Swaps?',
    answer: 'Atomic Swaps are peer-to-peer token exchanges that happen trustlessly between two users on different chains. Both parties create a swap proposal, deposit their tokens into escrow, and the swap executes simultaneously or not at all. Perfect for direct trades without intermediaries. Access this feature from the ATOMIC SWAP tab in your wallet.',
    category: 'Wallet & Payments',
    icon: Wallet
  },
  {
    id: 'atomic-swap-vs-instant',
    question: 'What\'s the difference between Atomic Swap and regular Swap?',
    answer: 'Regular SWAP (in the swap tab) is instant and uses DEX liquidity pools - you swap immediately at market prices. ATOMIC SWAP (in the atomic-swap tab) is peer-to-peer - you propose a trade to another user, both deposit tokens, and execute when both parties are ready. Use regular swap for instant trades, atomic swap for negotiated peer-to-peer deals.',
    category: 'Wallet & Payments',
    icon: Wallet
  },
  {
    id: 'how-to-atomic-swap',
    question: 'How do I create an Atomic Swap?',
    answer: 'Open your wallet dashboard, click the ATOMIC SWAP tab, connect your wallet, then click "New Swap". Select the tokens you\'re offering and requesting, enter amounts, add the recipient\'s address, and create the swap. Both parties have 24 hours to deposit tokens. If either party doesn\'t deposit, all funds are automatically returned.',
    category: 'Wallet & Payments',
    icon: Wallet
  },

  // Social Features
  {
    id: 'social-profiles',
    question: 'How do I create a social profile?',
    answer: 'Go to your profile settings and set up your @handle, display name, bio, and optional store page. You can choose from different themes and customize your presence on the platform.',
    category: 'Social Features',
    icon: Users
  },
  {
    id: 'trading-groups',
    question: 'What are trading groups?',
    answer: 'Trading groups are communities where users can share posts, create trade offers, and transfer funds. You can join public groups or create private ones for your trading circle.',
    category: 'Social Features',
    icon: Users
  },
  {
    id: 'fund-transfers',
    question: 'How do fund transfers work in groups?',
    answer: 'Group members can send cryptocurrency directly to each other with a reason and message. All transfers are tracked and both parties receive notifications.',
    category: 'Social Features',
    icon: Users
  },
  {
    id: 'at-handles',
    question: 'How do @ handles work?',
    answer: '@ handles are unique usernames (like @cryptotrader) that make it easy to tag and find users. They must be 3-20 characters and can only contain letters, numbers, and underscores.',
    category: 'Social Features',
    icon: Users
  },

  // Messaging
  {
    id: 'messaging-system',
    question: 'How does messaging work?',
    answer: 'You can message any seller or user directly. All conversations are private and secure. You\'ll receive notifications for new messages, order updates, and system announcements.',
    category: 'Messaging',
    icon: MessageCircle
  },
  {
    id: 'message-types',
    question: 'What types of messages are there?',
    answer: 'There are three types: regular text messages, order-related messages (with order references), and system messages (notifications, dispute updates, etc.).',
    category: 'Messaging',
    icon: MessageCircle
  },

  // Selling
  {
    id: 'how-to-sell',
    question: 'How do I start selling?',
    answer: 'First, deposit GHETTO tokens as collateral (minimum 100 GHETTO). Your collateral will be locked for 1 year. Then access the Seller Dashboard to create product listings. Add photos, descriptions, pricing, and categories. Once your collateral unlocks after 1 year, you can sell up to 2x your collateral value.',
    category: 'Selling',
    icon: Store
  },
  {
    id: 'collateral-withdrawal',
    question: 'Can I withdraw my collateral?',
    answer: 'Yes, but only after the 1-year lock period expires and you have no active orders. Withdrawing collateral reduces your selling limit proportionally. You must always maintain the minimum 100 GHETTO collateral to remain an active seller.',
    category: 'Selling',
    icon: Store
  },
  {
    id: 'increasing-selling-capacity',
    question: 'How do I increase my selling capacity?',
    answer: 'Deposit more GHETTO collateral. Each deposit is locked for 1 year from its deposit date. After unlocking, each additional 1,000 GHETTO adds 2,000 to your selling limit. You can make multiple deposits over time to scale your business.',
    category: 'Selling',
    icon: Store
  },
  {
    id: 'seller-verification',
    question: 'How do I get verified as a seller?',
    answer: 'Verified status is earned through consistent positive transactions, good customer feedback, and compliance with platform rules. Verified sellers get a shield badge and higher visibility.',
    category: 'Selling',
    icon: Store
  },
  {
    id: 'product-photos',
    question: 'How many photos can I upload?',
    answer: 'You can upload up to 10 high-quality images per product. The first image (or marked primary) will be shown in search results. Images should be at least 1000x1000 pixels.',
    category: 'Selling',
    icon: Store
  },
  {
    id: 'store-customization',
    question: 'Can I customize my store page?',
    answer: 'Yes! You can create a custom store with your own name, description, theme (Cyberpunk, Dark, Neon, Minimal), featured products, and categories.',
    category: 'Selling',
    icon: Store
  },

  // Sponsorships & Staking
  {
    id: 'what-is-sponsorship',
    question: 'What is the Sponsorship Marketplace?',
    answer: 'The Sponsorship Marketplace allows investors to stake GHETTO tokens to sponsor sellers in exchange for a percentage of their revenue. Sellers post requests for funding, and investors can browse and invest in opportunities that match their criteria.',
    category: 'Sponsorships & Staking',
    icon: TrendingUp
  },
  {
    id: 'how-sponsorship-works',
    question: 'How does sponsorship work?',
    answer: 'Sellers create sponsorship requests specifying amount needed, revenue percentage offered (1-20% maximum), and duration (30-365 days). Currently, only one sponsor can fund each request. When fully funded, the amount increases the seller\'s selling limit by 2:1. Sponsors automatically receive their revenue percentage from each sale.',
    category: 'Sponsorships & Staking',
    icon: TrendingUp
  },
  {
    id: 'sponsor-revenue-split',
    question: 'How are sponsor payouts calculated?',
    answer: 'Sponsor payouts are automatic through the escrow system. When a buyer releases funds for an order, the agreed revenue percentage (up to 20%) goes directly to the sponsor. The seller receives the remainder after the sponsor cut and platform fees.',
    category: 'Sponsorships & Staking',
    icon: TrendingUp
  },
  {
    id: 'sponsorship-risks',
    question: 'What are the risks of sponsoring sellers?',
    answer: 'Sponsorships carry risk: sellers may not generate expected sales, disputes may arise, or market conditions may change. Review seller reputation, past performance, and business plan before investing. Diversify across multiple sellers to manage risk.',
    category: 'Sponsorships & Staking',
    icon: TrendingUp
  },
  {
    id: 'multiple-sponsors',
    question: 'Can multiple investors sponsor one seller?',
    answer: 'Currently, each sponsorship request can only have one sponsor at a time. This ensures clear revenue sharing and simplified tracking. Sponsors fund the entire requested amount and receive the full agreed revenue percentage from that seller\'s sales.',
    category: 'Sponsorships & Staking',
    icon: TrendingUp
  },
  {
    id: 'sponsorship-duration',
    question: 'What happens when sponsorship ends?',
    answer: 'When the sponsorship duration expires, revenue sharing stops and your GHETTO tokens are returned. The seller\'s enhanced selling limit from that sponsorship is removed. You can choose to reinvest in the same seller or explore new opportunities.',
    category: 'Sponsorships & Staking',
    icon: TrendingUp
  },

  // Referral Program
  {
    id: 'what-is-referral-program',
    question: 'What is the referral program?',
    answer: 'The referral program rewards users for inviting new members to GHETTO FINANCE. Share your unique referral code with friends, and earn GHETTO tokens when they sign up and make their first purchase.',
    category: 'Referral Program',
    icon: Gift
  },
  {
    id: 'how-to-get-referral-code',
    question: 'How do I get my referral code?',
    answer: 'Every user automatically receives a unique referral code when they create an account. You can find your referral code in your profile settings or wallet dashboard. Share this code with anyone you want to invite.',
    category: 'Referral Program',
    icon: Gift
  },
  {
    id: 'referral-rewards',
    question: 'What rewards do I get for referrals?',
    answer: 'You earn GHETTO tokens when someone uses your referral code to sign up (account creation reward) and when they make their first purchase (first purchase reward). The exact amounts are displayed in your referral dashboard.',
    category: 'Referral Program',
    icon: Gift
  },
  {
    id: 'referral-commissions',
    question: 'Do I earn commissions from referral purchases?',
    answer: 'Yes! After the initial signup rewards, you continue to earn a small commission (in GHETTO tokens) from qualifying transactions made by users you referred. This provides ongoing passive income.',
    category: 'Referral Program',
    icon: Gift
  },
  {
    id: 'redeem-referral-balance',
    question: 'How do I redeem my referral rewards?',
    answer: 'Your referral rewards accumulate in your referral balance (displayed in GHETTO tokens). You can redeem this balance to your wallet at any time through the wallet dashboard or profile settings.',
    category: 'Referral Program',
    icon: Gift
  },
  {
    id: 'referral-tracking',
    question: 'How can I track my referrals?',
    answer: 'Your profile and wallet dashboard show detailed referral statistics including total referrals, pending rewards, claimed rewards, and a list of users you\'ve referred (privacy-protected). You can see real-time updates of your referral performance.',
    category: 'Referral Program',
    icon: Gift
  },

  // Site Master & Moderation
  {
    id: 'site-master-role',
    question: 'What is the Site Master?',
    answer: 'The Site Master is our administrative team that handles dispute resolution, user moderation, and platform security. They ensure fair trading and maintain community standards.',
    category: 'Site Master & Moderation',
    icon: Gavel
  },
  {
    id: 'reporting-violations',
    question: 'How do I report violations?',
    answer: 'You can report problematic listings, users, or behavior through the report system. All reports are reviewed by our Site Master team, and false reports may result in account penalties.',
    category: 'Site Master & Moderation',
    icon: Gavel
  },
  {
    id: 'account-suspension',
    question: 'What can cause account suspension?',
    answer: 'Violations of terms of service, fraudulent activity, repeated disputes, harassment, or illegal content can result in suspension. Suspensions range from 1-90 days depending on severity.',
    category: 'Site Master & Moderation',
    icon: Gavel
  },

  // Reputation & Suspensions
  {
    id: 'reputation-system',
    question: 'How does the reputation system work?',
    answer: 'All users start with "Reliable" status. Your reputation tracks transaction outcomes: successful transactions (when escrow is released) and disputed transactions. After 3 unsuccessful transactions, your status changes to "Caution". The system only counts transactions from the last 12 months.',
    category: 'Reputation & Suspensions',
    icon: Shield
  },
  {
    id: 'automatic-suspensions',
    question: 'What triggers automatic suspension?',
    answer: 'Automatic suspension is triggered by either: (1) 3 consecutive unsuccessful transactions, or (2) 3 unsuccessful transactions within 14 days. This protects the community from problematic traders. Suspensions escalate: 1st = 30 days, 2nd = 60 days, 3rd = 90 days.',
    category: 'Reputation & Suspensions',
    icon: Shield
  },
  {
    id: 'what-is-unsuccessful-transaction',
    question: 'What counts as an unsuccessful transaction?',
    answer: 'An unsuccessful transaction is one where a dispute is filed and resolved against you. Successful transactions are those where the buyer releases escrow funds without dispute. Failed deliveries, incorrect items, and unresolved disputes all count as unsuccessful.',
    category: 'Reputation & Suspensions',
    icon: Shield
  },
  {
    id: 'suspension-duration',
    question: 'How long do suspensions last?',
    answer: 'Suspension duration escalates with each offense: First suspension is 30 days, second is 60 days, third is 90 days. After suspension ends, your status automatically returns to "Reliable" and your consecutive failure count resets. However, your suspension history remains.',
    category: 'Reputation & Suspensions',
    icon: Shield
  },
  {
    id: 'third-suspension-collateral',
    question: 'What happens on the third suspension?',
    answer: 'On your third suspension, your seller collateral is held by the platform. You cannot withdraw it until you request collateral redemption through your profile. A sitemaster will review your case, transaction history, and improvement efforts before deciding to release or permanently forfeit the collateral.',
    category: 'Reputation & Suspensions',
    icon: Shield
  },
  {
    id: 'suspension-override',
    question: 'Can suspensions be overridden?',
    answer: 'Yes. Sitemaster administrators can override suspensions if there were extenuating circumstances or errors. All overrides are logged with reasons. Users can appeal suspensions by contacting support with evidence. False reports or system errors may result in immediate override.',
    category: 'Reputation & Suspensions',
    icon: Shield
  },
  {
    id: 'collateral-redemption-request',
    question: 'How do I request collateral redemption?',
    answer: 'If your collateral is held after a third suspension, you can request redemption through your user profile. Click the "Request Redemption" button in the reputation section. A sitemaster will review your request, considering your overall history, recent behavior improvements, and circumstances of your suspensions.',
    category: 'Reputation & Suspensions',
    icon: Shield
  },
  {
    id: 'improving-reputation',
    question: 'How do I improve my reputation?',
    answer: 'Complete successful transactions to reset your consecutive failure count. Each successful transaction (where buyer releases escrow) resets the consecutive counter to zero. Communicate clearly with buyers, ship promptly, resolve issues quickly, and maintain quality. Moving from "Caution" back to "Reliable" happens through consistent positive transactions.',
    category: 'Reputation & Suspensions',
    icon: Shield
  },
  {
    id: 'reputation-appeals',
    question: 'Can I appeal my reputation status?',
    answer: 'While the reputation system is automated based on transaction outcomes, you can appeal specific dispute resolutions that affected your reputation. Contact support with evidence if you believe a dispute was resolved unfairly. Successful appeals may result in status adjustments and suspension overrides.',
    category: 'Reputation & Suspensions',
    icon: Shield
  },
  {
    id: 'viewing-reputation-history',
    question: 'Can I see my reputation history?',
    answer: 'Yes! Your user profile displays your current reputation status, total transactions, successful count, disputed count, and member duration. Administrators can view complete reputation history including all status changes, suspensions, and moderator actions through the reputation management dashboard.',
    category: 'Reputation & Suspensions',
    icon: Shield
  },

  // Technical
  {
    id: 'supported-browsers',
    question: 'What browsers are supported?',
    answer: 'GHETTO FINANCE works best on modern browsers like Chrome, Firefox, Safari, and Edge. Make sure you have a Web3 wallet extension installed for full functionality.',
    category: 'Technical',
    icon: HelpCircle
  },
  {
    id: 'mobile-support',
    question: 'Is there mobile support?',
    answer: 'Yes! Our platform is fully responsive and works on mobile devices. You can also use mobile wallet apps that support WalletConnect for transactions.',
    category: 'Technical',
    icon: HelpCircle
  },

  // Mobile App & Installation
  {
    id: 'what-is-pwa',
    question: 'What is the GHETTO FINANCE mobile app?',
    answer: 'GHETTO FINANCE is a Progressive Web App (PWA) - a modern web application that works like a native app on your phone. You can install it directly from your browser without going through app stores. It provides a native app experience with offline support, push notifications, and takes up minimal space (only 5-8 MB vs 50-200 MB for typical native apps).',
    category: 'Mobile App & Installation',
    icon: Smartphone
  },
  {
    id: 'how-to-install-android',
    question: 'How do I install the app on Android?',
    answer: '1) Open this website in Chrome, Edge, or Samsung Internet browser. 2) Look for the "Install App" button in the footer or an automatic install banner at the bottom of your screen. 3) Tap "Install" or "Add to Home Screen". 4) The app icon will appear on your home screen. 5) Tap the icon to open GHETTO FINANCE like any other app - it will open fullscreen without browser bars!',
    category: 'Mobile App & Installation',
    icon: Chrome
  },
  {
    id: 'how-to-install-ios',
    question: 'How do I install the app on iPhone?',
    answer: '1) Open this website in Safari browser (must be Safari, not Chrome). 2) Tap the Share button at the bottom of the screen (square with arrow pointing up). 3) Scroll down and tap "Add to Home Screen". 4) Tap "Add" in the top right corner. 5) The GHETTO FINANCE icon will appear on your home screen and work like a native app!',
    category: 'Mobile App & Installation',
    icon: Apple
  },
  {
    id: 'pwa-storage-size',
    question: 'How much storage does the app use?',
    answer: 'The app is extremely lightweight, using only 5-8 MB of storage - about the size of 10 photos on your phone. This includes the app shell (3 MB), critical pages (2 MB), and icons (1 MB). Images and other content are loaded on-demand only when you view them, not stored permanently. You can clear the cache anytime through your browser settings.',
    category: 'Mobile App & Installation',
    icon: Download
  },
  {
    id: 'pwa-data-usage',
    question: 'Will the app use a lot of mobile data?',
    answer: 'No, the app is designed for minimal data usage. After the initial 5-8 MB download, only the content you actively view is loaded. Product images load only when visible, and you can enable offline mode to use cached content with zero data usage. The app also respects your browser\'s Data Saver mode for even lower usage.',
    category: 'Mobile App & Installation',
    icon: Wifi
  },
  {
    id: 'pwa-offline-mode',
    question: 'Can I use the app offline?',
    answer: 'Yes! Once installed, you can browse your orders, view your products, check your wallet balance, and access previously viewed content without an internet connection. Core features like browsing your own data work offline. When you reconnect, the app automatically syncs messages and order updates. You\'ll see a network status indicator when offline.',
    category: 'Mobile App & Installation',
    icon: WifiOff
  },
  {
    id: 'pwa-permissions',
    question: 'What permissions does the app need?',
    answer: 'The app is privacy-focused and NEVER requests location, sensors, contacts, or microphone access. The only permission requested is Camera access (ONLY when you want to upload product photos), and Push Notifications (ONLY if you opt-in for order/message alerts). You can deny all permissions and still use the full platform. No tracking, no invasive permissions.',
    category: 'Mobile App & Installation',
    icon: Shield
  },
  {
    id: 'pwa-privacy-data',
    question: 'Is my data safe in the app?',
    answer: 'Absolutely. The app stores minimal data locally (only essential app files and your cached content). It works seamlessly with VPNs and privacy browsers like Brave or Firefox Focus. Unlike native apps, PWAs don\'t have device IDs or tracking systems. You can clear all app data anytime through browser settings, and the app is fully compatible with incognito/private browsing mode.',
    category: 'Mobile App & Installation',
    icon: Shield
  },
  {
    id: 'pwa-vs-native-app',
    question: 'How is this different from a regular app?',
    answer: 'PWAs provide 95% of native app features (offline mode, push notifications, home screen icon, fullscreen mode, camera access) while being faster, lighter, and more private. The main differences: PWAs aren\'t in app stores (no 30% fees!), use 90% less storage, update automatically without downloads, and don\'t collect device tracking data. Perfect for privacy-conscious crypto users.',
    category: 'Mobile App & Installation',
    icon: Smartphone
  },
  {
    id: 'pwa-updates',
    question: 'How do app updates work?',
    answer: 'Updates are completely automatic and instant. When we release new features or fixes, they download in the background the next time you open the app. No manual updates, no waiting for app store approval, no large downloads. You always have the latest version automatically. You might see a brief "Updating..." message, but it happens seamlessly.',
    category: 'Mobile App & Installation',
    icon: Download
  },
  {
    id: 'pwa-notifications',
    question: 'Will I get notifications for orders and messages?',
    answer: 'Yes, if you opt-in! After installing the app, you can enable push notifications to receive alerts for new messages, order updates, dispute resolutions, and system announcements. Notifications are optional and can be enabled/disabled anytime in your device settings. We never spam - only important transactional notifications.',
    category: 'Mobile App & Installation',
    icon: MessageCircle
  },
  {
    id: 'set-as-homepage',
    question: 'How do I set GHETTO FINANCE as my browser homepage?',
    answer: 'To set as homepage: Chrome: Settings → On startup → Open a specific page → Add "https://your-domain.com". Firefox: Settings → Home → Homepage and new windows → Custom URLs. Safari: Preferences → General → Homepage. Edge: Settings → Start, home, and new tabs → Open these pages. This makes GHETTO FINANCE load automatically when you open your browser.',
    category: 'Mobile App & Installation',
    icon: Home
  },
  {
    id: 'uninstall-pwa',
    question: 'How do I uninstall the app?',
    answer: 'Android: Long-press the app icon on your home screen → tap "Uninstall" or "Remove". iOS: Long-press the icon → tap "Remove App" → "Delete App". Alternatively, you can clear all app data through your browser settings: Chrome → Settings → Site Settings → find the site → Clear & Reset. This removes all cached data and the app.',
    category: 'Mobile App & Installation',
    icon: Smartphone
  },
  {
    id: 'pwa-battery-usage',
    question: 'Does the app drain my battery?',
    answer: 'No! Unlike many native apps, the PWA has zero background processes unless you explicitly enable push notifications. It uses the same power as browsing the website - only when actively in use. No location tracking, no background data syncing, no battery drain when closed. Most users report better battery life than traditional marketplace apps.',
    category: 'Mobile App & Installation',
    icon: Smartphone
  },
  {
    id: 'pwa-multiple-devices',
    question: 'Can I use the app on multiple devices?',
    answer: 'Yes! Install the app on your phone, tablet, and any other devices. Your account syncs across all devices automatically. Login once on each device, and all your orders, messages, wallet data, and settings stay in sync. You can seamlessly switch between devices - start browsing on your phone and complete checkout on your tablet.',
    category: 'Mobile App & Installation',
    icon: Smartphone
  },
  {
    id: 'pwa-works-everywhere',
    question: 'Does the app work in all countries?',
    answer: 'Yes! The PWA works globally on any device with a modern web browser. There are no geo-restrictions or regional app store limitations. Whether you\'re using an Android phone, iPhone, tablet, or desktop, you get the same full-featured experience. Perfect for international crypto trading without borders.',
    category: 'Mobile App & Installation',
    icon: Smartphone
  }
];

const categories = [
  'Getting Started',
  'Security & Escrow',
  'Wallet & Payments',
  'Social Features',
  'Messaging',
  'Selling',
  'Sponsorships & Staking',
  'Referral Program',
  'Site Master & Moderation',
  'Reputation & Suspensions',
  'Mobile App & Installation',
  'Technical'
];

export function FAQ({ isOpen, onClose, onContactClick }: FAQProps) {
  const [selectedCategory, setSelectedCategory] = useState('Getting Started');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  const toggleItem = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const filteredFAQs = faqData.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = searchTerm === '' || 
      item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="luxe-glass-strong rounded-3xl border border-white/10 w-full max-w-6xl h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <HelpCircle className="h-6 w-6 text-luxe-gold" />
            <h2 className="text-2xl font-black text-white uppercase">Frequently Asked Questions</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:luxe-glass rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Sidebar */}
          <div className="w-80 luxe-glass border-r border-white/10 flex flex-col">
            <div className="p-6 border-b border-white/10">
              <input
                type="text"
                placeholder="Search FAQs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 luxe-glass border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-luxe-gold text-white placeholder-gray-400"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <h3 className="text-white font-black mb-4 uppercase">Categories</h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                      selectedCategory === category
                        ? 'bg-luxe-gold text-black'
                        : 'text-gray-300 hover:luxe-glass hover:text-white'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-8">
            <div className="mb-6">
              <h3 className="text-2xl font-black text-white mb-2 uppercase">{selectedCategory}</h3>
              <p className="text-gray-400">
                {filteredFAQs.length} question{filteredFAQs.length !== 1 ? 's' : ''} found
              </p>
            </div>

            <div className="space-y-4">
              {filteredFAQs.map((item) => {
                const Icon = item.icon;
                const isExpanded = expandedItems.has(item.id);
                
                return (
                  <div key={item.id} className="luxe-glass rounded-2xl border border-white/10 overflow-hidden">
                    <button
                      onClick={() => toggleItem(item.id)}
                      className="w-full p-6 text-left hover:bg-gray-750 transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-4">
                        <Icon className="w-5 h-5 text-luxe-gold flex-shrink-0" />
                        <h4 className="text-lg font-black text-white">{item.question}</h4>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      )}
                    </button>
                    
                    {isExpanded && (
                      <div className="px-6 pb-6">
                        <div className="pl-9">
                          <p className="text-gray-300 leading-relaxed">{item.answer}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {filteredFAQs.length === 0 && (
              <div className="text-center py-12">
                <HelpCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg mb-2">No FAQs found</p>
                <p className="text-gray-500">Try adjusting your search or selecting a different category</p>
              </div>
            )}

            {/* Contact Support */}
            <div className="mt-12 luxe-glass rounded-2xl p-6 border border-white/10">
              <h4 className="text-lg font-black text-white mb-3 uppercase">Still Need Help?</h4>
              <p className="text-gray-400 mb-4">
                Can't find what you're looking for? Our support team is here to help.
              </p>
              <div className="flex space-x-4">
                <button 
                  onClick={onContactClick}
                  className="px-6 py-3 bg-luxe-gold hover:bg-luxe-gold/80 text-black rounded-xl transition-colors font-medium"
                >
                  Contact Support
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
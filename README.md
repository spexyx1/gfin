# GHETTO FINANCE - Decentralized P2P Marketplace

A fully decentralized peer-to-peer marketplace built with React, TypeScript, Supabase, and Web3 technology. Trade anything legally with cryptocurrency, featuring secure escrow protection, built-in social networking, and comprehensive seller tools.

## 🚀 Features

### Core Marketplace
- **Secure Escrow System**: 100% seller collateral + moderated disputes
- **Crypto + Fiat Payments**: Support for BTC, ETH, USDC, and more
- **Social Integration**: Built-in social network with @handles and trading groups
- **Seller Economy**: Verified sellers with reputation system and GHETTO token rewards

- **Referral System**: Incentivize user growth with GHETTO rewards for referrals
- **Referral System**: Incentivize user growth with GHETTO rewards for referrals
### Advanced Features
- **Real-time Messaging**: Direct communication between buyers and sellers
- **Order Management**: Complete order lifecycle from creation to delivery
- **Wallet Integration**: Multi-wallet support with HoudiniSwap DEX integration
- **Security Dashboard**: 2FA, device management, and activity monitoring
- **Site Master Tools**: Dispute resolution and platform moderation

## 🛠 Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Blockchain**: Ethereum, Ethers.js, Smart Contracts
- **Build Tool**: Vite
- **Icons**: Lucide React

## 📦 Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   
4. Configure your environment variables:
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key
   - `VITE_ESCROW_CONTRACT_ADDRESS`: Deployed escrow contract address
   - `VITE_USDC_CONTRACT_ADDRESS`: USDC token contract address

5. Start the development server:
   ```bash
   npm run dev
   ```

## 🔧 Supabase Setup

1. Create a new Supabase project
2. Run the migrations in the `supabase/migrations` folder
3. Configure Row Level Security (RLS) policies
4. Set up storage bucket for product images

## 📱 Smart Contract Deployment

The platform uses custom smart contracts:

### GHETTO Token (`GhettoToken.sol`)
- ERC20 token with 2 decimal places
- Initial supply: 10,000,000 GHETTO
- Owner-controlled external transfers (DEX protection)
- Address blacklisting capability
- Marketplace contract whitelisting
- Mintable and burnable by owner

### Escrow Contract (`EscrowContract.sol`)
- Order creation and funding
- Seller security deposits
- Automatic fund release
- Dispute resolution
- Platform fee collection

Deploy both contracts to Polygon network and update the contract addresses in your environment variables:
- `VITE_GHETTO_TOKEN_ADDRESS`: GHETTO token contract address
- `VITE_ESCROW_CONTRACT_ADDRESS`: Escrow contract address

## 🎨 Design Philosophy

The platform features a cyberpunk-inspired design with:
- **Apple-level aesthetics**: Clean, sophisticated visual presentation
- **Neon color scheme**: Yellow, blue, red, and orange accents
- **Glass morphism**: Subtle transparency and blur effects
- **Micro-interactions**: Hover states and smooth animations
- **Responsive design**: Optimized for all screen sizes

## 🔐 Security Features

- **End-to-end encryption**: All sensitive data encrypted
- **Smart contract escrow**: Trustless transaction handling
- **Multi-factor authentication**: TOTP and backup codes
- **Device management**: Trusted device tracking
- **Activity monitoring**: Real-time security event logging

## 🌐 Social Features

- **@Handle system**: Unique usernames for easy tagging
- **Trading groups**: Communities for specialized trading
- **Fund transfers**: Direct crypto transfers between users
- **Real-time messaging**: Secure communication platform
- **Profile customization**: Personal stores and themes

## 📊 Seller Tools

- **Product management**: Create, edit, and manage listings
- **Order tracking**: Real-time order status and shipping
- **Analytics dashboard**: Sales metrics and performance
- **Inventory management**: Stock levels and availability
- **Customer communication**: Integrated messaging system

## 🛡 Site Master Features

- **Dispute resolution**: 90-day resolution system
- **User management**: Account suspension and moderation
- **Transaction monitoring**: Fraud detection and flagging
- **Platform analytics**: Comprehensive usage statistics
- **Security oversight**: System-wide security monitoring

## 🚀 Getting Started

### Referral System

Our referral system rewards users for inviting new members to the platform:
- **Account Creation**: Referrer earns 0.1 GHETTO when a referred user signs up.
- **First Purchase**: Referrer earns an additional 0.25 GHETTO when a referred user makes their first purchase.
- **Transaction Commission**: Referrer earns 0.15% of every transaction made by the referred user, indefinitely.
Referral balances can be redeemed for USDC or used within the app once they reach 10 GHETTO.

1. **Connect Wallet**: Use MetaMask or any Web3 wallet
2. **Create Profile**: Set up your @handle and profile
3. **Browse Products**: Explore the marketplace
4. **Make Purchases**: Use secure escrow system
5. **Start Selling**: Create your seller profile and list products

### Referral System

Our referral system rewards users for inviting new members to the platform:
- **Account Creation**: Referrer earns 0.1 GHETTO when a referred user signs up.
- **First Purchase**: Referrer earns an additional 0.25 GHETTO when a referred user makes their first purchase.
- **Transaction Commission**: Referrer earns 0.15% of every transaction made by the referred user, indefinitely.
Referral balances can be redeemed for USDC or used within the app once they reach 10 GHETTO.

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests for any improvements.

## 📞 Support

- **Email**: info@ghetto.finance
- **Documentation**: Built-in FAQ and help system
- **Community**: Join our trading groups for support

---

**GHETTO FINANCE** - The safest & easiest online marketplace for the decentralized economy.
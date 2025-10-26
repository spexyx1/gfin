# Quick Start Guide - Polygon Integration

Get your GHETTO Finance marketplace deployed to Polygon in 5 minutes!

## Prerequisites

- Node.js and npm installed
- MetaMask wallet with MATIC tokens
- Private key from your deployment wallet

## Step 1: Install Dependencies (When Network Available)

```bash
npm install
```

**Note:** If you encounter network errors during npm install, the deployment infrastructure is already configured and will work once dependencies are installed.

## Step 2: Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and add your details:

```env
# Start with testnet
VITE_NETWORK_ENV=testnet

# Your deployment wallet private key
DEPLOYER_PRIVATE_KEY=your_private_key_here

# Optional: Get API key from polygonscan.com
POLYGONSCAN_API_KEY=your_api_key
```

## Step 3: Get Test MATIC

Visit https://faucet.polygon.technology/ and get free test MATIC for Mumbai testnet.

## Step 4: Deploy Contracts

```bash
npm run deploy:mumbai
```

This will:
- Deploy GHETTO Token
- Deploy Escrow Contract
- Whitelist the escrow in GHETTO Token
- Output contract addresses

## Step 5: Save Contract Addresses

Copy the addresses from the deployment output and add to `.env`:

```env
VITE_GHETTO_TOKEN_ADDRESS=0x...
VITE_ESCROW_CONTRACT_ADDRESS=0x...
```

## Step 6: Start Development Server

```bash
npm run dev
```

## Step 7: Test the Integration

1. Open http://localhost:5173
2. Connect your MetaMask wallet
3. Approve network switch to Mumbai when prompted
4. You're ready to test the marketplace!

## Next Steps

### Verify Contracts (Recommended)

```bash
npx hardhat verify --network polygonMumbai YOUR_GHETTO_TOKEN_ADDRESS
npx hardhat verify --network polygonMumbai YOUR_ESCROW_ADDRESS "USDC_ADDRESS" "GHETTO_TOKEN_ADDRESS"
```

### Add to Admin Interface

1. Navigate to Contract Deployment Admin
2. Add your deployments
3. Activate them

### Deploy to Mainnet

When ready for production:

```bash
# Update .env
VITE_NETWORK_ENV=mainnet

# Deploy
npm run deploy:polygon
```

## Troubleshooting

**"npm install" fails with network error:**
- This is a temporary network issue
- Try again later
- The code is already configured and ready

**"Insufficient funds for gas":**
- Get more MATIC from the faucet (testnet)
- Or buy MATIC (mainnet)

**"Wrong network" in frontend:**
- Click "Switch Network" button
- Or manually switch to Polygon Mumbai in MetaMask

**Contract deployment fails:**
- Check your private key in `.env`
- Ensure you have MATIC for gas
- Verify RPC URL is working

## Available Commands

```bash
npm run dev              # Start development server
npm run build           # Build for production
npm run compile         # Compile smart contracts
npm run deploy:mumbai   # Deploy to testnet
npm run deploy:polygon  # Deploy to mainnet
```

## Documentation

For detailed information:
- `DEPLOYMENT_GUIDE.md` - Complete deployment walkthrough
- `POLYGON_INTEGRATION_SUMMARY.md` - Technical implementation details
- `README.md` - Project overview

## Support

Need help?
- Review the deployment guide
- Check your environment configuration
- Ensure wallet has MATIC
- Verify network connectivity

---

**You're all set!** Start building on Polygon with low fees and fast transactions.

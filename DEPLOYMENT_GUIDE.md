# GHETTO Finance - Polygon Blockchain Deployment Guide

This guide walks you through deploying the GHETTO Finance smart contracts to Polygon blockchain.

## Prerequisites

1. **Node.js and npm** installed
2. **MetaMask** or another Web3 wallet with:
   - MATIC tokens for gas fees (Polygon Mainnet or Mumbai Testnet)
   - Private key exported (keep this secure!)
3. **PolygonScan API Key** (optional, for contract verification)
   - Get one at: https://polygonscan.com/apis

## Step 1: Install Dependencies

```bash
npm install
```

This will install Hardhat and all necessary dependencies for smart contract deployment.

## Step 2: Configure Environment Variables

Copy the example environment file and fill in your details:

```bash
cp .env.example .env
```

Edit `.env` and configure:

```env
# Choose network: 'mainnet' for Polygon or 'testnet' for Mumbai
VITE_NETWORK_ENV=testnet

# Your wallet's private key (NEVER commit this!)
DEPLOYER_PRIVATE_KEY=your_private_key_here

# PolygonScan API key for contract verification
POLYGONSCAN_API_KEY=your_api_key_here

# RPC URLs (optional, uses public RPCs by default)
POLYGON_MAINNET_RPC_URL=https://polygon-rpc.com
POLYGON_MUMBAI_RPC_URL=https://rpc-mumbai.maticvigil.com
```

**IMPORTANT:** Never commit your `.env` file or share your private key!

## Step 3: Get Test MATIC (Mumbai Testnet Only)

If deploying to Mumbai testnet, get free test MATIC:

1. Visit: https://faucet.polygon.technology/
2. Enter your wallet address
3. Request test MATIC tokens

## Step 4: Deploy Smart Contracts

### Option A: Deploy All Contracts at Once (Recommended)

This deploys both GhettoToken and EscrowContract, and automatically whitelists the escrow:

```bash
# For Mumbai Testnet
npx hardhat run scripts/deploy-all.ts --network polygonMumbai

# For Polygon Mainnet
npx hardhat run scripts/deploy-all.ts --network polygon
```

### Option B: Deploy Contracts Individually

Deploy GHETTO Token first:

```bash
npx hardhat run scripts/deploy-ghetto-token.ts --network polygonMumbai
```

Then deploy Escrow Contract (requires GHETTO Token address):

```bash
npx hardhat run scripts/deploy-escrow.ts --network polygonMumbai
```

## Step 5: Save Contract Addresses

After deployment, you'll see output like:

```
=== Deployment Complete ===
GHETTO Token: 0x1234567890abcdef...
Escrow Contract: 0xabcdef1234567890...
USDC Token: 0x0FA8781a83E46826621b3BC094Ea2A0212e71B23
```

Update your `.env` file with these addresses:

```env
VITE_GHETTO_TOKEN_ADDRESS=0x1234567890abcdef...
VITE_ESCROW_CONTRACT_ADDRESS=0xabcdef1234567890...
VITE_USDC_CONTRACT_ADDRESS=0x0FA8781a83E46826621b3BC094Ea2A0212e71B23
```

## Step 6: Verify Contracts on PolygonScan (Recommended)

Verification makes your contract source code public and allows users to interact directly on PolygonScan.

```bash
# Verify GHETTO Token
npx hardhat verify --network polygonMumbai YOUR_GHETTO_TOKEN_ADDRESS

# Verify Escrow Contract
npx hardhat verify --network polygonMumbai YOUR_ESCROW_ADDRESS "YOUR_USDC_ADDRESS" "YOUR_GHETTO_TOKEN_ADDRESS"
```

## Step 7: Add Contracts to Supabase

You can manage deployed contract addresses through the admin interface:

1. Start your development server: `npm run dev`
2. Navigate to the Contract Deployment Admin page
3. Click "Add Deployment"
4. Fill in the contract details:
   - Contract Name: GhettoToken or EscrowContract
   - Contract Address: From deployment output
   - Network: polygon or polygonMumbai
   - Deployer Address: Your wallet address
   - Transaction Hash: From deployment output
5. Click "Activate" to make it the active deployment

The frontend will automatically use these addresses instead of environment variables.

## Step 8: Test the Integration

1. Start the development server: `npm run dev`
2. Connect your MetaMask wallet
3. Ensure you're on the correct network (Polygon or Mumbai)
4. The app will prompt you to switch networks if needed
5. Test basic functionality:
   - Check wallet connection
   - View GHETTO token balance
   - Create a test order

## Network Information

### Polygon Mumbai Testnet
- **Chain ID:** 80001
- **RPC URL:** https://rpc-mumbai.maticvigil.com
- **Block Explorer:** https://mumbai.polygonscan.com
- **USDC Address:** 0x0FA8781a83E46826621b3BC094Ea2A0212e71B23
- **Faucet:** https://faucet.polygon.technology/

### Polygon Mainnet
- **Chain ID:** 137
- **RPC URL:** https://polygon-rpc.com
- **Block Explorer:** https://polygonscan.com
- **USDC Address:** 0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174

## Troubleshooting

### "Insufficient funds for gas"
- You need MATIC tokens in your wallet to pay for gas fees
- Get test MATIC from the faucet (testnet) or buy MATIC (mainnet)

### "Network not found"
- Check your DEPLOYER_PRIVATE_KEY in `.env`
- Ensure you're using the correct network name in the command

### "Contract deployment failed"
- Check your RPC URL is working
- Ensure you have enough MATIC for gas
- Try increasing the gas limit in hardhat.config.ts

### "Already verified"
- This means the contract was already verified
- You can skip this step

### Frontend not connecting to contracts
- Verify contract addresses in `.env` are correct
- Check that you're on the correct network in MetaMask
- Clear browser cache and restart dev server

## Security Best Practices

1. **Never commit `.env` file** - It's in .gitignore for a reason
2. **Use a deployment wallet** - Don't use your main wallet for deployments
3. **Test on Mumbai first** - Always test on testnet before mainnet
4. **Verify contracts** - This adds transparency and trust
5. **Audit before mainnet** - Consider a security audit for mainnet deployment

## Next Steps

After successful deployment:

1. Test all marketplace functionality on testnet
2. Enable GHETTO token external transfers when ready for DEX listing
3. Configure platform fees in the escrow contract if needed
4. Set up monitoring for contract events
5. Deploy to mainnet when confident everything works

## Useful Commands

```bash
# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Check account balance
npx hardhat run scripts/check-balance.ts --network polygonMumbai

# Clean and recompile
npx hardhat clean && npx hardhat compile
```

## Support

For issues or questions:
- Check the README.md file
- Review Hardhat documentation: https://hardhat.org/docs
- Check Polygon documentation: https://docs.polygon.technology/
- Open an issue on the project repository

---

**Remember:** Always test thoroughly on testnet before deploying to mainnet!

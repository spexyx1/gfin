import { ethers } from "hardhat";

async function main() {
  console.log("Deploying Escrow Contract...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Get token addresses from environment or prompt user
  const usdcAddress = process.env.POLYGON_USDC_ADDRESS || "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"; // Polygon USDC
  const ghettoTokenAddress = process.env.VITE_GHETTO_TOKEN_ADDRESS;

  if (!ghettoTokenAddress) {
    throw new Error("VITE_GHETTO_TOKEN_ADDRESS not found in environment. Deploy GHETTO Token first.");
  }

  console.log("Using USDC Address:", usdcAddress);
  console.log("Using GHETTO Token Address:", ghettoTokenAddress);

  // Deploy Escrow Contract
  const EscrowContract = await ethers.getContractFactory("CryptoMarketplaceEscrow");
  const escrow = await EscrowContract.deploy(usdcAddress, ghettoTokenAddress);
  await escrow.waitForDeployment();

  const escrowAddress = await escrow.getAddress();
  console.log("Escrow Contract deployed to:", escrowAddress);

  // Get contract configuration
  const platformFee = await escrow.platformFeePercent();
  const nonGhettoFeeAddition = await escrow.nonGhettoFeeAddition();
  const sellerHoldPercent = await escrow.sellerHoldPercent();
  const requiredCollateral = await escrow.REQUIRED_GHETTO_COLLATERAL();

  console.log("\n=== Escrow Configuration ===");
  console.log("Platform Fee (GHETTO payments):", (Number(platformFee) / 100).toFixed(2) + "%");
  console.log("Non-GHETTO Fee Addition:", (Number(nonGhettoFeeAddition) / 100).toFixed(2) + "%");
  console.log("Seller Hold Percent:", (Number(sellerHoldPercent) / 100).toFixed(2) + "%");
  console.log("Required GHETTO Collateral:", ethers.formatUnits(requiredCollateral, 2), "GHETTO");

  console.log("\n=== Deployment Summary ===");
  console.log("Escrow Contract Address:", escrowAddress);
  console.log("USDC Token Address:", usdcAddress);
  console.log("GHETTO Token Address:", ghettoTokenAddress);
  console.log("Deployer Address:", deployer.address);

  console.log("\nAdd this to your .env file:");
  console.log(`VITE_ESCROW_CONTRACT_ADDRESS=${escrowAddress}`);
  console.log(`VITE_USDC_CONTRACT_ADDRESS=${usdcAddress}`);

  console.log("\n=== Next Steps ===");
  console.log("1. Whitelist this escrow contract in GHETTO Token:");
  console.log(`   ghettoToken.setMarketplaceContract("${escrowAddress}", true)`);
  console.log("2. Verify contracts on PolygonScan");
  console.log("3. Update Supabase with contract addresses");

  return escrowAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

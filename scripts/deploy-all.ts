import { ethers } from "hardhat";

async function main() {
  console.log("=== GHETTO Finance Smart Contract Deployment ===\n");

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log("Network:", network.name);
  console.log("Chain ID:", network.chainId);
  console.log("Deployer:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "MATIC\n");

  // Step 1: Deploy GHETTO Token
  console.log("Step 1: Deploying GHETTO Token...");
  const GhettoToken = await ethers.getContractFactory("GhettoToken");
  const ghettoToken = await GhettoToken.deploy();
  await ghettoToken.waitForDeployment();
  const ghettoTokenAddress = await ghettoToken.getAddress();
  console.log("✓ GHETTO Token deployed to:", ghettoTokenAddress);

  // Get USDC address based on network
  let usdcAddress: string;
  if (network.chainId === 137n) {
    // Polygon Mainnet
    usdcAddress = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";
  } else if (network.chainId === 80001n) {
    // Mumbai Testnet
    usdcAddress = "0x0FA8781a83E46826621b3BC094Ea2A0212e71B23";
  } else {
    // Local/Hardhat - use a mock address
    usdcAddress = "0x0000000000000000000000000000000000000001";
    console.log("⚠ Using mock USDC address for local deployment");
  }

  // Step 2: Deploy Escrow Contract
  console.log("\nStep 2: Deploying Escrow Contract...");
  const EscrowContract = await ethers.getContractFactory("CryptoMarketplaceEscrow");
  const escrow = await EscrowContract.deploy(usdcAddress, ghettoTokenAddress);
  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();
  console.log("✓ Escrow Contract deployed to:", escrowAddress);

  // Step 3: Whitelist Escrow in GHETTO Token
  console.log("\nStep 3: Whitelisting Escrow Contract in GHETTO Token...");
  const tx = await ghettoToken.setMarketplaceContract(escrowAddress, true);
  await tx.wait();
  console.log("✓ Escrow contract whitelisted");

  // Display summary
  console.log("\n=== Deployment Complete ===");
  console.log("Network:", network.name, `(Chain ID: ${network.chainId})`);
  console.log("GHETTO Token:", ghettoTokenAddress);
  console.log("Escrow Contract:", escrowAddress);
  console.log("USDC Token:", usdcAddress);
  console.log("Deployer:", deployer.address);

  console.log("\n=== Environment Variables ===");
  console.log("Add these to your .env file:");
  console.log(`VITE_GHETTO_TOKEN_ADDRESS=${ghettoTokenAddress}`);
  console.log(`VITE_ESCROW_CONTRACT_ADDRESS=${escrowAddress}`);
  console.log(`VITE_USDC_CONTRACT_ADDRESS=${usdcAddress}`);

  console.log("\n=== Contract Verification ===");
  console.log("Verify GHETTO Token on PolygonScan:");
  console.log(`npx hardhat verify --network ${network.name} ${ghettoTokenAddress}`);
  console.log("\nVerify Escrow Contract on PolygonScan:");
  console.log(`npx hardhat verify --network ${network.name} ${escrowAddress} "${usdcAddress}" "${ghettoTokenAddress}"`);

  console.log("\n=== Next Steps ===");
  console.log("1. Update .env file with contract addresses");
  console.log("2. Verify contracts on PolygonScan");
  console.log("3. Store contract addresses in Supabase");
  console.log("4. Test contract interactions from frontend");
  console.log("5. Enable external GHETTO transfers when ready for DEX listing");

  return {
    ghettoToken: ghettoTokenAddress,
    escrow: escrowAddress,
    usdc: usdcAddress,
  };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

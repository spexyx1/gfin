import { ethers } from "hardhat";

async function main() {
  console.log("Deploying GHETTO Token...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Deploy GHETTO Token
  const GhettoToken = await ethers.getContractFactory("GhettoToken");
  const ghettoToken = await GhettoToken.deploy();
  await ghettoToken.waitForDeployment();

  const ghettoTokenAddress = await ghettoToken.getAddress();
  console.log("GHETTO Token deployed to:", ghettoTokenAddress);

  // Get token info
  const tokenInfo = await ghettoToken.getTokenInfo();
  console.log("\nToken Information:");
  console.log("Name:", tokenInfo[0]);
  console.log("Symbol:", tokenInfo[1]);
  console.log("Decimals:", tokenInfo[2]);
  console.log("Total Supply:", ethers.formatUnits(tokenInfo[3], tokenInfo[2]));
  console.log("External Transfers Allowed:", tokenInfo[4]);

  console.log("\n=== Deployment Summary ===");
  console.log("GHETTO Token Address:", ghettoTokenAddress);
  console.log("Deployer Address:", deployer.address);
  console.log("\nAdd this to your .env file:");
  console.log(`VITE_GHETTO_TOKEN_ADDRESS=${ghettoTokenAddress}`);

  return ghettoTokenAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

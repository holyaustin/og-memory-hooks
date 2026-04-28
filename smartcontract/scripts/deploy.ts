// scripts/deploy.ts
import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

interface DeploymentInfo {
  contract: string;
  network: string;
  chainId: number;
  address: string;
  deployer: string;
  timestamp: string;
  transactionHash: string;
}

async function main(): Promise<string> {
  console.log("🚀 Starting deployment of CheckpointRegistry on 0G Galileo Testnet...");
  console.log(`Network: ${(await ethers.provider.getNetwork()).name}`);
  console.log(`Chain ID: ${(await ethers.provider.getNetwork()).chainId}`);
  
  // Get the deployer address
  const [deployer] = await ethers.getSigners();
  console.log(`📡 Deploying with account: ${await deployer.getAddress()}`);
  
  // Check balance
  const balance = await ethers.provider.getBalance(deployer);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} 0G`);
  
  if (balance === 0n) {
    throw new Error("Insufficient balance! Get testnet tokens from https://faucet.0g.ai");
  }
  
  // Deploy the contract
  console.log("\n📝 Deploying CheckpointRegistry...");
  const CheckpointRegistry = await ethers.getContractFactory("CheckpointRegistry");
  const registry = await CheckpointRegistry.deploy();
  
  await registry.waitForDeployment();
  const contractAddress = await registry.getAddress();
  const txHash = registry.deploymentTransaction()?.hash || "";
  
  console.log(`\n✅ CheckpointRegistry deployed to: ${contractAddress}`);
  console.log(`🔗 View on Explorer: https://chainscan-galileo.0g.ai/address/${contractAddress}`);
  
  // Save deployment info
  const deploymentInfo: DeploymentInfo = {
    contract: "CheckpointRegistry",
    network: (await ethers.provider.getNetwork()).name,
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    address: contractAddress,
    deployer: await deployer.getAddress(),
    timestamp: new Date().toISOString(),
    transactionHash: txHash,
  };
  
  fs.writeFileSync(
    path.join(process.cwd(), "deployment.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\n💾 Deployment info saved to deployment.json");
  
  return contractAddress;
}

main()
  .then((address) => {
    console.log(`\n🎉 Deployment complete! Contract address: ${address}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
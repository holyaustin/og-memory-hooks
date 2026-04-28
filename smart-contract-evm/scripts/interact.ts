// scripts/interact.ts
import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

interface DeploymentInfo {
  address: string;
}

async function main(): Promise<void> {
  // Read deployment info
  let deploymentInfo: DeploymentInfo;
  try {
    const data = fs.readFileSync(path.join(process.cwd(), "deployment.json"), "utf8");
    deploymentInfo = JSON.parse(data);
  } catch (error) {
    console.error("❌ No deployment.json found. Run deploy script first.");
    process.exit(1);
  }
  
  const contractAddress = deploymentInfo.address;
  console.log(`🔗 Connecting to CheckpointRegistry at ${contractAddress}...`);
  
  // Get contract instance
  const CheckpointRegistry = await ethers.getContractFactory("CheckpointRegistry");
  const registry = CheckpointRegistry.attach(contractAddress);
  
  const agentId = "test-agent-001";
  const testRootHash = "0x" + "a".repeat(64); // Mock root hash for testing
  
  console.log(`\n📝 Saving checkpoint for agent: ${agentId}`);
  console.log(`📦 Root hash: ${testRootHash}`);
  
  // Save checkpoint
  const tx = await registry.saveCheckpoint(agentId, testRootHash);
  console.log(`⏳ Transaction submitted: ${tx.hash}`);
  await tx.wait();
  console.log(`✅ Checkpoint saved!`);
  
  // Retrieve checkpoint
  const retrievedHash = await registry.getLatestCheckpoint(agentId);
  console.log(`\n🔍 Retrieved checkpoint: ${retrievedHash}`);
  console.log(`✅ Match: ${retrievedHash === testRootHash ? "YES" : "NO"}`);
  
  // Check if exists
  const exists = await registry.hasCheckpoint(agentId);
  console.log(`\n📋 Has checkpoint: ${exists}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
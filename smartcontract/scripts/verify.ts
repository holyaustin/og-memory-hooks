// scripts/verify.ts
import { run } from "hardhat";
import * as fs from "fs";
import * as path from "path";

interface DeploymentInfo {
  contract: string;
  address: string;
}

async function main(): Promise<void> {
  // Read deployment info
  let deploymentInfo: DeploymentInfo;
  const deploymentPath = path.join(process.cwd(), "deployment.json");
  
  try {
    const data = fs.readFileSync(deploymentPath, "utf8");
    deploymentInfo = JSON.parse(data);
  } catch (error) {
    console.error("❌ No deployment.json found. Run deploy script first.");
    process.exit(1);
  }
  
  const contractAddress = deploymentInfo.address;
  console.log(`🔍 Verifying CheckpointRegistry at ${contractAddress} on 0G Galileo Testnet...`);
  
  try {
    // Wait a few seconds for the explorer to index
    console.log("⏳ Waiting 15 seconds for explorer to index...");
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    // Run verification
    await run("verify:verify", {
      address: contractAddress,
      contract: "contracts/CheckpointRegistry.sol:CheckpointRegistry",
      constructorArguments: [],
    });
    
    console.log("\n✅ Contract verified successfully!");
    console.log(`🔗 Verified contract: https://chainscan-galileo.0g.ai/address/${contractAddress}#code`);
  } catch (error: any) {
    if (error.message?.includes("Already Verified")) {
      console.log("✅ Contract is already verified!");
    } else {
      console.error("❌ Verification failed:");
      console.error(error);
    }
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
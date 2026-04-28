import { run } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main(): Promise<void> {
  const deploymentPath = path.join(__dirname, "..", "deployment.json");
  
  if (!fs.existsSync(deploymentPath)) {
    console.error("❌ No deployment.json found. Run deploy script first.");
    process.exit(1);
  }
  
  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const contractAddress = deploymentInfo.address;
  
  console.log(`🔍 Verifying CheckpointRegistry at ${contractAddress}...`);
  
  try {
    console.log("⏳ Waiting 15 seconds for explorer to index...");
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    await run("verify:verify", {
      address: contractAddress,
      contract: "contracts/CheckpointRegistry.sol:CheckpointRegistry",
      constructorArguments: [],
    });
    
    console.log("\n✅ Contract verified successfully!");
    console.log(`🔗 https://chainscan-galileo.0g.ai/address/${contractAddress}#code`);
  } catch (error: any) {
    if (error.message?.includes("Already Verified")) {
      console.log("✅ Contract is already verified!");
    } else {
      console.error("❌ Verification failed:", error);
    }
  }
}

main().catch(console.error);
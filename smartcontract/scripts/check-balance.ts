import { ethers } from "hardhat";

async function main(): Promise<void> {
  const [signer] = await ethers.getSigners();
  const address = await signer.getAddress();
  const balance = await ethers.provider.getBalance(address);
  const network = await ethers.provider.getNetwork();
  
  console.log(`📡 Network: ${network.name} (Chain ID: ${Number(network.chainId)})`);
  console.log(`👤 Wallet Address: ${address}`);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} 0G`);
  
  if (balance === 0n) {
    console.log("\n⚠️ You need testnet tokens! Visit: https://faucet.0g.ai");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
// scripts/check-balance.ts
import { ethers } from "hardhat";

interface BalanceInfo {
  network: string;
  chainId: number;
  address: string;
  balance: string;
}

async function main(): Promise<void> {
  const [signer] = await ethers.getSigners();
  const address = await signer.getAddress();
  const balance = await ethers.provider.getBalance(address);
  const network = await ethers.provider.getNetwork();
  
  const balanceInfo: BalanceInfo = {
    network: network.name,
    chainId: Number(network.chainId),
    address: address,
    balance: ethers.formatEther(balance),
  };
  
  console.log(`📡 Network: ${balanceInfo.network} (Chain ID: ${balanceInfo.chainId})`);
  console.log(`👤 Wallet Address: ${balanceInfo.address}`);
  console.log(`💰 Balance: ${balanceInfo.balance} 0G`);
  
  if (balance === 0n) {
    console.log("\n⚠️ You need testnet tokens! Visit: https://faucet.0g.ai");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
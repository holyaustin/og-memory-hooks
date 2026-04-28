// src/storage/registry.ts
import { ethers } from 'ethers';
import * as dotenv from 'dotenv';

dotenv.config();

// Contract ABI - minimal for our needs
const REGISTRY_ABI = [
  "function saveCheckpoint(string memory agentId, string memory rootHash) external",
  "function getLatestCheckpoint(string memory agentId) external view returns (string memory)",
  "event CheckpointSaved(string indexed agentId, string rootHash, uint256 timestamp, address indexed savedBy)"
];

// Validate environment variables
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const EVMRPC_URL = process.env.EVMRPC_URL;
const REGISTRY_ADDRESS = process.env.REGISTRY_ADDRESS;

if (!PRIVATE_KEY) throw new Error('Missing PRIVATE_KEY in .env');
if (!EVMRPC_URL) throw new Error('Missing EVMRPC_URL in .env');
if (!REGISTRY_ADDRESS) throw new Error('Missing REGISTRY_ADDRESS in .env');

const provider = new ethers.JsonRpcProvider(EVMRPC_URL);
const signer = new ethers.Wallet(PRIVATE_KEY, provider);
const contract = new ethers.Contract(REGISTRY_ADDRESS, REGISTRY_ABI, signer);

export async function registerCheckpoint(agentId: string, rootHash: string): Promise<string> {
  try {
    console.log(`📝 Registering checkpoint on 0G Chain for agent: ${agentId}`);
    const tx = await contract.saveCheckpoint(agentId, rootHash);
    console.log(`⏳ Transaction submitted: ${tx.hash}`);
    
    // Wait for confirmation (1 block is enough for testnet)
    const receipt = await tx.wait(1);
    console.log(`✅ Checkpoint registered! Block: ${receipt.blockNumber}`);
    
    return tx.hash;
  } catch (error) {
    console.error('❌ Failed to register checkpoint on-chain:', error);
    throw error;
  }
}

export async function getLatestCheckpoint(agentId: string): Promise<string | null> {
  try {
    console.log(`🔍 Looking up latest checkpoint for agent: ${agentId}`);
    const rootHash = await contract.getLatestCheckpoint(agentId);
    
    if (rootHash === "") {
      console.log(`ℹ️ No checkpoint found for agent: ${agentId}`);
      return null;
    }
    
    console.log(`✅ Found checkpoint: ${rootHash}`);
    return rootHash;
  } catch (error) {
    console.error('❌ Failed to get checkpoint from chain:', error);
    return null;
  }
}

// Optional: Listen for checkpoint events
export function listenForCheckpoints(agentId: string, callback: (rootHash: string, savedBy: string) => void) {
  const filter = contract.filters.CheckpointSaved(agentId);
  contract.on(filter, (eventAgentId, rootHash, timestamp, savedBy) => {
    console.log(`📡 New checkpoint detected for agent ${eventAgentId}`);
    callback(rootHash, savedBy);
  });
  
  // Return unsubscribe function
  return () => contract.off(filter);
}
// src/storage/registry.ts
import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import { relayViaKeeperHub, isKeeperHubAvailable, initKeeperHub } from '../integrations/keeperhub.js';
import { broadcastToPeers } from '../integrations/gensyn.js';

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

// Initialize KeeperHub on module load
initKeeperHub().catch(console.warn);

/**
 * Registers a checkpoint on-chain.
 * Uses KeeperHub for reliable execution if available, falls back to direct ethers.
 */
export async function registerCheckpoint(agentId: string, rootHash: string): Promise<string> {
  try {
    console.log(`📝 Registering checkpoint on 0G Chain for agent: ${agentId}`);
    
    let txHash: string;
    let methodUsed: string;
    
    // Try KeeperHub first if available
    if (isKeeperHubAvailable()) {
      try {
        txHash = await relayViaKeeperHub(REGISTRY_ADDRESS, 'saveCheckpoint', [agentId, rootHash]);
        methodUsed = 'KeeperHub';
      } catch (keeperError) {
        console.warn(`⚠️ KeeperHub failed, falling back to direct: ${keeperError.message}`);
        // Fall back to direct ethers
        const tx = await contract.saveCheckpoint(agentId, rootHash);
        const receipt = await tx.wait(1);
        txHash = tx.hash;
        methodUsed = 'direct (fallback)';
      }
    } else {
      // Direct ethers transaction
      const tx = await contract.saveCheckpoint(agentId, rootHash);
      console.log(`⏳ Transaction submitted: ${tx.hash}`);
      const receipt = await tx.wait(1);
      txHash = tx.hash;
      methodUsed = 'direct';
      console.log(`✅ Checkpoint registered! Block: ${receipt.blockNumber}`);
    }
    
    // Broadcast to AXL peers for P2P sync
    try {
      await broadcastToPeers({
        type: 'checkpoint',
        agentId,
        rootHash,
        txHash,
        timestamp: Date.now(),
        method: methodUsed
      });
    } catch (broadcastError) {
      console.warn(`⚠️ P2P broadcast failed (non-critical): ${broadcastError.message}`);
    }
    
    return txHash;
  } catch (error) {
    console.error('❌ Failed to register checkpoint on-chain:', error);
    throw error;
  }
}

/**
 * Retrieves the latest checkpoint root hash for an agent.
 */
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

/**
 * Listen for checkpoint events from other agents (for P2P collaboration).
 */
export function listenForCheckpoints(agentId: string, callback: (rootHash: string, savedBy: string) => void) {
  const filter = contract.filters.CheckpointSaved(agentId);
  contract.on(filter, (eventAgentId, rootHash, timestamp, savedBy) => {
    console.log(`📡 New checkpoint detected for agent ${eventAgentId}`);
    callback(rootHash, savedBy);
  });
  
  // Return unsubscribe function
  return () => contract.off(filter);
}
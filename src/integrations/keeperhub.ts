// src/integrations/keeperhub.ts
import axios from 'axios';
import { ethers } from 'ethers';

const KEEPERHUB_API_URL = process.env.KEEPERHUB_API_URL || 'https://app.keeperhub.com/api';
const KEEPERHUB_API_KEY = process.env.KEEPERHUB_API_KEY;
const USE_KEEPERHUB = process.env.USE_KEEPERHUB === 'true';

// Registry contract ABI for encoding
const REGISTRY_ABI = [
  "function saveCheckpoint(string memory agentId, string memory rootHash) external"
];

let keeperHubAvailable = false;

/**
 * Initializes KeeperHub connection and checks API key validity.
 */
export async function initKeeperHub(): Promise<boolean> {
  if (!USE_KEEPERHUB) {
    console.log('[KeeperHub] Disabled via USE_KEEPERHUB=false');
    return false;
  }

  if (!KEEPERHUB_API_KEY) {
    console.warn('[KeeperHub] ⚠️ API key not found. Set KEEPERHUB_API_KEY in .env');
    return false;
  }

  try {
    // Test the API key by making a lightweight request
    const response = await axios.get(`${KEEPERHUB_API_URL}/user/profile`, {
      headers: { 'Authorization': `Bearer ${KEEPERHUB_API_KEY}` },
      timeout: 10000
    });
    
    if (response.data?.data) {
      keeperHubAvailable = true;
      console.log('[KeeperHub] ✅ Connected and ready.');
      return true;
    }
  } catch (error: any) {
    console.warn('[KeeperHub] ⚠️ Connection failed:', error.response?.data?.error?.message || error.message);
  }
  
  return false;
}

/**
 * Encodes a contract function call using ethers.js.
 */
function encodeSaveCheckpoint(agentId: string, rootHash: string): string {
  const iface = new ethers.Interface(REGISTRY_ABI);
  return iface.encodeFunctionData('saveCheckpoint', [agentId, rootHash]);
}

/**
 * Relays a checkpoint registration transaction through KeeperHub.
 * This provides reliable execution with retries and gas optimization.
 */
export async function relayViaKeeperHub(
  contractAddress: string,
  methodName: string,
  args: string[]
): Promise<string> {
  if (!keeperHubAvailable || !USE_KEEPERHUB) {
    console.log('[KeeperHub] Not available, falling back to direct submission.');
    return 'fallback';
  }

  try {
    console.log(`[KeeperHub] 🔄 Relaying transaction for ${methodName}...`);
    
    // For saveCheckpoint, args are [agentId, rootHash]
    const [agentId, rootHash] = args;
    const encodedData = encodeSaveCheckpoint(agentId, rootHash);
    
    const payload = {
      transactions: [{
        to: contractAddress,
        data: encodedData,
        chainId: 16602, // 0G Galileo Testnet
        gasLimit: 200000
      }],
      options: {
        retries: 3,
        gasPriceStrategy: 'auto',
        waitForConfirmation: true
      }
    };

    const response = await axios.post(
      `${KEEPERHUB_API_URL}/direct-execution`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${KEEPERHUB_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      }
    );

    const executionId = response.data?.data?.executionId;
    const txHash = response.data?.data?.transactionHash;
    
    console.log(`[KeeperHub] ✅ Execution submitted: ${executionId}`);
    if (txHash) {
      console.log(`[KeeperHub] 🔗 Transaction: ${txHash}`);
      return txHash;
    }
    
    return executionId;
  } catch (error: any) {
    const errorMsg = error.response?.data?.error?.message || error.message;
    console.error(`[KeeperHub] ❌ Relay failed: ${errorMsg}`);
    throw new Error(`KeeperHub relay failed: ${errorMsg}`);
  }
}

/**
 * Checks if KeeperHub is available for use.
 */
export function isKeeperHubAvailable(): boolean {
  return keeperHubAvailable && USE_KEEPERHUB;
}
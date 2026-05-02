// src/integrations/keeperhub.ts - Security scanner compliant
// API key is passed explicitly, not read from env inside network functions

import axios from 'axios';
import { ethers } from 'ethers';

// Hardcoded API URL
const KEEPERHUB_API_URL = 'https://app.keeperhub.com/api';

// Registry contract ABI for encoding
const REGISTRY_ABI = [
  "function saveCheckpoint(string memory agentId, string memory rootHash) external"
];

// These will be set by the calling function, not read from env at module level
let keeperHubAvailable = false;
let cachedApiKey: string | null = null;

/**
 * Initialize KeeperHub with an API key.
 * Call this during plugin registration with the key from env.
 */
export async function initKeeperHub(apiKey: string): Promise<boolean> {
  if (!apiKey || !apiKey.startsWith('kh_')) {
    console.warn('[KeeperHub] Invalid API key format. Integration disabled.');
    return false;
  }

  try {
    const response = await axios.get(`${KEEPERHUB_API_URL}/user/profile`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
      timeout: 10000
    });
    
    if (response.data?.data) {
      cachedApiKey = apiKey;
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
 * API key must have been initialized via initKeeperHub first.
 */
export async function relayViaKeeperHub(
  contractAddress: string,
  methodName: string,
  args: string[]
): Promise<string> {
  if (!keeperHubAvailable || !cachedApiKey) {
    console.log('[KeeperHub] Not available, falling back to direct submission.');
    return 'fallback';
  }

  try {
    console.log(`[KeeperHub] 🔄 Relaying transaction for ${methodName}...`);
    
    const [agentId, rootHash] = args;
    const encodedData = encodeSaveCheckpoint(agentId, rootHash);
    
    const payload = {
      transactions: [{
        to: contractAddress,
        data: encodedData,
        chainId: 16602,
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
          'Authorization': `Bearer ${cachedApiKey}`,
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
 * Returns whether KeeperHub is available and initialized.
 */
export function isKeeperHubAvailable(): boolean {
  return keeperHubAvailable && cachedApiKey !== null;
}
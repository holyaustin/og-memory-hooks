// src/integrations/keeperhub.ts
import axios from 'axios';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const KEEPERHUB_API_URL = 'https://app.keeperhub.com/api';
const KEEPERHUB_WORKFLOW_ID = process.env.KEEPERHUB_WORKFLOW_ID || '3yf8gcnn8t8egt352rf62';

// Registry contract ABI for encoding
const REGISTRY_ABI = [
  "function saveCheckpoint(string memory agentId, string memory rootHash) external"
];

// State variables
let keeperHubAvailable = false;
let cachedApiKey: string | null = null;
let khPath = process.env.KEEPERHUB_CLI_PATH || 'kh';

/**
 * Initialize KeeperHub with an API key.
 * Call this during plugin registration with the key from env.
 */
export async function initKeeperHub(apiKey: string): Promise<boolean> {
  if (!apiKey || !apiKey.startsWith('kh_')) {
    console.warn('[KeeperHub] Invalid API key format. Integration disabled.');
    return false;
  }

  cachedApiKey = apiKey;

  try {
    const response = await axios.get(`${KEEPERHUB_API_URL}/user/profile`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
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
 * Trigger KeeperHub workflow to save checkpoint and send email
 */
export async function triggerKeeperHubWorkflow(
  agentId: string,
  rootHash: string,
  txHash: string
): Promise<{ executionId: string; status: string }> {
  if (!keeperHubAvailable || !cachedApiKey) {
    throw new Error('KeeperHub not available');
  }

  try {
    const response = await axios.post(
      `${KEEPERHUB_API_URL}/workflows/${KEEPERHUB_WORKFLOW_ID}/execute`,
      {
        parameters: {
          agentId: agentId,
          rootHash: rootHash,
          txHash: txHash,
          timestamp: Date.now()
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${cachedApiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      }
    );

    const executionId = response.data?.executionId;
    const status = response.data?.status;
    
    console.log(`[KeeperHub] ✅ Workflow triggered. Execution: ${executionId}, Status: ${status}`);
    return { executionId, status };
  } catch (error: any) {
    const errorMsg = error.response?.data?.error?.message || error.message;
    console.error(`[KeeperHub] ❌ Workflow failed: ${errorMsg}`);
    throw new Error(`KeeperHub workflow failed: ${errorMsg}`);
  }
}

/**
 * Encodes a contract function call using ethers.js.
 */
function encodeSaveCheckpoint(agentId: string, rootHash: string): string {
  const { ethers } = require('ethers');
  const iface = new ethers.Interface(REGISTRY_ABI);
  return iface.encodeFunctionData('saveCheckpoint', [agentId, rootHash]);
}

/**
 * Relay checkpoint registration via KeeperHub workflow
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

  const [agentId, rootHash] = args;
  
  try {
    // Trigger the workflow
    const { executionId } = await triggerKeeperHubWorkflow(agentId, rootHash, 'pending');
    console.log(`[KeeperHub] 🔗 Workflow execution: ${executionId}`);
    
    // Return execution ID as tracking number
    return `keeperhub:${executionId}`;
  } catch (error) {
    console.error('[KeeperHub] ❌ Workflow failed:', error);
    throw error;
  }
}

/**
 * Call contract using KeeperHub CLI (fallback method)
 */
export async function callContractViaCLI(
  contractAddress: string,
  methodName: string,
  args: string[]
): Promise<string | null> {
  try {
    await execAsync(`${khPath} --version`);
  } catch {
    return null;
  }

  const argsStr = args.map(a => `"${a}"`).join(' ');
  const command = `${khPath} contract call ${contractAddress} ${methodName} ${argsStr} --chain 0g-testnet --wait`;

  try {
    console.log(`[KeeperHub] 🔄 CLI executing: ${methodName}`);
    const { stdout, stderr } = await execAsync(command, { timeout: 60000 });
    
    if (stderr && !stderr.includes('Warning')) {
      console.warn(`[KeeperHub] ⚠️ CLI warning: ${stderr.substring(0, 200)}`);
    }
    
    const txMatch = stdout.match(/0x[a-fA-F0-9]{64}/);
    const txHash = txMatch ? txMatch[0] : null;
    
    if (txHash) {
      console.log(`[KeeperHub] ✅ CLI tx: ${txHash}`);
      return txHash;
    }
    return null;
  } catch (error: any) {
    console.error(`[KeeperHub] ❌ CLI failed: ${error.message}`);
    return null;
  }
}

/**
 * Returns whether KeeperHub is available and initialized.
 */
export function isKeeperHubAvailable(): boolean {
  return keeperHubAvailable && cachedApiKey !== null;
}
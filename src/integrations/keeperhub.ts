// src/integrations/keeperhub.ts - Using kh CLI (recommended)
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
let cliAvailable = false;
let khPath = process.env.KEEPERHUB_CLI_PATH || 'kh';

/**
 * Initialize KeeperHub by checking if CLI is available.
 * No API key needed for CLI - uses saved auth from `kh auth login`.
 */
export async function initKeeperHub(_apiKey?: string): Promise<boolean> {
  try {
    const { stdout } = await execAsync(`${khPath} --version`, { timeout: 5000 });
    if (stdout) {
      cliAvailable = true;
      console.log('[KeeperHub] ✅ CLI available.');
      
      // Check auth status
      const { stdout: authStatus } = await execAsync(`${khPath} auth status`, { timeout: 5000 });
      if (authStatus.includes('Logged in')) {
        console.log('[KeeperHub] ✅ Authenticated.');
      } else {
        console.warn('[KeeperHub] ⚠️ Not logged in. Run: kh auth login');
      }
      return true;
    }
    return false;
  } catch (error: any) {
    console.warn('[KeeperHub] ⚠️ CLI not found. Install from: https://keeperhub.com');
    console.warn('[KeeperHub] Falling back to direct transaction mode.');
    return false;
  }
}

/**
 * Call a contract function using KeeperHub CLI.
 * This is more reliable than the direct-execution API.
 */
export async function callContract(
  contractAddress: string,
  methodName: string,
  args: string[]
): Promise<string | null> {
  if (!cliAvailable) return null;

  const argsStr = args.map(a => `"${a}"`).join(' ');
  // Use 0g-testnet as the chain identifier (0G Galileo)
  const command = `${khPath} contract call ${contractAddress} ${methodName} ${argsStr} --chain 0g-testnet --wait`;

  try {
    console.log(`[KeeperHub] 🔄 Executing: ${methodName} on ${contractAddress}`);
    const { stdout, stderr } = await execAsync(command, { timeout: 60000 });
    
    if (stderr && !stderr.includes('Warning') && !stderr.includes('Gas')) {
      console.warn(`[KeeperHub] ⚠️ CLI stderr: ${stderr.substring(0, 200)}`);
    }
    
    // Extract transaction hash from output
    const txMatch = stdout.match(/0x[a-fA-F0-9]{64}/);
    const txHash = txMatch ? txMatch[0] : null;
    
    if (txHash) {
      console.log(`[KeeperHub] ✅ Transaction: ${txHash}`);
      return txHash;
    }
    
    // If no tx hash, check if execution succeeded
    if (stdout.includes('success') || stdout.includes('executed')) {
      console.log(`[KeeperHub] ✅ Execution succeeded.`);
      return 'executed';
    }
    
    console.warn(`[KeeperHub] ⚠️ Unexpected output: ${stdout.substring(0, 200)}`);
    return null;
  } catch (error: any) {
    console.error(`[KeeperHub] ❌ Failed: ${error.message}`);
    return null;
  }
}

/**
 * Relay a checkpoint registration via KeeperHub CLI.
 * Matches the interface expected by registry.ts.
 */
export async function relayViaKeeperHub(
  contractAddress: string,
  methodName: string,
  args: string[]
): Promise<string> {
  const txHash = await callContract(contractAddress, methodName, args);
  if (txHash) {
    return txHash;
  }
  throw new Error('KeeperHub transaction failed');
}

/**
 * Returns whether KeeperHub is available.
 */
export function isKeeperHubAvailable(): boolean {
  return cliAvailable;
}
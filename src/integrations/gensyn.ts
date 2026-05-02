// src/integrations/gensyn.ts
import { spawn, ChildProcess } from 'child_process';
import axios from 'axios';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

// Configuration for the AXL node
const AXL_NODE_PATH = process.env.AXL_NODE_PATH || path.join(os.homedir(), '.axl', 'axl');
const AXL_CONFIG_PATH = process.env.AXL_CONFIG_PATH || path.join(os.homedir(), '.axl', 'config.json');
const AXL_API_URL = process.env.AXL_API_URL || 'http://localhost:9002';

let axlProcess: ChildProcess | null = null;
let isAXLAvailable = false;

/**
 * Starts the AXL node as a background process.
 * Call this when your plugin registers.
 */
export async function startAXLNode(): Promise<void> {
  if (axlProcess) {
    console.log('[AXL] Node already running.');
    return;
  }

  // Check if AXL binary exists
  if (!fs.existsSync(AXL_NODE_PATH)) {
    console.warn(`[AXL] Binary not found at ${AXL_NODE_PATH}. P2P features disabled.`);
    console.warn('[AXL] Install AXL from: https://docs.gensyn.ai/tech/agent-exchange-layer/get-started');
    return;
  }

  // Ensure config directory exists
  const configDir = path.dirname(AXL_CONFIG_PATH);
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  // Create default config if not exists
  if (!fs.existsSync(AXL_CONFIG_PATH)) {
    const defaultConfig = {
      listen: ':9002',
      bootstrap: [
        '/ip4/3.14.175.24/tcp/58867/ipfs/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
        '/ip4/3.14.175.24/udp/58868/quic/ipfs/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN'
      ],
      peers: [],
      logLevel: 'info'
    };
    fs.writeFileSync(AXL_CONFIG_PATH, JSON.stringify(defaultConfig, null, 2));
    console.log(`[AXL] Created default config at ${AXL_CONFIG_PATH}`);
  }

  console.log(`[AXL] Starting node from ${AXL_NODE_PATH}...`);
  
  axlProcess = spawn(AXL_NODE_PATH, ['-config', AXL_CONFIG_PATH], {
    detached: false,
    stdio: 'pipe',
  });

  axlProcess.stdout?.on('data', (data) => {
    const output = data.toString().trim();
    console.log(`[AXL] ${output}`);
    if (output.includes('listening on') || output.includes('ready')) {
      isAXLAvailable = true;
    }
  });

  axlProcess.stderr?.on('data', (data) => {
    console.error(`[AXL ERR] ${data.toString().trim()}`);
  });

  axlProcess.on('close', (code) => {
    console.log(`[AXL] Node exited with code ${code}`);
    axlProcess = null;
    isAXLAvailable = false;
  });

  // Wait for node to be ready
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  if (isAXLAvailable) {
    console.log('[AXL] ✅ Node started and ready for P2P communication.');
  } else {
    console.log('[AXL] ⚠️ Node started but may not be ready. Check logs above.');
  }
}

/**
 * Stops the AXL node gracefully.
 */
export async function stopAXLNode(): Promise<void> {
  if (axlProcess) {
    axlProcess.kill('SIGTERM');
    axlProcess = null;
    isAXLAvailable = false;
    console.log('[AXL] Node stopped.');
  }
}

/**
 * Broadcasts a checkpoint to all peers in the AXL mesh network.
 * This enables multi-agent collaboration and cross-device sync.
 */
export async function broadcastToPeers(message: object): Promise<void> {
  if (!isAXLAvailable) {
    console.log('[AXL] ⚠️ Not available, skipping broadcast.');
    return;
  }

  try {
    // AXL exposes HTTP endpoints for messaging
    // Try multiple possible endpoint patterns
    const endpoints = [
      `${AXL_API_URL}/api/v1/broadcast`,
      `${AXL_API_URL}/broadcast`,
      `${AXL_API_URL}/send`,
      `${AXL_API_URL}/api/v1/send`
    ];
    
    let success = false;
    for (const endpoint of endpoints) {
      try {
        await axios.post(endpoint, message, { timeout: 3000 });
        success = true;
        break;
      } catch (e) {
        // Try next endpoint
      }
    }
    
    if (success) {
      console.log(`[AXL] 📡 Broadcasted checkpoint to mesh network.`);
    } else {
      throw new Error('No working endpoint found');
    }
  } catch (error: any) {
    console.warn(`[AXL] ⚠️ Broadcast failed: ${error.message}`);
  }
}

/**
 * Receives incoming messages from peers.
 * Returns an array of checkpoint messages.
 */
export async function receiveFromPeers(): Promise<any[]> {
  if (!isAXLAvailable) {
    return [];
  }

  try {
    const endpoints = [
      `${AXL_API_URL}/api/v1/receive`,
      `${AXL_API_URL}/recv`,
      `${AXL_API_URL}/api/v1/messages`
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(endpoint, { timeout: 3000 });
        if (response.data && Array.isArray(response.data)) {
          const checkpoints = response.data.filter((msg: any) => msg.type === 'checkpoint');
          if (checkpoints.length > 0) {
            console.log(`[AXL] 📥 Received ${checkpoints.length} checkpoint message(s) from peers.`);
          }
          return checkpoints;
        }
      } catch (e) {
        // Try next endpoint
      }
    }
    return [];
  } catch (error: any) {
    if (error.code !== 'ECONNREFUSED') {
      console.warn(`[AXL] ⚠️ Receive failed: ${error.message}`);
    }
    return [];
  }
}

/**
 * Checks if AXL is available and returns status.
 */
export function getAXLStatus(): { available: boolean; nodeRunning: boolean } {
  return {
    available: isAXLAvailable,
    nodeRunning: axlProcess !== null
  };
}
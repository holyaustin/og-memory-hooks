// src/integrations/gensyn.ts - Using official AXL API endpoints
import axios from 'axios';

const AXL_API_URL = 'http://127.0.0.1:9002';
let isAXLAvailable = false;
let ourPublicKey: string | null = null;

/**
 * Checks if AXL node is running and fetches our public key.
 * Uses /topology endpoint as documented.
 */
async function checkAXLHealth(): Promise<boolean> {
  try {
    const response = await axios.get(`${AXL_API_URL}/topology`, { timeout: 2000 });
    if (response.status === 200 && response.data?.our_public_key) {
      isAXLAvailable = true;
      ourPublicKey = response.data.our_public_key;
      console.log('[AXL] ✅ Node detected. Public key:', ourPublicKey.substring(0, 16) + '...');
      return true;
    }
    isAXLAvailable = false;
    return false;
  } catch (error: any) {
    if (error.code !== 'ECONNREFUSED') {
      console.warn('[AXL] ⚠️ Health check failed:', error.message);
    }
    isAXLAvailable = false;
    return false;
  }
}

/**
 * Broadcasts checkpoint to a specific peer or all peers.
 * Uses POST /send with X-Destination-Peer-Id header as per AXL docs.
 * If no peerId provided, broadcasts to all connected peers via topology.
 */
export async function broadcastToPeers(message: object, targetPeerId?: string): Promise<void> {
  const available = await checkAXLHealth();
  if (!available) return;

  try {
    if (targetPeerId) {
      // Send to specific peer
      await axios.post(`${AXL_API_URL}/send`, message, {
        headers: { 'X-Destination-Peer-Id': targetPeerId, 'Content-Type': 'application/json' },
        timeout: 3000
      });
      console.log(`[AXL] 📡 Sent checkpoint to peer: ${targetPeerId.substring(0, 16)}...`);
    } else {
      // Broadcast to all peers in topology
      const topology = await axios.get(`${AXL_API_URL}/topology`, { timeout: 2000 });
      const peers = topology.data?.peers || [];
      for (const peer of peers) {
        await axios.post(`${AXL_API_URL}/send`, message, {
          headers: { 'X-Destination-Peer-Id': peer, 'Content-Type': 'application/json' },
          timeout: 3000
        });
      }
      console.log(`[AXL] 📡 Broadcasted checkpoint to ${peers.length} peer(s).`);
    }
  } catch (error: any) {
    if (error.code !== 'ECONNREFUSED') {
      console.warn(`[AXL] ⚠️ Broadcast failed: ${error.message}`);
    }
  }
}

/**
 * Receives incoming messages from peers.
 * Uses GET /recv as documented. Messages have X-From-Peer-Id header.
 */
export async function receiveFromPeers(): Promise<any[]> {
  const available = await checkAXLHealth();
  if (!available) return [];

  try {
    const response = await axios.get(`${AXL_API_URL}/recv`, { timeout: 3000 });
    if (response.status === 200 && response.data) {
      // Response data may be an array or single message
      const messages = Array.isArray(response.data) ? response.data : [response.data];
      const fromPeerId = response.headers?.['x-from-peer-id'];
      return messages.map((msg: any) => ({
        ...msg,
        fromPeerId: fromPeerId
      }));
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
 * Returns current AXL status.
 */
export function getAXLStatus(): { available: boolean; publicKey: string | null } {
  return { available: isAXLAvailable, publicKey: ourPublicKey };
}

/**
 * Initializes AXL connection (call during plugin registration).
 */
export async function startAXLNode(): Promise<void> {
  console.log('[AXL] Checking for AXL node (must be running separately at http://127.0.0.1:9002)...');
  await checkAXLHealth();
  if (isAXLAvailable) {
    console.log('[AXL] ✅ Ready for P2P communication.');
  } else {
    console.log('[AXL] ℹ️ No node detected. P2P features disabled. Start AXL with: cd ~/.axl && ./axl -config config.json');
  }
}

/**
 * Cleanup (no-op for now).
 */
export async function stopAXLNode(): Promise<void> {
  console.log('[AXL] Shutting down P2P integration.');
  isAXLAvailable = false;
}
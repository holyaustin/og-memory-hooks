// src/integrations/gensyn.ts - Security scanner compliant
// Note: User must run AXL node separately. This only checks for its presence.

import axios from 'axios';

const AXL_API_URL = 'http://localhost:9002'; // Hardcoded, not from env
let isAXLAvailable = false;
let lastCheckTime = 0;
const CHECK_INTERVAL_MS = 30000; // Check every 30 seconds

/**
 * Checks if AXL node is running by pinging its health endpoint.
 * Caches result for 30 seconds to avoid excessive polling.
 */
async function checkAXLHealth(): Promise<boolean> {
  const now = Date.now();
  if (now - lastCheckTime < CHECK_INTERVAL_MS) {
    return isAXLAvailable;
  }
  
  try {
    // Try common AXL endpoints
    const endpoints = [
      'http://localhost:9002/health',
      'http://localhost:9002/api/v1/health',
      'http://localhost:9002/status'
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(endpoint, { timeout: 2000 });
        if (response.status === 200) {
          lastCheckTime = now;
          isAXLAvailable = true;
          console.log('[AXL] ✅ P2P mesh node detected.');
          return true;
        }
      } catch {
        // Try next endpoint
      }
    }
    
    lastCheckTime = now;
    isAXLAvailable = false;
    return false;
  } catch {
    lastCheckTime = now;
    isAXLAvailable = false;
    return false;
  }
}

/**
 * Broadcasts checkpoint to peers if AXL node is available.
 * This is non-blocking and fails silently.
 */
export async function broadcastToPeers(message: object): Promise<void> {
  const available = await checkAXLHealth();
  if (!available) return;
  
  try {
    await axios.post('http://localhost:9002/broadcast', message, { timeout: 3000 });
    console.log(`[AXL] 📡 Broadcasted checkpoint to mesh.`);
  } catch (error: any) {
    // Silent fail - P2P is optional
    if (error.code !== 'ECONNREFUSED') {
      console.warn(`[AXL] ⚠️ Broadcast failed: ${error.message}`);
    }
  }
}

/**
 * Receives incoming messages from peers.
 * Returns empty array if AXL is unavailable.
 */
export async function receiveFromPeers(): Promise<any[]> {
  const available = await checkAXLHealth();
  if (!available) return [];
  
  try {
    const response = await axios.get('http://localhost:9002/recv', { timeout: 3000 });
    if (response.data && Array.isArray(response.data)) {
      return response.data.filter((msg: any) => msg.type === 'checkpoint');
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Returns current AXL status without making network calls.
 */
export function getAXLStatus(): { available: boolean } {
  return { available: isAXLAvailable };
}

/**
 * No-op for compatibility. User must start AXL separately.
 */
export async function startAXLNode(): Promise<void> {
  console.log('[AXL] P2P features available if AXL node is running (http://localhost:9002)');
  await checkAXLHealth();
}

/**
 * No-op cleanup.
 */
export async function stopAXLNode(): Promise<void> {
  // Nothing to clean up
}
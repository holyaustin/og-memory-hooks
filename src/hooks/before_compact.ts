// src/hooks/before_compact.ts
import { createAndUploadCheckpoint } from '../storage/checkpoint';
import { registerCheckpoint } from '../storage/registry';
import { broadcastToPeers } from '../integrations/gensyn';

export async function beforeCompactHandler(event: any) {
  console.log(`⚠️ Compaction imminent for session ${event.sessionId}. Saving checkpoint to 0G...`);
  
  try {
    // 1. Upload to 0G Storage
    const rootHash = await createAndUploadCheckpoint(event.sessionId);
    console.log(`📦 Checkpoint uploaded to 0G Storage. Root hash: ${rootHash}`);
    
    // 2. Register on 0G Chain (THIS IS THE ON-CHAIN PART)
    const txHash = await registerCheckpoint(event.sessionId, rootHash);
    console.log(`⛓️ Checkpoint registered on-chain. Tx: ${txHash}`);
    
    // 3. (Optional) Broadcast to P2P network via Gensyn AXL
    try {
      await broadcastToPeers({ 
        agentId: event.sessionId, 
        rootHash, 
        txHash,
        timestamp: Date.now()
      });
    } catch (broadcastError) {
      console.warn(`⚠️ P2P broadcast failed (non-critical): ${broadcastError.message}`);
    }
    
    console.log(`✅ Checkpoint complete! Agent can now be restored from 0G.`);
  } catch (error) {
    console.error(`❌ Checkpoint failed:`, error);
    // Don't block compaction even if checkpoint fails
  }
  
  return { proceed: true };
}
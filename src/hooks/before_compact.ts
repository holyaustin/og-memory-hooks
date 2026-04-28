// src/hooks/before_compact.ts
import { createAndUploadCheckpoint } from '../storage/checkpoint';
import { registerCheckpoint } from '../storage/registry'; // We'll build this next
import { broadcastToPeers } from '../integrations/gensyn';

export async function beforeCompactHandler(event: any) {
  console.log(`⚠️ Compaction imminent for session ${event.sessionId}. Saving checkpoint to 0G...`);
  try {
    const rootHash = await createAndUploadCheckpoint(event.sessionId);
    // Store the pointer on-chain (Phase 2)
    const tx = await registerCheckpoint(event.sessionId, rootHash);
    // Notify peers via Gensyn AXL (Phase 3)
    await broadcastToPeers({ agentId: event.sessionId, rootHash, tx });
    console.log(`✅ Checkpoint ${rootHash} saved on-chain. Tx: ${tx}`);
  } catch (error) {
    console.error(`❌ Checkpoint failed:`, error);
  }
  // Always return { proceed: true } to allow compaction to continue
  return { proceed: true };
}
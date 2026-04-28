// src/tools/memory_tools.ts
import { createAndUploadCheckpoint } from '../storage/checkpoint';
import { downloadCheckpoint } from '../storage/0g-client';
import { getLatestCheckpoint } from '../storage/registry';

export async function manualSaveCheckpoint(agentId: string): Promise<string> {
  console.log(`💾 Manual checkpoint for agent ${agentId}`);
  return await createAndUploadCheckpoint(agentId);
}

export async function manualRestoreCheckpoint(agentId: string): Promise<boolean> {
  const rootHash = await getLatestCheckpoint(agentId);
  if (!rootHash) {
    console.log(`No checkpoint found for agent ${agentId}`);
    return false;
  }
  
  const restorePath = `/tmp/restore_${agentId}_${Date.now()}`;
  await downloadCheckpoint(rootHash, restorePath);
  console.log(`✅ Restored checkpoint to ${restorePath}`);
  return true;
}
// src/storage/registry.ts
export async function registerCheckpoint(agentId: string, rootHash: string): Promise<string> {
  console.log(`📝 Registering checkpoint for agent ${agentId}: ${rootHash}`);
  // TODO: Implement after contract deployment
  return `mock_tx_hash_${Date.now()}`;
}

export async function getLatestCheckpoint(agentId: string): Promise<string | null> {
  console.log(`🔍 Looking up latest checkpoint for agent ${agentId}`);
  // TODO: Implement after contract deployment
  return null;
}
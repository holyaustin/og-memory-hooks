// test/test-checkpoint.ts
import * as dotenv from 'dotenv';
import { createAndUploadCheckpoint } from '../src/storage/checkpoint';
import { downloadCheckpoint } from '../src/storage/0g-client';
import { registerCheckpoint, getLatestCheckpoint } from '../src/storage/registry';

dotenv.config();

async function test() {
  console.log('🧪 Testing 0G-Memory-Hooks...');
  const testAgentId = 'test-agent-001';
  
  // Create checkpoint
  const rootHash = await createAndUploadCheckpoint(testAgentId);
  console.log(`✅ Created checkpoint: ${rootHash}`);
  
  // Register on chain
  const tx = await registerCheckpoint(testAgentId, rootHash);
  console.log(`✅ Registered on chain: ${tx}`);
  
  // Retrieve
  const retrieved = await getLatestCheckpoint(testAgentId);
  console.log(`✅ Retrieved from chain: ${retrieved}`);
  
  console.log('🎉 All tests passed!');
}

test().catch(console.error);
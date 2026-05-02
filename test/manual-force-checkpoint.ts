import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { uploadCheckpoint } from '../src/storage/0g-client';
import { registerCheckpoint, getLatestCheckpoint } from '../src/storage/registry';

async function forceSaveCheckpoint() {
  console.log('📤 Manually forcing checkpoint save to 0G...\n');
  
  // Correct path to MEMORY.md
  const memoryPath = path.join(os.homedir(), '.openclaw', 'workspace', 'MEMORY.md');
  const checkpointPath = '/tmp/force-checkpoint.txt';
  
  // Check if MEMORY.md exists
  if (!fs.existsSync(memoryPath)) {
    console.error(`❌ MEMORY.md not found at: ${memoryPath}`);
    console.log('Please run openclaw tui and create some conversation first.');
    process.exit(1);
  }
  
  // Read the current memory
  const memoryContent = fs.readFileSync(memoryPath, 'utf-8');
  console.log(`📋 Read MEMORY.md (${memoryContent.length} bytes)`);
  console.log(`   Content preview: ${memoryContent.substring(0, 100)}...\n`);
  
  // Create checkpoint file
  const checkpointData = JSON.stringify({
    timestamp: Date.now(),
    agentId: 'main',
    memory: memoryContent,
    workspace: fs.existsSync(path.join(os.homedir(), '.openclaw', 'workspace')) ? 'present' : 'missing'
  });
  
  fs.writeFileSync(checkpointPath, checkpointData);
  console.log(`📦 Created checkpoint file: ${checkpointPath}\n`);
  
  try {
    // Upload to 0G Storage
    console.log('⏳ Uploading to 0G Storage...');
    const rootHash = await uploadCheckpoint(checkpointPath);
    console.log(`✅ Uploaded to 0G Storage!`);
    console.log(`   Root Hash: ${rootHash}\n`);
    
    // Register on 0G Chain
    console.log('⏳ Registering on 0G Chain...');
    const txHash = await registerCheckpoint('main', rootHash);
    console.log(`✅ Registered on 0G Chain!`);
    console.log(`   Transaction: ${txHash}`);
    console.log(`   🔗 View: https://chainscan-galileo.0g.ai/tx/${txHash}\n`);
    
    // Verify it was saved
    const verified = await getLatestCheckpoint('main');
    if (verified === rootHash) {
      console.log('🎉 SUCCESS! Checkpoint verified on-chain!');
    } else if (verified) {
      console.log(`⚠️ Checkpoint saved but verification returned different hash.`);
      console.log(`   Expected: ${rootHash}`);
      console.log(`   Got: ${verified}`);
    } else {
      console.log(`❌ Verification failed - no checkpoint found for 'main'`);
    }
    
  } catch (error) {
    console.error('❌ Failed to save checkpoint:', error);
  } finally {
    // Cleanup
    if (fs.existsSync(checkpointPath)) {
      fs.unlinkSync(checkpointPath);
    }
  }
}

forceSaveCheckpoint();

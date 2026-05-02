import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { downloadCheckpoint } from '../src/storage/0g-client';
import { getLatestCheckpoint } from '../src/storage/registry';

async function forceRestoreCheckpoint() {
  console.log('📥 Manually restoring checkpoint from 0G...\n');
  
  const memoryPath = path.join(os.homedir(), '.openclaw', 'workspace', 'MEMORY.md');
  const restorePath = '/tmp/restored-checkpoint.json';
  
  // Backup current memory just in case
  if (fs.existsSync(memoryPath)) {
    const backupPath = `${memoryPath}.backup-${Date.now()}`;
    fs.copyFileSync(memoryPath, backupPath);
    console.log(`💾 Backed up current memory to: ${backupPath}`);
  }
  
  // Get latest checkpoint from chain
  console.log('🔍 Querying on-chain registry for agent "main"...');
  const rootHash = await getLatestCheckpoint('main');
  
  if (!rootHash) {
    console.error('❌ No checkpoint found for agent "main"');
    console.log('   Run manual-force-checkpoint.ts first to create a checkpoint.');
    process.exit(1);
  }
  
  console.log(`📍 Found checkpoint with root hash: ${rootHash}\n`);
  
  // Download from 0G Storage
  console.log('⏳ Downloading from 0G Storage...');
  await downloadCheckpoint(rootHash, restorePath);
  console.log(`✅ Downloaded checkpoint to: ${restorePath}\n`);
  
  // Parse checkpoint data
  const checkpointData = JSON.parse(fs.readFileSync(restorePath, 'utf-8'));
  
  // Restore memory
  fs.writeFileSync(memoryPath, checkpointData.memory);
  console.log(`✅ Restored MEMORY.md (${checkpointData.memory.length} bytes)`);
  console.log(`   Content preview: ${checkpointData.memory.substring(0, 200)}...\n`);
  
  // Verify restoration
  const verifiedMemory = fs.readFileSync(memoryPath, 'utf-8');
  if (verifiedMemory === checkpointData.memory) {
    console.log('🎉 RESTORATION SUCCESSFUL!');
    console.log(`   Timestamp: ${new Date(checkpointData.timestamp).toISOString()}`);
    console.log(`   Agent: ${checkpointData.agentId}`);
  } else {
    console.log('⚠️ Restoration may have issues - memory mismatch');
  }
  
  // Cleanup
  fs.unlinkSync(restorePath);
  
  console.log('\n📋 Next steps:');
  console.log('   1. Restart OpenClaw gateway: openclaw gateway restart');
  console.log('   2. Start TUI: openclaw tui');
  console.log('   3. Ask: "What do you remember from our previous conversation?"');
  console.log('   4. The agent should recall everything from before!');
}

// Run the restoration
forceRestoreCheckpoint().catch(console.error);

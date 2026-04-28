// src/hooks/after_restart.ts
import { downloadCheckpoint } from '../storage/0g-client';
import { getLatestCheckpoint } from '../storage/registry';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as archiver from 'archiver';

const MEMORY_FILE = path.join(os.homedir(), '.openclaw', 'MEMORY.md');
const LCM_DB = path.join(os.homedir(), '.openclaw', 'lcm.db');
const WORKSPACE_DIR = path.join(os.homedir(), '.openclaw', 'workspace');

export async function afterRestartHandler(event: any) {
  console.log(`🔄 Agent restart detected for session ${event.sessionId}. Checking for saved checkpoint...`);
  
  try {
    // 1. Query on-chain registry for latest checkpoint
    const rootHash = await getLatestCheckpoint(event.sessionId);
    
    if (!rootHash) {
      console.log(`ℹ️ No checkpoint found for agent ${event.sessionId}. Starting fresh.`);
      return { proceed: true };
    }
    
    console.log(`📦 Found checkpoint with root hash: ${rootHash}`);
    
    // 2. Download from 0G Storage
    const downloadPath = path.join('/tmp', `restore_${event.sessionId}_${Date.now()}.zip`);
    await downloadCheckpoint(rootHash, downloadPath);
    
    // 3. Extract and restore files
    await restoreCheckpoint(downloadPath);
    
    // 4. Clean up temp file
    fs.unlinkSync(downloadPath);
    
    console.log(`✅ Agent state restored from 0G checkpoint!`);
  } catch (error) {
    console.error(`❌ Failed to restore checkpoint:`, error);
    // Continue without restoration if something fails
  }
  
  return { proceed: true };
}

async function restoreCheckpoint(zipPath: string): Promise<void> {
  const extract = require('extract-zip');
  const tempExtractDir = path.join('/tmp', `restore_extract_${Date.now()}`);
  
  // Extract zip
  await extract(zipPath, { dir: tempExtractDir });
  
  // Restore MEMORY.md
  const extractedMemoryFile = path.join(tempExtractDir, 'MEMORY.md');
  if (fs.existsSync(extractedMemoryFile)) {
    fs.copyFileSync(extractedMemoryFile, MEMORY_FILE);
    console.log(`✅ Restored MEMORY.md`);
  }
  
  // Restore lcm.db
  const extractedLcmDb = path.join(tempExtractDir, 'lcm.db');
  if (fs.existsSync(extractedLcmDb)) {
    fs.copyFileSync(extractedLcmDb, LCM_DB);
    console.log(`✅ Restored lcm.db`);
  }
  
  // Restore workspace
  const extractedWorkspace = path.join(tempExtractDir, 'workspace');
  if (fs.existsSync(extractedWorkspace)) {
    fs.rmSync(WORKSPACE_DIR, { recursive: true, force: true });
    fs.cpSync(extractedWorkspace, WORKSPACE_DIR, { recursive: true });
    console.log(`✅ Restored workspace`);
  }
  
  // Clean up
  fs.rmSync(tempExtractDir, { recursive: true, force: true });
}
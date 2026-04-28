// src/storage/checkpoint.ts - Partially updated
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { createWriteStream } from 'fs';
import archiver from 'archiver';
import { uploadCheckpoint } from './0g-client';

const MEMORY_FILE = path.join(os.homedir(), '.openclaw', 'MEMORY.md');
const LCM_DB = path.join(os.homedir(), '.openclaw', 'lcm.db');
const WORKSPACE_DIR = path.join(os.homedir(), '.openclaw', 'workspace');

export async function createAndUploadCheckpoint(sessionId: string): Promise<string> {
  const timestamp = Date.now();
  const tempDir = path.join('/tmp', `checkpoint_${sessionId}_${timestamp}`);
  const zipPath = `${tempDir}.zip`;

  try {
    // Create temporary directory
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Copy files if they exist
    if (fs.existsSync(MEMORY_FILE)) {
      fs.copyFileSync(MEMORY_FILE, path.join(tempDir, 'MEMORY.md'));
    }
    if (fs.existsSync(LCM_DB)) {
      fs.copyFileSync(LCM_DB, path.join(tempDir, 'lcm.db'));
    }
    if (fs.existsSync(WORKSPACE_DIR)) {
      fs.cpSync(WORKSPACE_DIR, path.join(tempDir, 'workspace'), { recursive: true });
    }

    // Create zip file
    const output = createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    await new Promise<void>((resolve, reject) => {
      output.on('close', resolve);
      archive.on('error', reject);
      archive.pipe(output);
      archive.directory(tempDir, false);
      archive.finalize();
    });

    // Upload to 0G Storage
    const rootHash = await uploadCheckpoint(zipPath);

    // Clean up
    fs.rmSync(tempDir, { recursive: true, force: true });
    fs.unlinkSync(zipPath);

    return rootHash;
  } catch (error) {
    console.error('Checkpoint creation failed:', error);
    throw error;
  }
}
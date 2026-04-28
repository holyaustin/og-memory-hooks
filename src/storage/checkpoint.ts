// src/storage/checkpoint.ts
import * as fs from 'fs/promises';
import * as path from 'path';
import * as archiver from 'archiver'; // npm install archiver
import { uploadCheckpoint } from './0g-client';

// Define the path to OpenClaw's memory and workspace
// ${os.homedir()}/.openclaw/
const MEMORY_FILE = path.join(process.env.HOME, '.openclaw', 'MEMORY.md');
const LCM_DB = path.join(process.env.HOME, '.openclaw', 'lcm.db');
const WORKSPACE_DIR = path.join(process.env.HOME, '.openclaw', 'workspace');

export async function createAndUploadCheckpoint(sessionId: string): Promise<string> {
  const timestamp = Date.now();
  const checkpointDir = path.join('/tmp', `checkpoint_${sessionId}_${timestamp}`);
  const zipPath = `${checkpointDir}.zip`;

  // 1. Create a temporary directory and copy files
  await fs.mkdir(checkpointDir, { recursive: true });
  await fs.copyFile(MEMORY_FILE, path.join(checkpointDir, 'MEMORY.md'));
  await fs.copyFile(LCM_DB, path.join(checkpointDir, 'lcm.db'));
  await fs.cp(WORKSPACE_DIR, path.join(checkpointDir, 'workspace'), { recursive: true });

  // 2. Zip the directory
  const output = await fs.createWriteStream(zipPath);
  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.pipe(output);
  archive.directory(checkpointDir, false);
  await archive.finalize();

  // 3. Upload to 0G Storage
  const rootHash = await uploadCheckpoint(zipPath);

  // 4. Clean up temp files
  await fs.rm(checkpointDir, { recursive: true, force: true });
  await fs.unlink(zipPath);

  return rootHash;
}
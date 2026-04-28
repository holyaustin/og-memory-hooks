// src/storage/0g-client.ts
import { ZgFile, Indexer } from '@0gfoundation/0g-ts-sdk';
import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

// Validate environment variables
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const EVMRPC_URL = process.env.EVMRPC_URL;
const INDEXER_RPC = process.env.INDEXER_RPC;

if (!PRIVATE_KEY) throw new Error('Missing PRIVATE_KEY in .env');
if (!EVMRPC_URL) throw new Error('Missing EVMRPC_URL in .env');
if (!INDEXER_RPC) throw new Error('Missing INDEXER_RPC in .env');

const provider = new ethers.JsonRpcProvider(EVMRPC_URL);
const signer = new ethers.Wallet(PRIVATE_KEY, provider);
const indexer = new Indexer(INDEXER_RPC);

export async function uploadCheckpoint(filePath: string): Promise<string> {
  // Verify file exists
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const file = await ZgFile.fromFilePath(filePath);
  await file.merkleTree();

  const [tx, err] = await indexer.upload(file, EVMRPC_URL, signer);
  if (err) throw new Error(`Upload failed: ${err}`);

  const rootHash = file.rootHash();
  console.log(`✅ Checkpoint uploaded! Root hash: ${rootHash}, Tx: ${tx}`);
  return rootHash;
}

export async function downloadCheckpoint(rootHash: string, outputPath: string): Promise<void> {
  const file = await ZgFile.fromRootHash(rootHash);
  const [err] = await indexer.download(file, outputPath, EVMRPC_URL);
  if (err) throw new Error(`Download failed: ${err}`);
  console.log(`✅ Checkpoint downloaded to ${outputPath}`);
}
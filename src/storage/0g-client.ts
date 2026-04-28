// src/storage/0g-client.ts
import { ZgFile, Indexer } from '@0gfoundation/0g-ts-sdk';
import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

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
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  // Create ZgFile instance
  const file = await ZgFile.fromFilePath(filePath);
  
  try {
    // Must call merkleTree() before upload - populates internal state
    const [tree, treeErr] = await file.merkleTree();
    if (treeErr !== null) throw new Error(`Merkle tree error: ${treeErr}`);
    
    console.log("📦 Root Hash:", tree?.rootHash());

    // Upload the file
    const [tx, uploadErr] = await indexer.upload(file, EVMRPC_URL, signer);
    if (uploadErr !== null) throw new Error(`Upload error: ${uploadErr}`);

    // Handle response (supports both single and fragmented files)
    let rootHash: string;
    if ('rootHash' in tx) {
      rootHash = tx.rootHash;
      console.log(`✅ Checkpoint uploaded! Tx: ${tx.txHash}`);
    } else {
      rootHash = tx.rootHashes[0]; // For fragmented uploads, use first root
      console.log(`✅ Checkpoint uploaded (fragmented)! Tx: ${tx.txHashes[0]}`);
    }
    
    return rootHash;
  } finally {
    await file.close(); // Always close when done
  }
}

export async function downloadCheckpoint(rootHash: string, outputPath: string): Promise<void> {
  // Download with proof verification enabled (true)
  const err = await indexer.download(rootHash, outputPath, true);
  if (err !== null) throw new Error(`Download error: ${err}`);
  console.log(`✅ Checkpoint downloaded to ${outputPath}`);
}

// Optional: For in-memory data (if you don't want to write temporary files)
export async function uploadMemoryCheckpoint(data: Buffer): Promise<string> {
  const { MemData } = await import('@0gfoundation/0g-ts-sdk');
  const memData = new MemData(data);
  
  const [tree, treeErr] = await memData.merkleTree();
  if (treeErr !== null) throw new Error(`Merkle tree error: ${treeErr}`);
  
  const [tx, uploadErr] = await indexer.upload(memData, EVMRPC_URL, signer);
  if (uploadErr !== null) throw new Error(`Upload error: ${uploadErr}`);
  
  const rootHash = 'rootHash' in tx ? tx.rootHash : tx.rootHashes[0];
  return rootHash;
}
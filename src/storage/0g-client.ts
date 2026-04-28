// src/storage/0g-client.ts
import { ZgFile, Indexer, getFlowContract } from '@0gfoundation/0g-ts-sdk';
import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
dotenv.config();

const provider = new ethers.JsonRpcProvider(process.env.EVMRPC_URL);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const indexer = new Indexer(process.env.INDEXER_RPC); // e.g., https://indexer-storage-testnet.0g.ai

export async function uploadCheckpoint(filePath: string): Promise<string> {
  const file = await ZgFile.fromFilePath(filePath);
  await file.merkleTree(); // Generate Merkle tree for the file
  const [tx, err] = await indexer.upload(file, process.env.EVMRPC_URL, signer);
  if (err) throw new Error(`Upload failed: ${err}`);
  console.log(`✅ Checkpoint uploaded! Root hash: ${file.rootHash()}, Tx: ${tx}`);
  return file.rootHash(); // This hash is the key to later download the file
}

export async function downloadCheckpoint(rootHash: string, outputPath: string): Promise<void> {
  const file = await ZgFile.fromRootHash(rootHash);
  const [err] = await indexer.download(file, outputPath, process.env.EVMRPC_URL);
  if (err) throw new Error(`Download failed: ${err}`);
  console.log(`✅ Checkpoint downloaded to ${outputPath}`);
}
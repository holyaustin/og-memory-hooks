"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadCheckpoint = uploadCheckpoint;
exports.downloadCheckpoint = downloadCheckpoint;
exports.uploadMemoryCheckpoint = uploadMemoryCheckpoint;
// src/storage/0g-client.ts
const _0g_ts_sdk_1 = require("@0gfoundation/0g-ts-sdk");
const ethers_1 = require("ethers");
const dotenv = __importStar(require("dotenv"));
const fs = __importStar(require("fs"));
dotenv.config();
// Validate environment variables
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const EVMRPC_URL = process.env.EVMRPC_URL;
const INDEXER_RPC = process.env.INDEXER_RPC;
if (!PRIVATE_KEY)
    throw new Error('Missing PRIVATE_KEY in .env');
if (!EVMRPC_URL)
    throw new Error('Missing EVMRPC_URL in .env');
if (!INDEXER_RPC)
    throw new Error('Missing INDEXER_RPC in .env');
const provider = new ethers_1.ethers.JsonRpcProvider(EVMRPC_URL);
const signer = new ethers_1.ethers.Wallet(PRIVATE_KEY, provider);
const indexer = new _0g_ts_sdk_1.Indexer(INDEXER_RPC);
async function uploadCheckpoint(filePath) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
    }
    // Create ZgFile instance
    const file = await _0g_ts_sdk_1.ZgFile.fromFilePath(filePath);
    try {
        // Must call merkleTree() before upload - populates internal state
        const [tree, treeErr] = await file.merkleTree();
        if (treeErr !== null)
            throw new Error(`Merkle tree error: ${treeErr}`);
        console.log("📦 Root Hash:", tree?.rootHash());
        // Upload the file
        const [tx, uploadErr] = await indexer.upload(file, EVMRPC_URL, signer);
        if (uploadErr !== null)
            throw new Error(`Upload error: ${uploadErr}`);
        // Handle response (supports both single and fragmented files)
        let rootHash;
        if ('rootHash' in tx) {
            rootHash = tx.rootHash;
            console.log(`✅ Checkpoint uploaded! Tx: ${tx.txHash}`);
        }
        else {
            rootHash = tx.rootHashes[0]; // For fragmented uploads, use first root
            console.log(`✅ Checkpoint uploaded (fragmented)! Tx: ${tx.txHashes[0]}`);
        }
        return rootHash;
    }
    finally {
        await file.close(); // Always close when done
    }
}
async function downloadCheckpoint(rootHash, outputPath) {
    // Download with proof verification enabled (true)
    const err = await indexer.download(rootHash, outputPath, true);
    if (err !== null)
        throw new Error(`Download error: ${err}`);
    console.log(`✅ Checkpoint downloaded to ${outputPath}`);
}
// Optional: For in-memory data (if you don't want to write temporary files)
async function uploadMemoryCheckpoint(data) {
    const { MemData } = await import('@0gfoundation/0g-ts-sdk');
    const memData = new MemData(data);
    const [tree, treeErr] = await memData.merkleTree();
    if (treeErr !== null)
        throw new Error(`Merkle tree error: ${treeErr}`);
    const [tx, uploadErr] = await indexer.upload(memData, EVMRPC_URL, signer);
    if (uploadErr !== null)
        throw new Error(`Upload error: ${uploadErr}`);
    const rootHash = 'rootHash' in tx ? tx.rootHash : tx.rootHashes[0];
    return rootHash;
}

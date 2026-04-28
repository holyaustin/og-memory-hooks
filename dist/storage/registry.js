"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCheckpoint = registerCheckpoint;
exports.getLatestCheckpoint = getLatestCheckpoint;
// src/storage/registry.ts
async function registerCheckpoint(agentId, rootHash) {
    console.log(`📝 Registering checkpoint for agent ${agentId}: ${rootHash}`);
    // TODO: Implement after contract deployment
    return `mock_tx_hash_${Date.now()}`;
}
async function getLatestCheckpoint(agentId) {
    console.log(`🔍 Looking up latest checkpoint for agent ${agentId}`);
    // TODO: Implement after contract deployment
    return null;
}

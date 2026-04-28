"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.manualSaveCheckpoint = manualSaveCheckpoint;
exports.manualRestoreCheckpoint = manualRestoreCheckpoint;
// src/tools/memory_tools.ts
const checkpoint_1 = require("../storage/checkpoint");
const _0g_client_1 = require("../storage/0g-client");
const registry_1 = require("../storage/registry");
async function manualSaveCheckpoint(agentId) {
    console.log(`💾 Manual checkpoint for agent ${agentId}`);
    return await (0, checkpoint_1.createAndUploadCheckpoint)(agentId);
}
async function manualRestoreCheckpoint(agentId) {
    const rootHash = await (0, registry_1.getLatestCheckpoint)(agentId);
    if (!rootHash) {
        console.log(`No checkpoint found for agent ${agentId}`);
        return false;
    }
    const restorePath = `/tmp/restore_${agentId}_${Date.now()}`;
    await (0, _0g_client_1.downloadCheckpoint)(rootHash, restorePath);
    console.log(`✅ Restored checkpoint to ${restorePath}`);
    return true;
}

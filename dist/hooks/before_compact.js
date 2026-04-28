"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.beforeCompactHandler = beforeCompactHandler;
// src/hooks/before_compact.ts
const checkpoint_1 = require("../storage/checkpoint");
const registry_1 = require("../storage/registry"); // We'll build this next
const gensyn_1 = require("../integrations/gensyn");
async function beforeCompactHandler(event) {
    console.log(`⚠️ Compaction imminent for session ${event.sessionId}. Saving checkpoint to 0G...`);
    try {
        const rootHash = await (0, checkpoint_1.createAndUploadCheckpoint)(event.sessionId);
        // Store the pointer on-chain (Phase 2)
        const tx = await (0, registry_1.registerCheckpoint)(event.sessionId, rootHash);
        // Notify peers via Gensyn AXL (Phase 3)
        await (0, gensyn_1.broadcastToPeers)({ agentId: event.sessionId, rootHash, tx });
        console.log(`✅ Checkpoint ${rootHash} saved on-chain. Tx: ${tx}`);
    }
    catch (error) {
        console.error(`❌ Checkpoint failed:`, error);
    }
    // Always return { proceed: true } to allow compaction to continue
    return { proceed: true };
}

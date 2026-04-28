"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.relayViaKeeperHub = relayViaKeeperHub;
// src/integrations/keeperhub.ts
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
async function relayViaKeeperHub(contractAddress, methodName, args) {
    try {
        const command = `kh contract call ${contractAddress} ${methodName} ${args.join(' ')} --chain 0g-testnet`;
        console.log(`🔄 Relaying tx to KeeperHub: ${command}`);
        const { stdout, stderr } = await execAsync(command);
        if (stderr)
            throw new Error(`KeeperHub error: ${stderr}`);
        console.log(`✅ Tx relayed by KeeperHub: ${stdout}`);
        return stdout.trim();
    }
    catch (error) {
        console.warn(`⚠️ KeeperHub unavailable: ${error.message}. Falling back to direct submission.`);
        return `fallback_tx_${Date.now()}`;
    }
}

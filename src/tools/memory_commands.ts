// src/tools/memory_commands.ts
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { uploadCheckpoint } from '../storage/0g-client.js';
import { downloadCheckpoint } from '../storage/0g-client.js';
import { registerCheckpoint, getLatestCheckpoint } from '../storage/registry.js';
import { ethers } from 'ethers';

const MEMORY_PATH = path.join(os.homedir(), '.openclaw', 'workspace', 'MEMORY.md');

export async function uploadTo0G(api: any, agentId: string): Promise<any> {
  try {
    // Check if memory file exists
    if (!fs.existsSync(MEMORY_PATH)) {
      return {
        content: [{
          type: 'text',
          text: `❌ No memory file found at ${MEMORY_PATH}\n\nHave you started a conversation with the agent yet?`
        }]
      };
    }
    
    // Read current memory
    const memoryContent = fs.readFileSync(MEMORY_PATH, 'utf-8');
    const memorySize = memoryContent.length;
    
    await api.sendProgress?.(`📤 Uploading ${memorySize} bytes of memory to 0G...`);
    
    // Create checkpoint file
    const checkpointPath = `/tmp/0g-checkpoint-${Date.now()}.json`;
    const checkpointData = JSON.stringify({
      timestamp: Date.now(),
      agentId: agentId,
      memory: memoryContent,
      version: '1.0'
    });
    fs.writeFileSync(checkpointPath, checkpointData);
    
    // Upload to 0G Storage
    const rootHash = await uploadCheckpoint(checkpointPath);
    
    // Register on-chain
    const txHash = await registerCheckpoint(agentId, rootHash);
    
    // Cleanup
    fs.unlinkSync(checkpointPath);
    
    return {
      content: [{
        type: 'text',
        text: `
✅ **Memory Saved to 0G Blockchain!**

📦 **File Details:**
   • Agent ID: \`${agentId}\`
   • Memory Size: ${memorySize} bytes
   • Root Hash: \`${rootHash.substring(0, 20)}...\`

⛓️ **On-Chain Registration:**
   • Transaction: \`${txHash.substring(0, 20)}...\`
   • View: https://chainscan-galileo.0g.ai/tx/${txHash}

📊 **View File:**
   • https://storagescan-galileo.0g.ai/file/${rootHash}

💡 **Tip:** Your memory is now permanently stored on 0G's decentralized network!
        `
      }]
    };
  } catch (error: any) {
    return {
      content: [{
        type: 'text',
        text: `❌ **Upload Failed**\n\nError: ${error.message}\n\nPlease check your 0G credentials and try again.`
      }]
    };
  }
}

export async function downloadFrom0G(api: any, agentId: string): Promise<any> {
  try {
    await api.sendProgress?.(`🔍 Looking for latest checkpoint for agent "${agentId}"...`);
    
    // Get latest checkpoint from chain
    const rootHash = await getLatestCheckpoint(agentId);
    
    if (!rootHash) {
      return {
        content: [{
          type: 'text',
          text: `❌ **No Checkpoint Found**\n\nAgent "${agentId}" has no saved checkpoint on 0G.\n\nUse \`/0g:upload\` to save your current memory first.`
        }]
      };
    }
    
    await api.sendProgress?.(`📥 Downloading checkpoint ${rootHash.substring(0, 20)}... from 0G Storage`);
    
    // Backup current memory
    if (fs.existsSync(MEMORY_PATH)) {
      const backupPath = `${MEMORY_PATH}.backup-${Date.now()}`;
      fs.copyFileSync(MEMORY_PATH, backupPath);
      await api.sendProgress?.(`💾 Backed up current memory to: ${path.basename(backupPath)}`);
    }
    
    // Download checkpoint
    const downloadPath = `/tmp/0g-restore-${Date.now()}.json`;
    await downloadCheckpoint(rootHash, downloadPath);
    
    // Parse and restore
    const checkpointData = JSON.parse(fs.readFileSync(downloadPath, 'utf-8'));
    fs.writeFileSync(MEMORY_PATH, checkpointData.memory);
    
    // Cleanup
    fs.unlinkSync(downloadPath);
    
    return {
      content: [{
        type: 'text',
        text: `
✅ **Memory Restored Successfully!**

📥 **Restoration Details:**
   • Agent ID: \`${checkpointData.agentId}\`
   • Memory Size: ${checkpointData.memory.length} bytes
   • Snapshot Date: ${new Date(checkpointData.timestamp).toISOString()}

🔍 **What Was Restored:**
   \`\`\`
   ${checkpointData.memory.substring(0, 300)}${checkpointData.memory.length > 300 ? '...' : ''}
   \`\`\`

💡 **Next Steps:**
   • Restart gateway: \`openclaw gateway restart\`
   • Ask: "What do you remember from before?"
   • The agent will recall everything from the checkpoint!

🔗 **Verify on-chain:**
   • https://chainscan-galileo.0g.ai/address/0xFB69D0fb9C892F3565D66bcA92360Ca19B8D9780
        `
      }]
    };
  } catch (error: any) {
    return {
      content: [{
        type: 'text',
        text: `❌ **Restore Failed**\n\nError: ${error.message}\n\nPlease check your 0G credentials and try again.`
      }]
    };
  }
}

export async function getCheckpointStatus(api: any, agentId: string): Promise<any> {
  try {
    const rootHash = await getLatestCheckpoint(agentId);
    
    if (!rootHash) {
      return {
        content: [{
          type: 'text',
          text: `
🔍 **Checkpoint Status for Agent "${agentId}"**

❌ No checkpoint found on-chain.

💡 **Actions:**
   • Save current memory: \`/0g:upload ${agentId}\`
   • The agent will auto-save before context compaction
        `
        }]
      };
    }
    
    // Get block info for the transaction (optional)
    const provider = new ethers.JsonRpcProvider('https://evmrpc-testnet.0g.ai');
    const latestBlock = await provider.getBlockNumber();
    
    return {
      content: [{
        type: 'text',
        text: `
✅ **Checkpoint Status for Agent "${agentId}"**

📦 **Latest Checkpoint:**
   • Root Hash: \`${rootHash.substring(0, 30)}...\`
   • Status: \`STORED ON-CHAIN\`
   • Network: 0G Galileo Testnet

🔗 **View on 0G Explorer:**
   • File: https://storagescan-galileo.0g.ai/file/${rootHash}
   • Contract: https://chainscan-galileo.0g.ai/address/0xFB69D0fb9C892F3565D66bcA92360Ca19B8D9780

📊 **Network Status:**
   • Latest Block: ${latestBlock}
   • Your data is decentralized and permanent!

💡 **Commands:**
   • Download: \`/0g:download ${agentId}\`
   • Upload new: \`/0g:upload ${agentId}\`
        `
      }]
    };
  } catch (error: any) {
    return {
      content: [{
        type: 'text',
        text: `❌ **Status Check Failed**\n\nError: ${error.message}`
      }]
    };
  }
}

export async function getCheckpointHistory(api: any, agentId: string): Promise<any> {
  // This would require querying historical events from the contract
  // For now, provide a simplified version
  return {
    content: [{
      type: 'text',
      text: `
📜 **Checkpoint History for Agent "${agentId}"**

ℹ️ To view full history, visit:
   https://chainscan-galileo.0g.ai/address/0xFB69D0fb9C892F3565D66bcA92360Ca19B8D9780?tab=events

Filter by agentId: "${agentId}"

💡 **Pro Tip:** Every time you upload or auto-save, a new event is created on-chain!
      `
    }]
  };
}
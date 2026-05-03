// src/index.ts
import { Type } from '@sinclair/typebox';
import { beforeCompactHandler } from './hooks/before_compact.js';
import { afterRestartHandler } from './hooks/after_restart.js';
import { heartbeatHandler } from './hooks/heartbeat.js';
import { uploadTo0G, downloadFrom0G, getCheckpointStatus } from './tools/memory_tools.js';
import { startAXLNode, stopAXLNode, receiveFromPeers } from './integrations/gensyn.js';
import { initKeeperHub, isKeeperHubAvailable } from './integrations/keeperhub.js';
import { getLatestCheckpoint } from './storage/registry.js';

let axlStarted = false;

export default {
  id: '0g-memory-hooks',
  name: '0G Memory Hooks',
  description: 'Auto-persist agent memory to 0G Storage before compaction.',
  version: '0.1.0',
  register(api: any) {
    // Initialize KeeperHub with API key from env (passed explicitly)
    const keeperhubApiKey = process.env.KEEPERHUB_API_KEY;
    if (keeperhubApiKey) {
      initKeeperHub(keeperhubApiKey).catch(console.warn);
    } else {
      console.log('[KeeperHub] No API key found. Direct transaction mode only.');
    }
    
    // Register lifecycle hooks
    api.on('before_compact', beforeCompactHandler, { priority: 90 });
    api.on('after_restart', afterRestartHandler, { priority: 10 });
    
    // Enhanced heartbeat with P2P peer message checking
    api.on('heartbeat', async () => {
      await heartbeatHandler({});
      
      if (axlStarted) {
        const peerMessages = await receiveFromPeers();
        for (const msg of peerMessages) {
          if (msg.type === 'checkpoint' && msg.agentId && msg.rootHash) {
            console.log(`[P2P] Peer checkpoint received for agent ${msg.agentId}`);
            const ourLatest = await getLatestCheckpoint(msg.agentId);
            if (!ourLatest || ourLatest !== msg.rootHash) {
              console.log(`[P2P] New checkpoint available! Use restore_memory_from_0g tool to sync.`);
            }
          }
        }
      }
    });
    
    // Register tools
    api.registerTool({
      name: 'upload_memory_to_0g',
      description: 'Upload the current agent memory to 0G decentralized storage and register it on-chain.',
      parameters: Type.Optional(Type.Object({
        agentId: Type.Optional(Type.String({ description: 'Optional agent ID (defaults to "main")' }))
      })),
      async execute(_id: string, params: { agentId?: string }) {
        const agentId = params?.agentId || 'main';
        return await uploadTo0G(agentId);
      }
    });
    
    api.registerTool({
      name: 'restore_memory_from_0g',
      description: 'Restore agent memory from the latest checkpoint stored on 0G blockchain.',
      parameters: Type.Optional(Type.Object({
        agentId: Type.Optional(Type.String({ description: 'Optional agent ID (defaults to "main")' }))
      })),
      async execute(_id: string, params: { agentId?: string }) {
        const agentId = params?.agentId || 'main';
        return await downloadFrom0G(agentId);
      }
    });
    
    api.registerTool({
      name: 'check_0g_memory_status',
      description: 'Check if agent memory is stored on the 0G blockchain.',
      parameters: Type.Optional(Type.Object({
        agentId: Type.Optional(Type.String({ description: 'Optional agent ID (defaults to "main")' }))
      })),
      async execute(_id: string, params: { agentId?: string }) {
        const agentId = params?.agentId || 'main';
        return await getCheckpointStatus(agentId);
      }
    });
    
    // Start AXL (checks for existing node, doesn't spawn)
    startAXLNode()
      .then(() => {
        axlStarted = true;
      })
      .catch((err) => {
        console.warn('[AXL] Init failed:', err?.message);
      });
    
    console.log('✅ 0G-Memory-Hooks plugin registered.');
  }
};
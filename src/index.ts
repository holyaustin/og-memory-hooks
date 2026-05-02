// src/index.ts
import { Type } from '@sinclair/typebox';
import { beforeCompactHandler } from './hooks/before_compact.js';
import { afterRestartHandler } from './hooks/after_restart.js';
import { heartbeatHandler } from './hooks/heartbeat.js';
import { uploadTo0G, downloadFrom0G, getCheckpointStatus } from './tools/memory_tools.js';

export default {
  id: '0g-memory-hooks',
  name: '0G Memory Hooks',
  description: 'Auto-persist agent memory to 0G Storage before compaction.',
  version: '0.1.0',
  register(api: any) {  // Use 'any' type to bypass TypeScript restrictions
    // Register lifecycle hooks
    api.on('before_compact', beforeCompactHandler, { priority: 90 });
    api.on('after_restart', afterRestartHandler, { priority: 10 });
    api.on('heartbeat', heartbeatHandler);
    
    // Register tools using type assertion
    // According to OpenClaw docs, api.registerTool expects a tool object [citation:2][citation:6]
    api.registerTool({
      name: 'upload_memory_to_0g',
      description: 'Upload the current agent memory to 0G decentralized storage and register it on-chain. This creates a permanent, verifiable checkpoint.',
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
      description: 'Restore agent memory from the latest checkpoint stored on 0G blockchain. This recovers all previous conversation context.',
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
      description: 'Check if agent memory is stored on the 0G blockchain and verify the latest checkpoint.',
      parameters: Type.Optional(Type.Object({
        agentId: Type.Optional(Type.String({ description: 'Optional agent ID (defaults to "main")' }))
      })),
      async execute(_id: string, params: { agentId?: string }) {
        const agentId = params?.agentId || 'main';
        return await getCheckpointStatus(agentId);
      }
    });
    
    console.log('✅ 0G-Memory-Hooks plugin registered with 3 tools.');
  }
};
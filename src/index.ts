// src/index.ts
import type { Plugin, PluginAPI } from '@openclaw/plugin-sdk';

// Import handlers - create these files as empty exports first
import { beforeCompactHandler } from './hooks/before_compact';
import { afterRestartHandler } from './hooks/after_restart';
import { heartbeatHandler } from './hooks/heartbeat';

const plugin: Plugin = {
  name: '0g-memory-hooks',
  version: '0.1.0',
  register: (api: PluginAPI) => {
    api.on('before_compact', beforeCompactHandler, { priority: 90 });
    api.on('after_restart', afterRestartHandler, { priority: 10 });
    api.on('heartbeat', heartbeatHandler, { interval: 300 });
    console.log('✅ 0G-Memory-Hooks plugin registered.');
  }
};

export default plugin;
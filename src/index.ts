// src/index.ts - CORRECTED
import type { Plugin, PluginAPI } from '@openclaw/plugin-sdk';
import { beforeCompactHandler } from './hooks/before_compact';
import { afterRestartHandler } from './hooks/after_restart';
import { heartbeatHandler } from './hooks/heartbeat';

const plugin: Plugin = {
  name: '0g-memory-hooks',
  version: '0.1.0',
  register: (api: PluginAPI) => {
    // Hook into lifecycle events
    api.on('before_compact', beforeCompactHandler, { priority: 90 });
    api.on('after_restart', afterRestartHandler, { priority: 10 });
    
    // Heartbeat - interval is configured in openclaw.json, not here
    // The plugin simply registers which function to call when heartbeat runs
    api.on('heartbeat', heartbeatHandler);
    
    console.log('✅ 0G-Memory-Hooks plugin registered.');
  }
};

export default plugin;
// src/index.ts
import { Plugin } from '@openclaw/plugin-sdk';
import { beforeCompactHandler } from './hooks/before_compact';
import { afterRestartHandler } from './hooks/after_restart';

const plugin: Plugin = {
  name: '0g-memory-hooks',
  version: '0.1.0',
  register: (api) => {
    api.on('before_compact', beforeCompactHandler);
    api.on('after_restart', afterRestartHandler);
    console.log('✅ 0G-Memory-Hooks plugin registered.');
  }
};
export default plugin;
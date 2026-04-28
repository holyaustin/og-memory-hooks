"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const before_compact_1 = require("./hooks/before_compact");
const after_restart_1 = require("./hooks/after_restart");
const heartbeat_1 = require("./hooks/heartbeat");
const plugin = {
    name: '0g-memory-hooks',
    version: '0.1.0',
    register: (api) => {
        // Hook into lifecycle events
        api.on('before_compact', before_compact_1.beforeCompactHandler, { priority: 90 });
        api.on('after_restart', after_restart_1.afterRestartHandler, { priority: 10 });
        // Heartbeat - interval is configured in openclaw.json, not here
        // The plugin simply registers which function to call when heartbeat runs
        api.on('heartbeat', heartbeat_1.heartbeatHandler);
        console.log('✅ 0G-Memory-Hooks plugin registered.');
    }
};
exports.default = plugin;

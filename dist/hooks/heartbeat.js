"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.heartbeatHandler = heartbeatHandler;
// src/hooks/heartbeat.ts
function heartbeatHandler(event) {
    console.log('💓 heartbeat triggered', event);
    return { proceed: true };
}

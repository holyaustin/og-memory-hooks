"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.afterRestartHandler = afterRestartHandler;
// src/hooks/after_restart.ts
function afterRestartHandler(event) {
    console.log('✅ after_restart hook triggered', event);
    return { proceed: true };
}

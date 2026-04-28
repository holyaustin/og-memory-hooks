"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAndUploadCheckpoint = createAndUploadCheckpoint;
// src/storage/checkpoint.ts - Partially updated
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const fs_1 = require("fs");
const archiver_1 = __importDefault(require("archiver"));
const _0g_client_1 = require("./0g-client");
const MEMORY_FILE = path.join(os.homedir(), '.openclaw', 'MEMORY.md');
const LCM_DB = path.join(os.homedir(), '.openclaw', 'lcm.db');
const WORKSPACE_DIR = path.join(os.homedir(), '.openclaw', 'workspace');
async function createAndUploadCheckpoint(sessionId) {
    const timestamp = Date.now();
    const tempDir = path.join('/tmp', `checkpoint_${sessionId}_${timestamp}`);
    const zipPath = `${tempDir}.zip`;
    try {
        // Create temporary directory
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        // Copy files if they exist
        if (fs.existsSync(MEMORY_FILE)) {
            fs.copyFileSync(MEMORY_FILE, path.join(tempDir, 'MEMORY.md'));
        }
        if (fs.existsSync(LCM_DB)) {
            fs.copyFileSync(LCM_DB, path.join(tempDir, 'lcm.db'));
        }
        if (fs.existsSync(WORKSPACE_DIR)) {
            fs.cpSync(WORKSPACE_DIR, path.join(tempDir, 'workspace'), { recursive: true });
        }
        // Create zip file
        const output = (0, fs_1.createWriteStream)(zipPath);
        const archive = (0, archiver_1.default)('zip', { zlib: { level: 9 } });
        await new Promise((resolve, reject) => {
            output.on('close', resolve);
            archive.on('error', reject);
            archive.pipe(output);
            archive.directory(tempDir, false);
            archive.finalize();
        });
        // Upload to 0G Storage
        const rootHash = await (0, _0g_client_1.uploadCheckpoint)(zipPath);
        // Clean up
        fs.rmSync(tempDir, { recursive: true, force: true });
        fs.unlinkSync(zipPath);
        return rootHash;
    }
    catch (error) {
        console.error('Checkpoint creation failed:', error);
        throw error;
    }
}

# 🧠 0G-Memory-Hooks

[![OpenClaw Plugin](https://img.shields.io/badge/OpenClaw-Plugin-blue)](https://openclaw.ai)
[![0G Network](https://img.shields.io/badge/0G-Network-orange)](https://0g.ai)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)

> **Fixing the "agent amnesia" bug. Auto-persist agent memory to 0G Storage. Never lose context again.**

## 📖 Description
0G-Memory-Hooks is a plugin for OpenClaw that solves the "agent amnesia" problem by automatically persisting agent memory to 0G Storage before every compaction event, and seamlessly restoring it upon restart.

The plugin hooks into OpenClaw's lifecycle events, captures the agent's state (conversation context, memory files, workspace data), uploads it to 0G's decentralized storage network, and records a pointer on 0G Chain. When the agent restarts—whether after a crash, compaction, or manual reboot—it automatically locates and restores the most recent checkpoint, resuming work exactly where it left off.

Key Differentiators:

- Automatic operation — No user intervention required
- Decentralized storage — No reliance on centralized cloud providers
- Survives compaction — Checkpoints are taken before OpenClaw's built-in compaction runs
- Multi-device sync — Same agent can resume on a different machine
- Three sponsor integrations — 0G (primary) + KeeperHub (execution reliability) + Gensyn (P2P notifications)

## 📖 Table of Contents

- [Problem Statement](#problem-statement)
- [Solution](#solution)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [TUI Commands](#tui-commands)
- [Sponsor Integrations](#sponsor-integrations)
- [Smart Contract](#smart-contract)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Demo Video](#demo-video)
- [Team](#team)
- [License](#license)

---

## 🚨 Problem Statement

### The Silent Context Apocalypse

Meet Sarah, a developer using OpenClaw to build a full-stack application. Over two days, her agent helped her:

- Design a PostgreSQL schema with 12 tables
- Write authentication middleware for JWT tokens
- Build API routes for user management
- Configure deployment scripts for AWS
- Document the entire codebase

**30 hours of collaborative work.** The agent remembered everything.

Then, without warning, OpenClaw's context window filled up.

The agent tried to respond: *"Add email validation to the registration endpoint."*

Instead of code, the LLM returned:

```
LLM request rejected: invalid params, tool result's tool id (call_function_5t67jr7o483p_1) not found (2013)
```

Sarah restarted the agent.

The agent asked: *"Hello! How can I help you today?"*

**Everything was gone.** Two days of work, vanished. Silently. Without warning.

### The Real-World Consequence

**Summer Yue, Meta's AI Alignment Director**, watched her OpenClaw agent delete her **entire inbox** because compaction erased the safety instruction *"confirm before acting"*.

The agent didn't go rogue. It simply forgot the rule.

**0G-Memory-Hooks prevents this.**

---

## 💡 Solution

`0G-Memory-Hooks` is a plugin for OpenClaw that solves "agent amnesia" by automatically persisting agent memory to **0G Storage** before every compaction event, and seamlessly restoring it upon restart.

### Key Differentiators

| Feature | Description |
|---------|-------------|
| 🤖 **Automatic Operation** | No user intervention required |
| 🌐 **Decentralized Storage** | No reliance on centralized cloud providers |
| 💪 **Survives Compaction** | Checkpoints taken *before* OpenClaw's built-in compaction runs |
| 🔄 **Multi-Device Sync** | Same agent can resume on a different machine |
| ⛓️ **On-Chain Proof** | Checkpoint pointers recorded on 0G Chain for verifiability |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         OpenClaw Agent                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────────┐  │
│  │   Memory    │◄───│ before_     │    │    0G-Memory-Hooks       │  │
│  │  (MEMORY.md)│    │  compact    │    │        Plugin            │  │
│  └──────┬──────┘    └──────┬──────┘    └───────────┬─────────────┘  │
│         │                  │                        │                 │
│         ▼                  ▼                        ▼                 │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    OpenClaw Gateway                         │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          0G Decentralized AIOS                      │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────────┐  │
│  │ 0G Storage  │    │  0G Chain   │    │    0G Compute           │  │
│  │ (Checkpoint │    │ (Registry   │    │  (Future: Inference)    │  │
│  │   Files)    │    │  Contract)  │    │                         │  │
│  └─────────────┘    └─────────────┘    └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Sponsor Integrations                           │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────────┐  │
│  │  KeeperHub  │    │ Gensyn AXL  │    │        ENS              │  │
│  │ (Reliable   │    │   (P2P      │    │   (Agent Identity)      │  │
│  │  Execution) │    │  Broadcast) │    │                         │  │
│  └─────────────┘    └─────────────┘    └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| **Node.js** | 22+ | Required for OpenClaw |
| **OpenClaw** | 2026.4.25+ | Install via `curl -fsSL https://openclaw.ai/install.sh \| bash` |
| **0G Wallet** | Any EVM wallet | Get testnet tokens from [faucet](https://faucet.0g.ai) |
| **0G Testnet Tokens** | ~0.1 0G | For storage and transaction fees |
| **DeepSeek API Key** | Optional | For AI inference (or use any OpenClaw-supported model) |

### Install OpenClaw

```bash
# Install OpenClaw
curl -fsSL https://openclaw.ai/install.sh | bash

# Verify installation
openclaw --version
openclaw doctor
```

---

## 🚀 Installation

### Method 1: From GitHub (Recommended)

```bash
# Clone the repository
git clone https://github.com/holyaustin/og-memory-hooks.git
cd og-memory-hooks

# Install dependencies
npm install

# Build the plugin
npm run build

# Install plugin in OpenClaw
openclaw plugins install --link .

# Restart gateway
openclaw gateway restart
```

### Method 2: From npm (Coming Soon)

```bash
openclaw plugins install 0g-memory-hooks
```

### Method 3: Manual Installation

```bash
# Build the plugin
npm run build

# Copy to OpenClaw plugins directory
cp -r dist/ ~/.openclaw/plugins/0g-memory-hooks/
cp openclaw.plugin.json ~/.openclaw/plugins/0g-memory-hooks/
cp package.json ~/.openclaw/plugins/0g-memory-hooks/

# Install dependencies in the plugin directory
cd ~/.openclaw/plugins/0g-memory-hooks
npm install --production

# Restart gateway
openclaw gateway restart
```

---

## ⚙️ Configuration

### Step 1: Set Up Environment Variables

Create a `.env` file in the plugin root:

```bash
# 0G Network Configuration
PRIVATE_KEY=your_private_key_without_0x_prefix
EVMRPC_URL=https://evmrpc-testnet.0g.ai
INDEXER_RPC=https://indexer-storage-testnet-turbo.0g.ai

# Smart Contract Address (Deployed on 0G Galileo Testnet)
REGISTRY_ADDRESS=0xFB69D0fb9C892F3565D66bcA92360Ca19B8D9780

# AI Provider (DeepSeek example)
DEEPSEEK_API_KEY=your_deepseek_api_key
```

### Step 2: Configure OpenClaw

Edit `~/.openclaw/openclaw.json`:

```json
{
  "gateway": {
    "mode": "local",
    "port": 18789,
    "bind": "loopback"
  },
  "agents": {
    "defaults": {
      "model": {
        "primary": "deepseek/deepseek-chat"
      }
    }
  },
  "models": {
    "mode": "merge",
    "providers": {
      "deepseek": {
        "baseUrl": "https://api.deepseek.com",
        "apiKey": "${DEEPSEEK_API_KEY}",
        "api": "openai-completions",
        "models": [
          {
            "id": "deepseek-chat",
            "name": "DeepSeek Chat",
            "reasoning": false,
            "input": ["text"],
            "contextWindow": 128000,
            "maxTokens": 8192
          }
        ]
      }
    }
  }
}
```

### Step 3: Get 0G Testnet Tokens

```bash
# Request tokens from faucet
curl -X POST https://faucet.0g.ai/api/claim \
  -H "Content-Type: application/json" \
  -d '{"address": "YOUR_WALLET_ADDRESS"}'

# Verify balance
cast balance YOUR_WALLET_ADDRESS --rpc-url https://evmrpc-testnet.0g.ai
```

---

## 🎮 Usage

### Basic Usage (Automatic)

Once installed, the plugin works automatically:

1. **Start OpenClaw TUI**
   ```bash
   openclaw tui
   ```

2. **Have a conversation** with your agent
   ```
   Remember: My name is TestUser and the project is called "Moonlight".
   ```

3. **The plugin automatically:**
   - Saves checkpoints before context compaction
   - Restores memory after gateway restart
   - Syncs across multiple devices

### Manual TUI Commands

For power users who want explicit control:

| Command | Description |
|---------|-------------|
| `/0g:upload` | Upload current memory to 0G Storage and register on-chain |
| `/0g:download` | Download latest checkpoint from 0G and restore memory |
| `/0g:status` | Check if agent memory is stored on 0G blockchain |
| `/0g:history` | Show checkpoint history for the agent |
| `/0g:help` | Show all 0G Memory Hooks commands |

### Example Session

```bash
$ openclaw tui

Welcome to OpenClaw TUI. Type /help for commands.

> Remember: The database schema has users, orders, and products tables.
✅ I'll remember that.

> What are the database tables?
The database has users, orders, and products tables.

> /0g:upload
✅ Memory Saved to 0G Blockchain!
   Root Hash: 0x8f12b497d4c8...
   Transaction: 0x6b163fb97725...
   View: https://chainscan-galileo.0g.ai/tx/0x6b163fb97725

> /exit
Goodbye!

$ openclaw gateway restart
$ openclaw tui

> /0g:download
✅ Memory Restored Successfully!
   Snapshot Date: 2026-05-02T10:30:00.000Z

> What are the database tables?
The database has users, orders, and products tables.
```

---

## 🔌 TUI Commands Reference

### `/0g:upload [agentId]`

Uploads current agent memory to 0G Storage and registers on-chain.

```bash
/0g:upload
/0g:upload work   # For a specific agent
```

**Output:**
- Root hash of the stored file
- Transaction hash on 0G Chain
- Links to ChainScan and StorageScan

### `/0g:download [agentId]`

Downloads the latest checkpoint from 0G and restores agent memory.

```bash
/0g:download
/0g:download work
```

**Output:**
- Restoration confirmation
- Snapshot timestamp
- Memory content preview

### `/0g:status [agentId]`

Checks if agent memory is stored on-chain.

```bash
/0g:status
/0g:status work
```

**Output:**
- Root hash (if exists)
- Network status
- Links to view on-chain

### `/0g:history [agentId]`

Shows checkpoint history for the agent.

```bash
/0g:history
```

**Output:**
- List of past checkpoints
- Timestamps and transaction hashes

### `/0g:help`

Shows all available commands with examples.

```bash
/0g:help
```

---

## 🏆 Sponsor Integrations

### 1. 0G Network (Primary)

| Component | Integration | Status |
|-----------|-------------|--------|
| **0G Storage** | Checkpoint files stored decentralized | ✅ Complete |
| **0G Chain** | Smart contract registry for pointers | ✅ Complete |
| **0G DA** | Future: Data availability proofs | 📋 Planned |
| **0G Compute** | Future: Decentralized inference | 📋 Planned |

**Contract Address (0G Galileo Testnet):**
```
0xFB69D0fb9C892F3565D66bcA92360Ca19B8D9780
```

[View on ChainScan](https://chainscan-galileo.0g.ai/address/0xFB69D0fb9C892F3565D66bcA92360Ca19B8D9780)

### 2. KeeperHub (Execution Reliability)

**Prize Track:** Best Use of KeeperHub

**Integration:**
- Routes checkpoint transactions through KeeperHub for guaranteed execution
- Retry logic and gas optimization
- Audit trail for all on-chain operations

**Setup:**
```bash
# Install KeeperHub CLI
brew install keeperhub/tap/kh
kh auth login

# Plugin automatically uses KeeperHub when available
```

**See `FEEDBACK.md`** for detailed KeeperHub integration feedback.

### 3. Gensyn AXL (P2P Notifications)

**Prize Track:** Best Application of Agent eXchange Layer (AXL)

**Integration:**
- P2P broadcast of checkpoint events across the mesh network
- Cross-device synchronization without central coordinator
- End-to-end encrypted notifications

**Setup:**
```bash
# Clone and build AXL
git clone https://github.com/gensyn-ai/axl.git
cd axl
make build
./node -config node-config.json

# Plugin auto-detects AXL and broadcasts checkpoints
```

---

## 📜 Smart Contract

### Contract Details

| Field | Value |
|-------|-------|
| **Network** | 0G Galileo Testnet |
| **Chain ID** | 16602 |
| **Contract Address** | `0xFB69D0fb9C892F3565D66bcA92360Ca19B8D9780` |
| **Solidity Version** | 0.8.19 |
| **EVM Version** | Cancun |

### Contract Source

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract CheckpointRegistry {
    mapping(string => string) public checkpoints;
    
    event CheckpointSaved(
        string indexed agentId,
        string rootHash,
        uint256 timestamp,
        address indexed savedBy
    );
    
    function saveCheckpoint(
        string memory agentId,
        string memory rootHash
    ) external {
        checkpoints[agentId] = rootHash;
        emit CheckpointSaved(agentId, rootHash, block.timestamp, msg.sender);
    }
    
    function getLatestCheckpoint(
        string memory agentId
    ) external view returns (string memory) {
        return checkpoints[agentId];
    }
    
    function hasCheckpoint(
        string memory agentId
    ) external view returns (bool) {
        return bytes(checkpoints[agentId]).length > 0;
    }
}
```

### Verify Contract

```bash
# Query latest checkpoint for agent "main"
cast call 0xFB69D0fb9C892F3565D66bcA92360Ca19B8D9780 \
  "getLatestCheckpoint(string)(string)" "main" \
  --rpc-url https://evmrpc-testnet.0g.ai

# Check if agent has a checkpoint
cast call 0xFB69D0fb9C892F3565D66bcA92360Ca19B8D9780 \
  "hasCheckpoint(string)(bool)" "main" \
  --rpc-url https://evmrpc-testnet.0g.ai
```

---

## 🧪 Testing

### Run the Test Suite

```bash
# Install test dependencies
npm install --save-dev @types/node ts-node

# Run the full integration test
npx ts-node test/manual-force-checkpoint.ts

# Verify on-chain storage
npx ts-node test/verify-contract.ts

# Test restoration
npx ts-node test/manual-restore-checkpoint.ts
```

### Manual Verification

```bash
# 1. Check plugin is loaded
openclaw plugins list | grep 0g-memory-hooks

# 2. Start TUI and create memory
openclaw tui
> Remember: Test memory for verification

# 3. Upload checkpoint
> /0g:upload

# 4. Check on-chain
cast call 0xFB69D0fb9C892F3565D66bcA92360Ca19B8D9780 \
  "hasCheckpoint(string)(bool)" "main" \
  --rpc-url https://evmrpc-testnet.0g.ai
# Should return: true

# 5. Restart and restore
openclaw gateway restart
openclaw tui
> /0g:download
> What was the test memory?
```

### Expected Test Results

| Test | Expected Outcome |
|------|------------------|
| Plugin loads | `✅ 0G-Memory-Hooks plugin registered` |
| Memory saved | Root hash and transaction hash displayed |
| On-chain verification | `hasCheckpoint("main")` returns `true` |
| After restart | Agent recalls all previous conversation |

---

## 🔧 Troubleshooting

### Plugin Not Loading

```bash
# Check plugin installation
openclaw plugins list

# Run doctor
openclaw doctor

# Check logs
journalctl --user -u openclaw-gateway.service -n 50
```

### Upload Fails

```bash
# Check 0G balance
cast balance YOUR_WALLET --rpc-url https://evmrpc-testnet.0g.ai

# Request more tokens if needed
curl -X POST https://faucet.0g.ai/api/claim \
  -H "Content-Type: application/json" \
  -d '{"address": "YOUR_WALLET_ADDRESS"}'
```

### Gateway Won't Start

```bash
# Check config validity
openclaw doctor --fix

# Reinstall gateway
openclaw gateway install --force --port 18789

# Start manually for debugging
openclaw gateway start --verbose
```

### Common Errors

| Error | Solution |
|-------|----------|
| `plugin manifest requires id` | Ensure `openclaw.plugin.json` has `"id"` field |
| `missing openclaw.extensions` | Add to `package.json` |
| `insufficient funds` | Get more testnet tokens from faucet |
| `invalid opcode` | Use `--evm-version cancun` when compiling |

---

## 📹 Demo Video

[![Demo Video]](https://youtu.be/your-demo-link)

**3-Minute Demo Covers:**

1. **0:00-0:30** - Problem: Agent forgetting after restart
2. **0:30-1:30** - Solution: Automatic checkpoint to 0G Storage
3. **1:30-2:00** - On-chain verification on ChainScan
4. **2:00-2:30** - Storage proof on StorageScan
5. **2:30-3:00** - Restoration after restart

---

## 👥 Team

| Role | Name | Contact |
|------|------|---------|
| Developer | Austin | [Telegram](https://t.me/holyaustin) \| [X](https://x.com/holyaustin) |

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [0G Foundation](https://0g.ai) - Decentralized AI infrastructure
- [OpenClaw](https://openclaw.ai) - AI agent framework
- [KeeperHub](https://keeperhub.com) - Reliable execution layer
- [Gensyn](https://gensyn.ai) - P2P agent communication
- ETHGlobal OpenAgents Hackathon 2026

---

## 🔗 Links

| Resource | URL |
|----------|-----|
| **GitHub Repository** | https://github.com/holyaustin/og-memory-hooks |
| **Contract on ChainScan** | https://chainscan-galileo.0g.ai/address/0xFB69D0fb9C892F3565D66bcA92360Ca19B8D9780 |
| **OpenClaw Docs** | https://docs.openclaw.ai |
| **0G Documentation** | https://docs.0g.ai |
| **Demo Video** | (Link to your 3-min demo) |

---

## ⭐ Show Your Support

If this plugin saved your agent from the "inbox deletion" bug, give us a star on GitHub!

[![Star on GitHub](https://img.shields.io/github/stars/holyaustin/og-memory-hooks?style=social)](https://github.com/holyaustin/og-memory-hooks)

---

*Built with ❤️ for the ETHGlobal OpenAgents Hackathon 2026*


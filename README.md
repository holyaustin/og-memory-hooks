# Project Name
0G-Memory-Hooks

Alternative names considered: 0G-Checkpoint, Memory-Flush-0G, Persistent-Claw

## Project Description
0G-Memory-Hooks is a plugin for OpenClaw that solves the "agent amnesia" problem by automatically persisting agent memory to 0G Storage before every compaction event, and seamlessly restoring it upon restart.

The plugin hooks into OpenClaw's lifecycle events, captures the agent's state (conversation context, memory files, workspace data), uploads it to 0G's decentralized storage network, and records a pointer on 0G Chain. When the agent restarts—whether after a crash, compaction, or manual reboot—it automatically locates and restores the most recent checkpoint, resuming work exactly where it left off.

Key Differentiators:

Automatic operation — No user intervention required

Decentralized storage — No reliance on centralized cloud providers

Survives compaction — Checkpoints are taken before OpenClaw's built-in compaction runs 

Multi-device sync — Same agent can resume on a different machine

Three sponsor integrations — 0G (primary) + KeeperHub (execution reliability) + Gensyn (P2P notifications)

## Problem Statement
The Silent Context Apocalypse

Let me tell you about Sarah. She's a developer using OpenClaw to build a full-stack application. Over two days, her agent has been helping her:

Designing a PostgreSQL schema with 12 tables

Writing authentication middleware for JWT tokens

Building API routes for user management

Configuring deployment scripts for AWS

Documenting the entire codebase

The agent remembers everything — every decision, every code snippet, every configuration choice. Sarah is 30 hours into a 40-hour project.

Then, without warning, OpenClaw's context window fills up.

The agent has been tracking approximately 180,000 tokens of conversation history. The model's context window is 200,000 tokens. OpenClaw's internal contextTokens counter hits the threshold .

Here's what happens next:

The agent tries to respond to a simple request: "Add email validation to the registration endpoint."

Instead of writing code, the LLM returns an error:

LLM request rejected: invalid params, tool result's tool id (call_function_5t67jr7o483p_1) not found (2013) 

Sarah is confused. The agent seems broken. She tries /compact — but it's too late. The context corruption has already happened.

She restarts the agent.

And the agent asks: "Hello! How can I help you today?"

It has forgotten everything — the database schema, the authentication flow, the API design, the deployment scripts. Two days of collaborative work, gone. Silently. Without warning.

This isn't a hypothetical. The OpenClaw GitHub issue tracker has multiple reports of this exact scenario . The /compact command exists precisely because of this problem—but it requires manual intervention. Users must:

Be aware that context usage is climbing

Log into their host machine

Run the compact command manually 

Most users don't even know context limits exist until the agent breaks.

The Root Cause

OpenClaw's Pi runtime has two auto-compaction triggers :

Overflow recovery — After the model returns a context overflow error (too late; damage done)

Threshold maintenance — After a successful turn, when contextTokens > contextWindow - reserveTokens

But by the time either triggers, the agent may already be in an inconsistent state. And critically, there is no automatic persistence of session state before compaction.

OpenClaw does have a "pre-compaction memory flush" feature , but:

It only writes to local disk (memory/YYYY-MM-DD.md)

Local storage is ephemeral — lost on crash, reboot, or if the agent runs on a different machine

No decentralized backup exists

The Real-World Consequence

Remember Summer Yue, Meta's AI Alignment Director? She watched her OpenClaw agent delete her entire inbox because compaction erased the safety instruction "confirm before acting" . The agent didn't go rogue—it simply forgot the rule.

0G-Memory-Hooks solves this by:

Taking automatic checkpoints before compaction occurs

Storing them on decentralized, permanent storage (0G Storage)

Recording pointers on 0G Chain for discovery

Broadcasting via Gensyn AXL for cross-device sync


sudo mkdir -p /etc/openclaw
sudo tee /etc/openclaw/env << 'EOF'
DEEPSEEK_API_KEY=sk-0f6c7615ceb14ec3be6a031545750ef3
PRIVATE_KEY=7c982668047a2980fa1c8a8109a41a3aab93d52064dade680f2f25cdd3eb427a
EVMRPC_URL=https://evmrpc-testnet.0g.ai
INDEXER_RPC=https://indexer-storage-testnet-turbo.0g.ai
REGISTRY_ADDRESS=0xFB69D0fb9C892F3565D66bcA92360Ca19B8D9780
EOF
sudo chmod 600 /etc/openclaw/env
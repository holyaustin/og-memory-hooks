# Clean up any previous failed attempts
rm -rf ~/.openclaw/plugins/0g-memory-hooks
rm -f ~/.openclaw/installs.json

# Rebuild the plugin
cd /home/augustineonuora/Dapps-Empty/2026/May2026/0g-memory-hooks
npm run build

# Install with link
openclaw plugins install --link /home/augustineonuora/Dapps-Empty/2026/May2026/0g-memory-hooks

# Verify it's installed
openclaw plugins list



# Test the Tools in TUI
Now in TUI, the agent can call these tools naturally:

bash
openclaw tui
Example conversations:

text
> Can you upload my memory to 0G storage?
[Agent calls upload_memory_to_0g tool]
✅ Memory Saved to 0G Blockchain!

> Check if my memory is stored on-chain
[Agent calls check_0g_memory_status tool]
✅ Checkpoint found for agent "main"

> Please restore my memory from the latest checkpoint
[Agent calls restore_memory_from_0g tool]
✅ Memory Restored Successfully!



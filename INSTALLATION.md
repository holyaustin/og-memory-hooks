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
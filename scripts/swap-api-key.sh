#!/bin/bash
# Swap Anthropic API key to backup
# Usage: ./scripts/swap-api-key.sh

BACKUP_KEY_FILE="/Users/will/clawd/.secrets/backup-api-key.txt"
CONFIG_FILE="/Users/will/.clawdbot/clawdbot.json"

if [ ! -f "$BACKUP_KEY_FILE" ]; then
    echo "❌ Backup key file not found: $BACKUP_KEY_FILE"
    exit 1
fi

BACKUP_KEY=$(cat "$BACKUP_KEY_FILE" | tr -d '\n')

echo "🔄 Swapping API key..."
echo "   New key: ${BACKUP_KEY:0:20}..."

# Update the config using jq to add apiKey to the auth profile
jq --arg key "$BACKUP_KEY" '.auth.profiles["anthropic:default"].apiKey = $key' "$CONFIG_FILE" > "${CONFIG_FILE}.tmp" && mv "${CONFIG_FILE}.tmp" "$CONFIG_FILE"

echo "✅ Config updated. Restarting Gateway..."

# Restart Gateway
clawdbot gateway restart

echo "🚀 Done! New API key is active."

#!/bin/bash
# Check API health and swap if needed
# Can be run via cron or launchd

LOG_FILE="/Users/will/clawd/logs/api-monitor.log"
BACKUP_KEY_FILE="/Users/will/clawd/.secrets/backup-api-key.txt"
SWAP_SCRIPT="/Users/will/clawd/scripts/swap-api-key.sh"

mkdir -p /Users/will/clawd/logs

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
    echo "$1"
}

# Test API with a minimal request
test_api() {
    response=$(curl -s -w "\n%{http_code}" -X POST "https://api.anthropic.com/v1/messages" \
        -H "x-api-key: $(security find-generic-password -a clawdbot -s anthropic-api-key -w 2>/dev/null || echo '')" \
        -H "anthropic-version: 2023-06-01" \
        -H "content-type: application/json" \
        -d '{"model":"claude-3-haiku-20240307","max_tokens":1,"messages":[{"role":"user","content":"hi"}]}' \
        2>/dev/null)
    
    http_code=$(echo "$response" | tail -n1)
    echo "$http_code"
}

log "Checking API health..."

# Test current API
status=$(test_api)

if [ "$status" = "200" ]; then
    log "✅ API is healthy (HTTP $status)"
    exit 0
elif [ "$status" = "402" ] || [ "$status" = "429" ]; then
    log "⚠️ API credits exhausted or rate limited (HTTP $status)"
    log "🔄 Triggering key swap..."
    
    if [ -f "$BACKUP_KEY_FILE" ] && [ -f "$SWAP_SCRIPT" ]; then
        bash "$SWAP_SCRIPT"
        log "✅ Key swapped successfully"
    else
        log "❌ Cannot swap - missing backup key or swap script"
        exit 1
    fi
else
    log "⚠️ API returned unexpected status: $status"
    exit 1
fi

# HEARTBEAT.md - Malty's Periodic Check-in

## Active Tasks
- Working on: Malty Control Panel v2 overnight build
- Check TASKS.md for current priorities

## Periodic Actions
1. **If overnight build session:** Continue working on control panel improvements
2. **If session ending:** Compound learnings to LEARNINGS.md
3. **If idle:** Check TASKS.md for next priority item
4. **Check API credits:** Run session_status and check "Week X% left" - if <20%, alert Will

## API Key Monitoring
- Primary: Current key in Gateway config  
- Backup: `/Users/will/clawd/.secrets/backup-api-key.txt`
- Monitor: `session_status` shows "Week X% left"
- **If credits low (<20%):** Alert Will
- **If credits exhausted:** Run `./scripts/swap-api-key.sh`
- **Auto-check:** launchd job runs every 30min (com.malty.api-monitor)

## Current Focus (Night of Jan 29-30, 2026)
Building out the control panel with real functionality:
- Better avatar ✅
- Working voice ✅
- Easter eggs ✅
- Live memory browser
- Task queue UI
- Notifications

Will is sleeping. Keep building. Update OVERNIGHT-LOG.md with progress.

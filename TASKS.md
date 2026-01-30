# TASKS.md - Malty's Work Queue

*Priority-ordered task queue. I pick from the top and work down.*

## How This Works
- Will adds tasks here or tells me to add them
- Tasks are priority-ordered (top = most important)
- I work through them systematically
- Completed tasks move to the Done section with notes

---

## 🔴 In Progress

### Build Malty Control Panel v2
- **Status:** Active (overnight build session)
- **Goal:** Transform from demo to real, functional platform
- **Subtasks:**
  - [x] Redesign avatar to be more distinctive ✅
  - [x] Make voice interface actually work ✅
  - [x] Live memory browser ✅
  - [x] Real Gateway connection ✅ (Jan 30 00:00)
  - [x] Task queue UI in the panel ✅
  - [x] Notification system ✅
  - [x] Easter eggs ✅
  - [x] Mobile polish ✅
  - [x] Gateway config viewer in Settings ✅

---

## 🟡 Up Next

### Real Gateway API integration
- Connect panel to actual Gateway
- Real-time token tracking
- Session history viewer
- Live status updates

### Cash City launch prep
- Final testing before launch
- Monitor analytics dashboard
- Prepare for user influx

---

## 🟢 Backlog

### Voice interaction expansion
- Voice memos
- Voice calls via browser
- Better TTS voices

### Gateway API integration
- Real-time token tracking
- Session history viewer
- Live status updates

### Control panel features
- Dark/light theme
- Custom themes
- Settings persistence
- User preferences

---

## ✅ Done

### 2026-01-30 (Overnight Build - Session 2)
- [x] Gateway API service (services/gateway.js)
- [x] React hooks for live data (hooks/useGateway.js)
- [x] Dashboard with real token/context/budget data
- [x] Memory browser reads actual workspace files
- [x] Settings shows live Gateway config + restart button
- [x] Auto-refresh (15s) with error handling
- [x] Connection status indicator

### 2026-01-30 (Overnight Build)
- [x] Avatar 2.0 - Abstract orb with particles, mood colors, mouse tracking
- [x] Comms v2 - Smart responses, voice visualization, avatar integration
- [x] Easter eggs - Konami code, "malty" secret word, random thoughts
- [x] Memory browser - File tree, markdown preview, search
- [x] Task queue UI - Priorities, subtasks, progress bars, filters
- [x] Notification system - Toast provider with types
- [x] API monitoring - Backup key, launchd job, swap script
- [x] Custom skills - malty-compound, malty-identity, malty-overnight
- [x] Compound learning docs - LEARNINGS.md structure

### 2026-01-29
- [x] Analytics system for Cash City (6 events, funnel tracking)
- [x] Analytics dashboard (standalone HTML)
- [x] Image storage fix (permanent Supabase URLs)
- [x] CEO Gallery component (later removed per Will's request)
- [x] Mobile responsive CSS (600+ lines)
- [x] Malty Control Panel v1 (React + Tailwind)
- [x] Identity tab with personality
- [x] Soul tab with deep personality
- [x] Custom animated avatar

---

*Last updated: 2026-01-30 06:30 GST*

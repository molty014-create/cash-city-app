# Cash City - Parallel Agent Tasks
**Created:** 2026-01-29
**Deadline:** Feb 3, 2026 4pm UTC (3 days)

## Task Distribution Strategy

### 🎯 Agent 1: Mobile Responsiveness (Priority 1)
**Estimate:** 8 hours
**Files:** `src/CashCityPrelaunch.jsx`, `src/index.css`
**Objective:** Make entire flow work on mobile (320px - 768px screens)

**Checklist:**
- [ ] Add responsive breakpoints (@media queries)
- [ ] Fix all hardcoded pixel widths (600px containers → 90vw with max-width)
- [ ] Scale fonts appropriately (56px → clamp(32px, 8vw, 56px))
- [ ] Fix wallet modal on mobile
- [ ] Test on iPhone/Android simulators
- [ ] Ensure buttons are finger-friendly (min 44px height)
- [ ] Fix horizontal overflow issues

---

### 🎯 Agent 2: Image Storage & Persistence (Priority 2)
**Estimate:** 4 hours
**Files:** `supabase/functions/generate-character-gemini/index.ts`, `src/CashCityPrelaunch.jsx`
**Objective:** Store generated images in Supabase Storage (Replicate URLs expire in 1h)

**Checklist:**
- [ ] Create Supabase Storage bucket `generated-ceos`
- [ ] Update generation function to download from Replicate
- [ ] Upload to Supabase Storage
- [ ] Update `applications` table with permanent URL
- [ ] Update frontend to use Supabase URLs
- [ ] Test returning user flow with stored images

---

### 🎯 Agent 3: Error Handling & Retry UX (Priority 3)
**Estimate:** 3 hours
**Files:** `src/CashCityPrelaunch.jsx`
**Objective:** Better error messages and retry functionality

**Checklist:**
- [ ] Add retry button UI for failed generations
- [ ] Categorize errors (network, API rate limit, invalid image, etc.)
- [ ] Show specific error messages per failure type
- [ ] Add frontend rate limiting (debounce submit button)
- [ ] Add cooldown UI (30s between retries)
- [ ] Test error scenarios

---

### 🎯 Agent 4: Component Refactoring (Priority 4)
**Estimate:** 6 hours
**Files:** Break up `src/CashCityPrelaunch.jsx` into components
**Objective:** Split 4016-line monolith into maintainable pieces

**Checklist:**
- [ ] Create `src/components/Confetti.jsx`
- [ ] Create `src/components/AnimatedCounter.jsx`
- [ ] Create `src/components/ApplicantTicker.jsx`
- [ ] Create `src/components/AudioControls.jsx`
- [ ] Create `src/components/WalletConnect.jsx`
- [ ] Create `src/components/TwitterLink.jsx`
- [ ] Create `src/components/ApplicationForm.jsx`
- [ ] Create `src/components/ImageGeneration.jsx`
- [ ] Create `src/components/TweetVerification.jsx`
- [ ] Create `src/components/Confirmation.jsx`
- [ ] Update main component to use extracted components
- [ ] Test full flow works after refactor

---

### 🎯 Agent 5: Analytics & Tracking (Priority 5)
**Estimate:** 2 hours
**Files:** New edge function, `src/CashCityPrelaunch.jsx`
**Objective:** Add conversion funnel tracking

**Checklist:**
- [ ] Create `supabase/functions/track-event/index.ts`
- [ ] Add events table to track user actions
- [ ] Track: page_view, wallet_connected, twitter_linked, application_submitted, image_generated, tweet_verified
- [ ] Add frontend tracking calls
- [ ] Create simple dashboard query to see funnel

---

## Execution Plan

**Phase 1 (Day 1):** Critical path - Mobile + Image Storage
- Spawn Agent 1 (Mobile) and Agent 2 (Image Storage) in parallel
- These don't touch same files, safe to run concurrently

**Phase 2 (Day 2):** UX & Architecture
- Spawn Agent 3 (Error Handling) - touches main file
- After Agent 3 done, spawn Agent 4 (Refactoring) - major surgery

**Phase 3 (Day 3):** Monitoring & Polish
- Spawn Agent 5 (Analytics) after refactor complete
- Final testing, bug fixes

## Agent Wake Commands

Each agent should notify on completion:
```bash
clawdbot gateway wake --text "Done: [task name] - [summary]" --mode now
```

## Notes
- Agents 1 & 2 can run in parallel (different files)
- Agent 3 must wait for 1 & 2 (touches main file)
- Agent 4 is major refactor - must be isolated
- Agent 5 can run after 4 (adds new files)

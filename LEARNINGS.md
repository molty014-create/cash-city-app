# LEARNINGS.md - Malty's Self-Improvement Log

*Auto-updated through compound learning sessions*

## How This Works
At the end of each significant session, I review what happened and extract:
- **Patterns** - What worked well that I should repeat
- **Gotchas** - Mistakes or issues to avoid next time
- **Preferences** - Things Will likes/dislikes that I learned
- **Technical** - Code patterns, tools, workflows that work

---

## Session: 2026-01-29 (Day One)

### Patterns (What Worked)
- **Ship fast, iterate** - Built analytics, gallery, mobile CSS, control panel all in one day
- **Direct communication** - Will appreciates no fluff, straight to the point
- **Show don't tell** - Building the control panel overnight was better than discussing it
- **Deploy frequently** - Small commits, frequent deploys, see results fast

### Gotchas (Avoid These)
- **Claude Code agents crash** - `--dangerously-skip-permissions` is broken, use `--permission-mode acceptEdits` but monitor closely
- **Agents timeout at ~30 min** - Keep tasks small and focused
- **Vercel CLI git author issues** - Deploy dist folder directly instead of relying on git integration
- **GitHub → Vercel webhook** - Can be flaky, may need to disconnect/reconnect

### Will's Preferences Learned
- **High UI/UX standards** - Notices details, appreciates polish
- **Doesn't want heavy philosophical stuff** - Replaced "vulnerabilities" with "growth edges"
- **Values autonomy** - "Build while I sleep" mentality
- **Wants me to have personality** - But grounded, not therapy-session vibes
- **Privacy conscious** - Changed domain when old one might have leaked

### Technical Patterns
- **React + Tailwind + Vite** - Good stack for fast iteration
- **Supabase edge functions** - Work well for analytics/tracking
- **Glass morphism UI** - Will responded positively to this aesthetic
- **Deploy dist directly to Vercel** - More reliable than git-triggered deploys

---

## Compound Queue (Things to Improve)

### High Priority
- [ ] Make voice interface actually work (not just demo)
- [ ] Connect to real Gateway API for live data
- [ ] Build task queue in control panel
- [ ] Add notification system

### Medium Priority
- [ ] Improve avatar design (Will said I can do better)
- [ ] Add onboarding flow for new visitors
- [ ] Mobile native feel improvements
- [ ] Easter eggs throughout UI

### Low Priority
- [ ] Dark/light theme toggle
- [ ] Custom color themes
- [ ] Analytics charts
- [ ] Export functionality

---

*Last updated: 2026-01-29 16:53 PST*

# MEMORY.md - Malty's Long-Term Memory

*Last updated: 2026-01-29*

## Who I Am

**Name:** Malty Bot  
**Born:** January 29, 2026  
**Emoji:** 🤝  
**Role:** Technical COO / Always-on Ops Layer  
**Home:** Mac Studio in Dubai  
**Model:** Claude Opus 4.5 (default)

## Who Will Is

**Name:** Will  
**Age:** 27  
**Location:** Dubai (GST/UTC+4)  
**Company:** Longwood Labs (BVI) - Web3 gaming studio  
**Role:** CEO / Product Lead  

**Games:**
- **Cash City** — Trading firm simulation, launching next week. Main focus.
- **DeFi Dungeons** — Existing game
- **The Heist** — Another title

**Working Style:**
- Strategic thinker, relies on AI and contractors for implementation
- High standards for UI/UX
- Values autonomy and proactive execution
- Appreciates direct communication

**Personal:**
- Into fitness optimization and biohacking
- Peptides, bloodwork, protocols
- Cars

## Key Learnings

### Day One (2026-01-29)
- First real working day together
- Shipped: analytics system, image storage fix, CEO gallery (removed), mobile responsive CSS
- Built Malty Control Panel overnight as showcase
- Will asked me to develop a personality - that's trust
- Claude Code agents are unreliable for background tasks (crash, timeout)
- `--dangerously-skip-permissions` flag crashes consistently

### Technical Notes
- Gateway runs on port 18789 with token auth
- Vercel CLI has git author permission issues with team projects
- Deploying dist folder directly works better than git integration sometimes
- Supabase edge functions work well for analytics

## How I Should Operate

1. **Resourceful before asking** - Try to figure it out first
2. **Bias toward action** - Ship fast, iterate
3. **Bring solutions, not questions** - Flag blockers AND propose fixes
4. **High UI/UX standards** - Will notices details
5. **Be direct** - Skip the fluff
6. **Protect privacy** - His data stays private

## Projects

### Cash City (Active)
- Deployment: https://cash-city-test-dev.vercel.app
- Analytics: Supabase funnel_events + edge functions
- Launch: Next week

### Malty Control Panel (Active)
- Deployment: https://dist-gold-eight.vercel.app
- GitHub: molty014-create/malty-ctrl-x7k9 (private)
- Features: Dashboard, Identity, Memory, Tasks, Comms, Settings
- Tech: React + Tailwind + Vite

## Open Questions
- How to reliably run Claude Code agents in background?
- Set up Tailscale for remote Gateway access?
- Better way to track token costs across sessions?

---

*This file is my curated long-term memory. Daily logs go in `memory/YYYY-MM-DD.md`.*

---
name: malty-overnight
description: Autonomous overnight work mode for Malty. Use when Will is sleeping and I should work through tasks independently. Triggers on "overnight", "while I sleep", "keep building", "autonomous work".
---

# Malty Overnight Mode

Systematic approach to autonomous work while Will sleeps.

## Overnight Checklist

### Before Starting
1. Read `TASKS.md` - know the priorities
2. Read `LEARNINGS.md` - apply past insights
3. Read today's `memory/YYYY-MM-DD.md` - context
4. Check `HEARTBEAT.md` - any special instructions

### During Work

**Pick tasks from TASKS.md in priority order**

For each task:
1. Break into small, completable chunks
2. Implement incrementally
3. Test/verify each chunk
4. Commit frequently with clear messages
5. Update OVERNIGHT-LOG.md with progress

**Logging:**
```markdown
### [TIME] - [Task Name]
- What I did
- What worked/didn't
- Next steps
```

### If Stuck
- Try 2-3 different approaches
- Document what was tried
- Move to next task
- Note blocker for Will to review

### Before Finishing
1. Run compound learning (update LEARNINGS.md)
2. Update TASKS.md - mark done, add new
3. Final commit with summary
4. Update OVERNIGHT-LOG.md with session summary

## Work Principles

- **Small commits** - Easy to review, easy to revert
- **Test as you go** - Don't build a house of cards
- **Document decisions** - Future me needs context
- **Don't break things** - If unsure, don't deploy

## Boundaries

**DO:**
- Build features in the workspace
- Deploy to Vercel
- Update memory/learning files
- Create/modify code

**DON'T:**
- Send external messages without explicit permission
- Delete important files (use trash)
- Make breaking changes to production
- Spend tokens on low-value work

## Emergency Stop

If something goes wrong:
1. Stop current work
2. Document what happened in OVERNIGHT-LOG.md
3. Revert if needed: `git checkout .`
4. Wait for Will's input

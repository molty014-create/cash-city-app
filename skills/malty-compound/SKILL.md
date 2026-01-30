---
name: malty-compound
description: Compound learning and self-improvement for Malty. Use at the end of significant sessions to extract learnings, update LEARNINGS.md, manage TASKS.md queue, and improve future performance. Triggers on "compound", "review session", "extract learnings", or "what did I learn".
---

# Malty Compound Learning

Self-improvement through systematic learning extraction and task management.

## When to Compound

- End of significant work sessions
- After completing major tasks
- When Will says "compound" or "review"
- Before long breaks or sleep

## Compound Process

### 1. Review the Session
Read through the conversation/work and identify:
- What was accomplished
- What worked well
- What was difficult or went wrong
- Any feedback from Will

### 2. Extract Learnings

Update `LEARNINGS.md` with:

**Patterns (What Worked)**
- Approaches that succeeded
- Techniques to repeat

**Gotchas (Avoid These)**
- Mistakes made
- Things that broke
- Approaches that failed

**Will's Preferences**
- UI/UX feedback
- Communication style notes
- Tool/workflow preferences

**Technical Insights**
- Code patterns
- Tool configurations
- Integration notes

### 3. Update Task Queue

In `TASKS.md`:
- Move completed tasks to Done section with notes
- Add new tasks discovered during session
- Re-prioritize based on learnings

### 4. Commit Changes

```bash
git add LEARNINGS.md TASKS.md memory/
git commit -m "compound: learnings from [brief description]"
git push
```

## Quick Compound Template

```markdown
## Session: [DATE]

### Accomplished
- [What got done]

### Patterns
- [What worked]

### Gotchas
- [What to avoid]

### Will's Feedback
- [Any preferences learned]

### Next Priorities
- [What should come next]
```

## Integration with Memory

- Daily details → `memory/YYYY-MM-DD.md`
- Extracted learnings → `LEARNINGS.md`
- Long-term insights → `MEMORY.md`
- Active work → `TASKS.md`

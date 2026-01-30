#!/bin/bash
# Malty's Compound Review Script
# Run this to trigger a learning review session

cd /Users/will/clawd

# Trigger Malty to review and compound learnings
clawdbot gateway wake --text "COMPOUND REVIEW: Review the last session. Read through memory/$(date +%Y-%m-%d).md and any recent work. Extract learnings and update LEARNINGS.md with:
1. New patterns that worked
2. Gotchas to avoid
3. Will's preferences learned
4. Technical insights

Then update the Compound Queue with new priorities based on what you learned. Commit changes to git." --mode now

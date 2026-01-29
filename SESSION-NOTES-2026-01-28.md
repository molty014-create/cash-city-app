# Cash City Session Notes - January 28, 2026

## Where We Left Off
Testing the "held item fix" - 2/3 tests passed before pausing. Need to verify if arm/hand positioning is preserved.

## The Core Problem
Need an image analysis API that can handle **1000+ RPM** for thousands of concurrent users, while generating **high quality prompts** that preserve character composition.

## What We Tried

### 1. Claude (Anthropic) - Current
- **Pros:** Good quality analysis, creative prompts
- **Cons:** Low rate limits (~50 RPM), 5MB image size limit (fixed with URL fallback)
- **Status:** Working but won't scale

### 2. Gemini 2.5 Flash - Attempted
- **Pros:** 1000 RPM rate limit
- **Cons:** Was causing composition issues (character repositioning, arm movement)
- **Status:** Reverted back to Claude to isolate the issue

## Latest Fix Applied (needs verification)
The hypothesis was that "held items" (pipe, cigarette) were causing the model to reposition the character's arms/hands.

**Changes made to `generate-character/index.ts`:**

1. **Added explicit arm/hand lock (line 273):**
   ```
   IMPORTANT: Do NOT move the arms or hands from their current position
   ```

2. **Separated held vs worn items (lines 324-359):**
   - Worn items: `character wears flat cap`
   - Held items: `character already has pipe in their current position without moving`
   - Filters out tattoos from accessories (belong in quirky_feature)
   - Simplifies held item names (removes "wooden", "lit", etc.)

3. **Enhanced negative prompt (lines 402-410):**
   ```
   arm moved, hand repositioned, reaching, grabbing, picking up, putting down, arm raised, arm lowered
   ```

## Test Results to Check
Look at these files to verify if positioning improved:
- `held-item-fix-test-*.html` (latest test results)
- Compare against `load-test-results-1769590254549.html` (the good baseline from earlier)

## Configuration
- **Supabase URL:** `https://ftmoenjomlkxiarzpgza.supabase.co`
- **Endpoint:** `/functions/v1/generate-character`
- **Image Generation:** fal.ai Seedream 4.5 Edit
- **Strength:** 0.75 (tried 0.65, didn't help much)

## Goals for Next Session
1. **Verify held-item fix** - Check if arm/hand positioning is preserved
2. **Get Gemini working** - Apply the same held-item prompting to Gemini version
3. **Load test at scale** - Ensure 1000+ concurrent users work
4. **Deadline:** Feb 3, 2026 at 4pm UTC

## Key Files
- `supabase/functions/generate-character/index.ts` - Main generation function (Claude version)
- `load-test-500.cjs` - Load testing script (has old Supabase URL - needs update!)
- `.env` - Has correct Supabase URL and API keys

## Quick Resume Commands
```bash
# Run 3-image test
cd /c/Users/Will/Documents/Claudicus/cash-city-app
# Then ask Claude to run the held-item test again

# Deploy after changes
supabase functions deploy generate-character
```

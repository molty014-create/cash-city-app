# Cash City - Technical Handoff Document

## Project Status: PRODUCTION READY
**Last Updated:** Jan 29, 2026
**Deadline:** Feb 3, 2026 at 4pm UTC

---

## Live URLs

| Service | URL |
|---------|-----|
| Frontend | https://cash-city-app.vercel.app |
| Supabase Project | https://supabase.com/dashboard/project/ftmoenjomlkxiarzpgza |
| Edge Function | `generate-character-gemini` |

---

## What This App Does

A prelaunch page for "Cash City" game. Users:
1. Connect Solana wallet (Phantom/Solflare)
2. Link X (Twitter) account via OAuth
3. Submit application - AI generates a "trading firm CEO" character from their X profile picture
4. Share to Twitter and verify tweet
5. Get confirmation with application number

**The AI converts ANY profile picture (animals, robots, pixel art, humans) into a human male CEO character while preserving identity traits (colors, accessories, personality).**

---

## Architecture

```
Frontend (Vercel)          Supabase Edge Functions
     │                            │
     ├──> generate-character-gemini
     │         │
     │         ├──> Gemini 2.0 Flash (analyze PFP, extract identity)
     │         └──> Replicate Seedream 4.5 (generate CEO image)
     │
     ├──> verify-tweet (Twitter verification)
     └──> get-stats (application count)
```

---

## Key Files

### Frontend
- `src/CashCityPrelaunch.jsx` - Main component (~2600 lines)
- `src/App.jsx` - Wallet providers setup
- `src/lib/supabase.js` - Supabase client

### Edge Functions
- `supabase/functions/generate-character-gemini/index.ts` - **THE MAIN AI FUNCTION**
- `supabase/functions/verify-tweet/index.ts` - Tweet verification
- `supabase/functions/get-stats/index.ts` - Stats endpoint
- `supabase/functions/_shared/cors.ts` - CORS headers

### Config
- `.env` - Local environment variables
- `vercel.json` - Vercel deployment config
- `supabase/migrations/001_create_applications.sql` - Database schema

---

## AI Generation Pipeline (generate-character-gemini)

### Step 1: Gemini 2.0 Flash Analysis
Extracts IDENTITY ONLY from the PFP - no art style info:
```json
{
  "suit_color": "deep burgundy",
  "tie_color": "gold",
  "hat_or_headwear": "dark newsboy cap",
  "eyewear": "gold aviator sunglasses",
  "facial_hair": "thick black beard",
  "hair": "slicked back black hair",
  "skin_tone": "dark brown",
  "jewelry": "gold chain",
  "expression": "confident smirk",
  "personality": "old money sophistication"
}
```

### Step 2: Replicate Seedream 4.5
- Uses a base CEO image as input
- Applies identity traits via prompt
- Strength: 0.70 (good customization while preserving base)
- Output: 2K resolution

### Key Design Decisions
- **Identity-only extraction**: Prevents art style bleeding (no more pixelated/cartoony outputs)
- **Always human male CEO**: Even if input is a monkey, robot, or pixel art
- **Preserve camera framing**: Explicit instructions to maintain same pose/distance
- **Retry logic**: Handles Replicate 429 rate limits with exponential backoff

---

## Environment Variables

### Frontend (.env)
```
VITE_SUPABASE_URL=https://ftmoenjomlkxiarzpgza.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

### Supabase Secrets (already configured)
```
GEMINI_API_KEY          ✓
REPLICATE_API_TOKEN     ✓
ANTHROPIC_API_KEY       ✓ (not used in current flow)
FAL_KEY                 ✓ (not used - switched to Replicate)
BASE_SCENE_URL          ✓
TWITTER_BEARER_TOKEN    ✓
TWITTER_CLIENT_ID       ✓
TWITTER_CLIENT_SECRET   ✓
```

---

## Performance (Validated)

| Test | Success Rate | Throughput |
|------|--------------|------------|
| 100 concurrent | 99% | ~91/min |
| 1000 controlled | 98.6% | ~91/min |
| 600 RPM load test | 99% | ~189/min |

**Average generation time: ~52 seconds**

### Rate Limits
- Gemini 2.0 Flash: 1000 RPM (free tier)
- Replicate: 3000 RPM, burst limit 50 concurrent
- Replicate account has $93+ credit

---

## Deployment Commands

```bash
# Deploy edge function
npx supabase functions deploy generate-character-gemini --no-verify-jwt

# Deploy frontend
npx vercel --prod

# Run locally
npm run dev
```

---

## What's Left To Do

### Before Launch (Feb 3)
- [ ] End-to-end test on production with real wallet + X account
- [ ] Verify Twitter OAuth flow works in production
- [ ] Test tweet verification flow
- [ ] Consider retry button UI for failed generations

### Nice to Have
- [ ] Gallery page showing generated characters
- [ ] Save generated images to Supabase storage (currently Replicate URLs)
- [ ] Analytics/tracking for conversion funnel
- [ ] Rate limiting on frontend

### Post-Launch
- [ ] Monitor API costs (Gemini free, Replicate ~$0.02/image)
- [ ] User feedback on character quality
- [ ] Prompt tuning if needed

---

## Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| Pixelated/cartoon output | Art style bleeding through | Already fixed - identity-only extraction |
| Animals in output | Old prompt included animal features | Already fixed - `sanitizeForHuman()` function |
| Character zoomed in | Camera framing not preserved | Already fixed - explicit framing instructions |
| Replicate 429 errors | Rate limit exceeded | Already fixed - retry logic with backoff |
| 404 on NFT URLs | Some NFT IDs don't exist | Use verified working URL ranges |

---

## API Reference

### generate-character-gemini

**POST** `/functions/v1/generate-character-gemini`

Request:
```json
{
  "profile_image_url": "https://example.com/pfp.png",
  "wallet_address": "ABC123..."
}
```

Response:
```json
{
  "success": true,
  "image_url": "https://replicate.delivery/...",
  "prompt": "edit the trading firm CEO...",
  "analysis": { ... },
  "model": "gemini-2.0-flash-v2"
}
```

---

## Contact

Project built by Will with Claude assistance.
Questions? Check the code - it's well-commented.

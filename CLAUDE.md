# Cash City Prelaunch App

## Project Overview
A React/Vite prelaunch page for "Cash City" game with Solana wallet integration and Supabase backend.

## Current Status
- Wallet connection: COMPLETE (Solana - Phantom/Solflare)
- Twitter OAuth: READY (needs Supabase + Twitter credentials configured)
- Database: READY (migration file created, needs to run in Supabase)
- Tweet Verification: READY (Edge Function created, needs TwitterAPI.io key)
- AI Image Generation: MOCK (using random GIFs)

## Tech Stack
- React + Vite (frontend)
- Solana wallet adapter (@solana/wallet-adapter-react)
- Supabase (Auth, Database, Edge Functions)
- TwitterAPI.io (tweet verification)
- CSS-in-JS (inline styles)

## Key Files
- `src/App.jsx` - Wallet providers (ConnectionProvider, WalletProvider, WalletModalProvider)
- `src/CashCityPrelaunch.jsx` - Main component (~2600 lines, has embedded fonts)
- `src/lib/supabase.js` - Supabase client initialization
- `src/index.css` - Base styles + wallet modal overrides
- `supabase/functions/verify-tweet/index.ts` - Tweet verification edge function
- `supabase/functions/get-stats/index.ts` - Application stats edge function
- `supabase/migrations/001_create_applications.sql` - Database schema

## Application Flow
1. Connect Wallet (Solana) - WORKING
2. Link X Account (OAuth via Supabase, fallback to mock)
3. Start Application (saves to database)
4. AI Image Generation (7 sec mock - random GIF)
5. Image Reveal
6. Share to Twitter (intent URL)
7. Tweet Verification (Edge Function calls TwitterAPI.io)
8. Confirmation page with confetti

## Environment Variables
Create `.env` file (see `.env.example`):
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

For Edge Functions (set in Supabase dashboard):
```
TWITTER_API_KEY=your-twitterapi-io-key
```

## Setup Steps
1. Create Supabase project at supabase.com
2. Run migration: `supabase/migrations/001_create_applications.sql`
3. Enable Twitter OAuth in Supabase Auth settings
4. Add Twitter Developer credentials (FREE tier works for OAuth)
5. Deploy edge functions: `supabase functions deploy`
6. Sign up for TwitterAPI.io and add API key to Supabase secrets
7. Update `.env` with Supabase credentials

## Commands
```bash
npm run dev    # Start dev server (http://localhost:5173)
npm run build  # Production build
```

## Deadline
Feb 3, 2026 at 4pm UTC

## Next Steps
1. Create Supabase project and run migrations
2. Set up Twitter OAuth (free tier)
3. Get TwitterAPI.io key
4. Configure environment variables
5. Test full OAuth + verification flow
6. (Optional) Replace mock AI images with real AI generation

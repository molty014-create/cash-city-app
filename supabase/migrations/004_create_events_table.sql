-- Create events table for conversion funnel tracking
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL CHECK (event_name IN (
    'page_view',
    'wallet_connected',
    'twitter_linked',
    'application_submitted',
    'image_generated',
    'tweet_verified'
  )),
  wallet_address TEXT,
  twitter_username TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for querying conversion funnel
CREATE INDEX IF NOT EXISTS idx_events_event_name ON events(event_name);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_wallet ON events(wallet_address);

-- Enable Row Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert events (fire-and-forget from frontend)
CREATE POLICY "Anyone can insert events"
  ON events FOR INSERT
  WITH CHECK (true);

-- Policy: Only service role can read events (for analytics queries)
CREATE POLICY "Service role can read events"
  ON events FOR SELECT
  USING (auth.role() = 'service_role');

-- Useful view for conversion funnel analysis
CREATE OR REPLACE VIEW funnel_stats AS
SELECT
  event_name,
  COUNT(*) as total_count,
  COUNT(DISTINCT wallet_address) as unique_wallets,
  DATE_TRUNC('day', created_at) as event_date
FROM events
GROUP BY event_name, DATE_TRUNC('day', created_at)
ORDER BY event_date DESC, event_name;

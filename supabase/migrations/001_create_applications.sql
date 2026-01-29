-- Create applications table
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  twitter_id TEXT NOT NULL,
  twitter_handle TEXT NOT NULL,
  twitter_name TEXT,
  twitter_avatar TEXT,
  twitter_followers INTEGER DEFAULT 0,
  generated_image_url TEXT,
  tweet_url TEXT,
  tweet_verified BOOLEAN DEFAULT FALSE,
  application_number SERIAL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'selected', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate applications from same wallet or Twitter account
  UNIQUE(wallet_address),
  UNIQUE(twitter_id)
);

-- Indexes for quick lookups
CREATE INDEX IF NOT EXISTS idx_applications_twitter_id ON applications(twitter_id);
CREATE INDEX IF NOT EXISTS idx_applications_wallet ON applications(wallet_address);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications(created_at DESC);

-- Enable Row Level Security
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert their own application (with their wallet)
CREATE POLICY "Users can insert their own application"
  ON applications FOR INSERT
  WITH CHECK (true);

-- Policy: Users can read their own application
CREATE POLICY "Users can read their own application"
  ON applications FOR SELECT
  USING (true);

-- Policy: Only service role can update applications
CREATE POLICY "Service role can update applications"
  ON applications FOR UPDATE
  USING (auth.role() = 'service_role');

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- App stats table for caching aggregate stats
CREATE TABLE IF NOT EXISTS app_stats (
  id INTEGER PRIMARY KEY DEFAULT 1,
  total_applications INTEGER DEFAULT 0,
  verified_applications INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial stats row
INSERT INTO app_stats (id, total_applications, verified_applications)
VALUES (1, 0, 0)
ON CONFLICT (id) DO NOTHING;

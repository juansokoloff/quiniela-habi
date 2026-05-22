-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES
-- ============================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'approved', 'rejected')),
  payment_receipt_url TEXT,
  payment_validated_at TIMESTAMPTZ,
  payment_rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- MATCHES
-- ============================================
CREATE TABLE matches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  external_id INTEGER UNIQUE NOT NULL,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  home_team_flag TEXT DEFAULT '',
  away_team_flag TEXT DEFAULT '',
  match_date TIMESTAMPTZ NOT NULL,
  phase TEXT NOT NULL DEFAULT 'group' CHECK (phase IN ('group', 'round_of_16', 'quarter_final', 'semi_final', 'final')),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'finished', 'cancelled')),
  home_score INTEGER,
  away_score INTEGER,
  matchday INTEGER,
  group_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view matches" ON matches
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can modify matches" ON matches
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- PREDICTIONS
-- ============================================
CREATE TABLE predictions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE NOT NULL,
  predicted_home INTEGER NOT NULL CHECK (predicted_home >= 0),
  predicted_away INTEGER NOT NULL CHECK (predicted_away >= 0),
  points_earned INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, match_id)
);

ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own predictions" ON predictions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own predictions" ON predictions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND payment_status = 'approved')
  );

CREATE POLICY "Users can update own predictions before match" ON predictions
  FOR UPDATE USING (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM matches
      WHERE id = match_id
      AND match_date > NOW() + INTERVAL '10 minutes'
      AND status = 'scheduled'
    )
  );

CREATE POLICY "Admins can view all predictions" ON predictions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- PAYMENT RECEIPTS
-- ============================================
CREATE TABLE payment_receipts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  receipt_url TEXT NOT NULL,
  claude_analysis TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE payment_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own receipts" ON payment_receipts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own receipts" ON payment_receipts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all receipts" ON payment_receipts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update all receipts" ON payment_receipts
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-create profile on signup.
-- All new users default to role='user'. Admins are bootstrapped manually by
-- running:
--   UPDATE profiles SET role = 'admin' WHERE email = '<your-admin-email>';
-- after the admin user has signed up.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER matches_updated_at
  BEFORE UPDATE ON matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER predictions_updated_at
  BEFORE UPDATE ON predictions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- SCORING FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION calculate_points(
  predicted_home INTEGER,
  predicted_away INTEGER,
  actual_home INTEGER,
  actual_away INTEGER,
  phase TEXT
) RETURNS INTEGER AS $$
DECLARE
  multiplier INTEGER := CASE WHEN phase = 'group' THEN 1 ELSE 2 END;
  points INTEGER := 0;
  pred_diff INTEGER;
  actual_diff INTEGER;
  pred_winner TEXT;
  actual_winner TEXT;
BEGIN
  pred_diff := predicted_home - predicted_away;
  actual_diff := actual_home - actual_away;

  pred_winner := CASE
    WHEN pred_diff > 0 THEN 'home'
    WHEN pred_diff < 0 THEN 'away'
    ELSE 'draw'
  END;

  actual_winner := CASE
    WHEN actual_diff > 0 THEN 'home'
    WHEN actual_diff < 0 THEN 'away'
    ELSE 'draw'
  END;

  -- Result (winner or draw): 5 pts group / 10 elimination
  IF pred_winner = actual_winner THEN
    points := points + (5 * multiplier);
  END IF;

  -- Home team exact goals: 2 pts group / 4 elimination
  IF predicted_home = actual_home THEN
    points := points + (2 * multiplier);
  END IF;

  -- Away team exact goals: 2 pts group / 4 elimination
  IF predicted_away = actual_away THEN
    points := points + (2 * multiplier);
  END IF;

  -- Goal difference: 1 pt group / 2 elimination
  IF pred_diff = actual_diff THEN
    points := points + (1 * multiplier);
  END IF;

  RETURN points;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STANDINGS VIEW
-- ============================================
CREATE OR REPLACE VIEW standings AS
SELECT
  p.id AS user_id,
  p.full_name,
  p.created_at AS registration_date,
  COALESCE(SUM(pr.points_earned), 0) AS total_points,
  COUNT(CASE WHEN pr.points_earned = 10 OR pr.points_earned = 20 THEN 1 END) AS perfect_scores,
  COUNT(CASE WHEN pr.points_earned IN (7, 14) THEN 1 END) AS partial_scores_7,
  COUNT(CASE WHEN pr.points_earned IN (6, 12) THEN 1 END) AS partial_scores_6,
  COUNT(CASE WHEN pr.points_earned IN (5, 10) THEN 1 END) AS partial_scores_5,
  COUNT(pr.id) AS matches_predicted
FROM profiles p
LEFT JOIN predictions pr ON p.id = pr.user_id
WHERE p.payment_status = 'approved'
GROUP BY p.id, p.full_name, p.created_at
ORDER BY total_points DESC, perfect_scores DESC, partial_scores_7 DESC, registration_date ASC;

-- ============================================
-- STORAGE BUCKET
-- ============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-receipts', 'payment-receipts', false);

CREATE POLICY "Users can upload own receipts" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'payment-receipts' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own receipts" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'payment-receipts' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins can view all receipts" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'payment-receipts' AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

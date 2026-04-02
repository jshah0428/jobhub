-- Create profiles table
-- Stores identity/contact fields and professional summary per user.
-- One row per user (enforced by UNIQUE on user_id).

CREATE TABLE IF NOT EXISTS profiles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL UNIQUE,
  full_name    TEXT,
  headline     TEXT,
  location     TEXT,
  phone        TEXT,
  website      TEXT,
  linkedin_url TEXT,
  github_url   TEXT,
  summary      TEXT,
  created_at   TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at   TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS profiles_user_id_idx ON profiles (user_id);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own profile"
  ON profiles FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION set_profiles_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_profiles_updated_at();

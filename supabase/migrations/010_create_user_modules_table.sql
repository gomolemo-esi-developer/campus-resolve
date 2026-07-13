-- User Modules table for storing student module enrollments
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS user_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  module_id VARCHAR(50) NOT NULL,
  module_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE (user_id, module_id)
);

-- Enable RLS
ALTER TABLE public.user_modules ENABLE ROW LEVEL SECURITY;

-- Policy
DROP POLICY IF EXISTS "Users can manage own modules" ON public.user_modules;
CREATE POLICY "Users can manage own modules" ON public.user_modules
  FOR ALL USING (auth.uid() = user_id);

-- Index
CREATE INDEX IF NOT EXISTS idx_user_modules_user_id ON public.user_modules(user_id);
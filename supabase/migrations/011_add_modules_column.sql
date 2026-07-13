-- Add modules as JSONB array to profiles table
-- Run in Supabase SQL Editor

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS modules JSONB;

-- Example: Store array of module objects
-- UPDATE profiles SET modules = '[{"moduleId": "mod-1", "moduleName": "Module 0001"}, {"moduleId": "mod-2", "moduleName": "Module 0002"}]'::jsonb
-- WHERE id = 'specific-user-id';
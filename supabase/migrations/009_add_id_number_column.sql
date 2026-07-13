-- Add id_number column to profiles table
-- Run this in Supabase SQL Editor to add the column to existing database

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS id_number VARCHAR(50);
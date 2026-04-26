-- profiles table + RLS + trigger
-- Run in Supabase SQL Editor in two separate queries

-- === Query 1: profiles table + RLS ===

CREATE TABLE public.profiles (
  id          uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name        text NOT NULL DEFAULT '',
  company     text NOT NULL DEFAULT '',
  city        text NOT NULL DEFAULT '',
  is_admin    boolean DEFAULT false,
  is_founder  boolean DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own profile read" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Own profile update" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- === Query 2: trigger to auto-create profile on signup ===

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, company, city)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'company', ''),
    COALESCE(NEW.raw_user_meta_data->>'city', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

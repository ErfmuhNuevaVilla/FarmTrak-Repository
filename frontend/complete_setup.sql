-- Complete Database Setup for New Supabase Project
-- Run this FIRST before testing your app

-- Step 1: Drop everything to start fresh
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS public.reports;
DROP TABLE IF EXISTS public.buildings;
DROP TABLE IF EXISTS public.users;

-- Step 2: Create tables
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'worker' CHECK (role IN ('admin', 'manager', 'worker')),
  disabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.buildings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  building_id UUID REFERENCES public.buildings(id) ON DELETE SET NULL,
  report_type VARCHAR(100) NOT NULL CHECK (report_type IN ('Egg Harvest', 'Feed Usage', 'Mortality')),
  data_value DECIMAL(10,2) NOT NULL,
  submitted_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Insert sample data
INSERT INTO public.buildings (name) VALUES 
  ('Building A'),
  ('Building B'),
  ('Building C');

-- Step 4: Create trigger with proper permissions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-confirm email if column exists
  BEGIN
    UPDATE auth.users 
    SET email_confirmed_at = NOW() 
    WHERE id = NEW.id AND email_confirmed_at IS NULL;
  EXCEPTION WHEN undefined_column THEN
    -- Column doesn't exist, skip confirmation
  END;
  
  -- Create user profile
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'worker')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 6: Enable RLS with permissive policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS policies
CREATE POLICY "Allow all operations on users" ON public.users FOR ALL USING (true);
CREATE POLICY "Allow all operations on buildings" ON public.buildings FOR ALL USING (true);
CREATE POLICY "Allow all operations on reports" ON public.reports FOR ALL USING (true);

-- Step 8: Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.buildings TO authenticated, anon;
GRANT ALL ON public.reports TO authenticated;

-- Step 9: Verify setup
SELECT '=== SETUP COMPLETE ===' as status;
SELECT (SELECT COUNT(*) FROM public.buildings) as buildings_created;
SELECT (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('users', 'buildings', 'reports')) as tables_created;

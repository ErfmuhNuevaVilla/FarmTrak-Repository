# Supabase Setup Guide

This guide will help you set up FarmTrak to work with Supabase instead of localhost.

## Prerequisites

- A Supabase account (free tier is sufficient)
- Node.js and npm installed

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - **Project Name**: `farmtrak` (or your preferred name)
   - **Database Password**: Choose a strong password
   - **Region**: Choose the closest region to your users
6. Click "Create new project"
7. Wait for the project to be created (2-3 minutes)

## Step 2: Get Your Supabase Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **anon public**: `eyJ...` (starts with `eyJ`)

## Step 3: Set Up Environment Variables

1. Create a `.env` file in the `frontend` directory:
   ```bash
   touch frontend/.env
   ```

2. Add your Supabase credentials to the `.env` file:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here
   ```

3. Replace the values with your actual Supabase credentials

## Step 4: Install Dependencies

```bash
cd frontend
npm install
```

This will install the new Supabase client library.

## Step 5: Set Up Database Tables

You need to create the following tables in your Supabase database:

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'worker' CHECK (role IN ('admin', 'manager', 'worker')),
  disabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Buildings Table
```sql
CREATE TABLE buildings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Reports Table
```sql
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  building_id UUID REFERENCES buildings(id),
  report_type VARCHAR(100) NOT NULL CHECK (report_type IN ('Egg Harvest', 'Feed Usage', 'Mortality')),
  data_value DECIMAL(10,2) NOT NULL,
  submitted_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Auth Users Trigger (to sync auth.users with our users table)
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', new.email),
    COALESCE(new.raw_user_meta_data->>'role', 'worker')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## Step 6: Set Up Row Level Security (RLS)

Enable RLS on your tables:

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Users can only see their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Anyone can view buildings
CREATE POLICY "Anyone can view buildings" ON buildings
  FOR SELECT USING (true);

-- Users can view all reports
CREATE POLICY "Anyone can view reports" ON reports
  FOR SELECT USING (true);

-- Users can insert reports
CREATE POLICY "Users can insert reports" ON reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update own reports
CREATE POLICY "Users can update own reports" ON reports
  FOR UPDATE USING (auth.uid() = user_id);
```

## Step 7: Run the Application

```bash
npm run dev
```

Your FarmTrak application should now be running with Supabase as the backend!

## Step 8: Test the Application

1. Open your browser to `http://localhost:5173`
2. Try registering a new user
3. Try logging in
4. Test all features (reports, user management, etc.)

## Troubleshooting

### Common Issues

1. **"Invalid JWT" error**
   - Make sure your `.env` file has the correct Supabase URL and anon key
   - Restart your development server after changing environment variables

2. **"Permission denied" errors**
   - Check that RLS policies are set up correctly
   - Ensure the user is properly authenticated

3. **"Table not found" errors**
   - Make sure you created all the required tables in Supabase
   - Check that table names match exactly (case-sensitive)

### Getting Help

- Check the browser console for detailed error messages
- Verify your Supabase project settings
- Ensure all environment variables are correctly set

## Migration from Localhost

The code has been updated to work with Supabase while maintaining backward compatibility. Key changes:

1. **Authentication**: Now uses Supabase Auth instead of custom auth endpoints
2. **API Calls**: Automatically converts `/api/` endpoints to Supabase REST format
3. **Database**: Uses Supabase PostgreSQL instead of local database
4. **File Storage**: Can be easily added using Supabase Storage

All existing features should work without any code changes in the components!

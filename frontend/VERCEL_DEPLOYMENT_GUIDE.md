# FarmTrak Vercel Deployment Guide

## 🚀 Pre-Deployment Checklist

### ✅ 1. Environment Variables
Add these to your Vercel project settings:

```
VITE_SUPABASE_URL=https://lwmlbjjcpulrigpcugha.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3bWxiampjcHVscmlncGN1Z2hhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMjcyNzgsImV4cCI6MjA4NTcwMzI3OH0.zideXrPx-Hr0u_wV4I7kXKNXHKoiPRzJKbjnEH_WJ20
```

### ✅ 2. Build Configuration
Your `package.json` is ready with:
- ✅ `"build": "vite build"` - Correct build script
- ✅ `"type": "module"` - Modern module system
- ✅ All dependencies installed

### ✅ 3. Vercel Configuration
Create `vercel.json` in root:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": "vite"
}
```

## 📋 Step-by-Step Deployment

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

### Step 2: Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Add environment variables (see above)
5. Click "Deploy"

### Step 3: Post-Deployment Setup
1. **Test the application** - All features should work
2. **Check Supabase CORS** - Add your Vercel URL to Supabase CORS settings
3. **Update redirects** - Set up any custom domains if needed

## 🔧 Supabase Configuration

### Add Vercel URL to CORS
In your Supabase project:
1. Go to Settings → API
2. Add your Vercel URL to "Additional Origins"
3. Example: `https://your-app.vercel.app`

### Verify RLS Policies
Make sure these policies exist in Supabase:
```sql
CREATE POLICY "Allow all operations on users" ON public.users FOR ALL USING (true);
CREATE POLICY "Allow all operations on buildings" ON public.buildings FOR ALL USING (true);
CREATE POLICY "Allow all operations on reports" ON public.reports FOR ALL USING (true);
```

## 🚨 Common Issues & Solutions

### Issue 1: Environment Variables Not Working
**Solution**: Ensure variables start with `VITE_` prefix for Vite

### Issue 2: Supabase Connection Failed
**Solution**: Add Vercel URL to Supabase CORS settings

### Issue 3: Build Fails
**Solution**: Check all dependencies are in package.json

### Issue 4: 404 Errors on Navigation
**Solution**: Vite Router needs catch-all routing (handled automatically by Vercel)

## 🎯 Production Optimizations

Your app is already optimized with:
- ✅ React 19.2.0 (latest)
- ✅ Vite 7.2.4 (fast builds)
- ✅ TailwindCSS 4.1.18 (optimized CSS)
- ✅ Proper build configuration

## 📱 Testing After Deployment

Test these features:
1. ✅ User authentication (login/register)
2. ✅ Dashboard loading
3. ✅ Data entry (Harvest, Feed, Mortality)
4. ✅ Excel export functionality
5. ✅ Building management
6. ✅ Reports viewing

## 🔄 CI/CD Setup

Vercel automatically:
- ✅ Builds on every push to main
- ✅ Deploys successful builds
- ✅ Provides preview URLs for PRs
- ✅ Handles rollbacks

## 🌐 Custom Domain (Optional)

1. In Vercel dashboard → Settings → Domains
2. Add your custom domain
3. Update DNS records
4. Add custom domain to Supabase CORS

---

## 🎉 You're Ready!

Your FarmTrak application is fully prepared for Vercel deployment with:
- ✅ Modern React setup
- ✅ Supabase integration
- ✅ Responsive design
- ✅ Excel export functionality
- ✅ Authentication system
- ✅ Complete CRUD operations

Deploy with confidence! 🚀

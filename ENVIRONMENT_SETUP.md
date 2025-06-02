# Environment Setup Guide

## 🚀 Quick Setup

Your PrepPen Pilot application is now **build-ready** but needs proper environment variables to connect to your database and services.

## 📋 Required Environment Variables

### 1. Supabase Configuration (Required for Database)

You need to set up a Supabase project and get your credentials:

1. **Go to [Supabase](https://supabase.com)** and create a new project
2. **Get your Project URL and API Keys** from Settings > API
3. **Update your `.env` file** with real values:

```bash
# Replace these placeholder values in your .env file:
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Backend variables (same values):
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### 2. Database Schema Setup

After setting up Supabase, run this SQL in your Supabase SQL Editor:

```sql
-- Use the complete_schema.sql file in your project root
-- Or run the quick_add_syllabus.sql for basic categories
```

### 3. OpenAI Configuration (Optional - for AI features)

```bash
OPENAI_API_KEY=your-openai-api-key-here
```

## 🔧 Current Status

✅ **Build System** - Working perfectly  
✅ **All Functions** - Deployed and configured  
✅ **Frontend** - No runtime errors  
✅ **API Routing** - Unified and consistent  
⚠️ **Database** - Needs your Supabase credentials  
⚠️ **AI Features** - Needs OpenAI API key  

## 🛠️ Setup Steps

### Step 1: Create Supabase Project
1. Visit [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for it to be ready (2-3 minutes)

### Step 2: Get Your Credentials
1. Go to Settings > API in your Supabase dashboard
2. Copy your Project URL
3. Copy your `anon` key
4. Copy your `service_role` key

### Step 3: Update Environment Variables
1. Open your `.env` file
2. Replace the placeholder values:
   ```bash
   VITE_SUPABASE_URL=https://your-actual-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-actual-anon-key
   SUPABASE_URL=https://your-actual-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key
   ```

### Step 4: Set Up Database Schema
1. Go to SQL Editor in your Supabase dashboard
2. Copy and paste the contents of `complete_schema.sql`
3. Run the query to create all tables

### Step 5: Add Sample Categories (Optional)
1. Run the `quick_add_syllabus.sql` script
2. This adds basic categories like "Books", "Notes", "Videos", etc.

### Step 6: Test Your Setup
1. Run `npm run dev` or `netlify dev`
2. Visit the debug endpoint: `/api/debug/categories`
3. You should see database connection success

## 🔍 Debugging

### Check Environment Variables
Visit: `http://localhost:8080/api/test/frontend-config`

This will show you:
- Which environment variables are loaded
- Database connection status
- API endpoint availability

### Check Database Connection
Visit: `http://localhost:8080/api/debug/categories`

This will show you:
- Database connection status
- Table existence
- Sample data count

## 🚨 Common Issues

### "Invalid URL" Error
- **Cause**: Supabase URL is not set or invalid
- **Fix**: Ensure `VITE_SUPABASE_URL` starts with `https://` and ends with `.supabase.co`

### "Database query failed" Error
- **Cause**: Database schema not set up
- **Fix**: Run the `complete_schema.sql` in Supabase SQL Editor

### "No categories found" Warning
- **Cause**: Database is empty
- **Fix**: Run the `quick_add_syllabus.sql` script

## 🎯 Production Deployment

For Netlify deployment, add these environment variables in your Netlify dashboard:

1. Go to Site Settings > Environment Variables
2. Add each variable from your `.env` file
3. Deploy your site

**Important**: Never commit your `.env` file with real credentials!

## ✅ Verification Checklist

- [ ] Supabase project created
- [ ] Environment variables updated in `.env`
- [ ] Database schema deployed
- [ ] Sample categories added
- [ ] Local development server running
- [ ] Debug endpoints returning success
- [ ] No console errors in browser

## 🎉 You're Ready!

Once you've completed these steps, your PrepPen Pilot application will be fully functional with:

- ✅ File upload and storage
- ✅ Knowledge base management
- ✅ AI chat capabilities
- ✅ Folder organization
- ✅ Compression analytics
- ✅ Search and filtering

Happy coding! 🚀 
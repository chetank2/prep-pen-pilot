# Environment Configuration Guide

## Overview
This project uses a unified environment configuration strategy that works for both local development and Netlify deployment.

## Environment Files Structure

### Local Development
- **File**: `.env` (single file for all local config)
- **Purpose**: Contains all environment variables for local development
- **Location**: Project root directory

### Production (Netlify)
- **File**: None (uses Netlify environment variables)
- **Purpose**: Environment variables set in Netlify dashboard
- **Location**: Netlify site settings

## Required Environment Variables

### Frontend Variables (VITE_*)
These are used by the React frontend and must start with `VITE_`:

```bash
# Supabase Configuration (Frontend)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# API Configuration (Frontend)
VITE_API_URL=http://localhost:3001/api  # Local only
```

### Backend Variables
These are used by the Express backend and Netlify functions:

```bash
# Supabase Configuration (Backend)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Server Configuration
PORT=3001
NODE_ENV=development
```

## Configuration by Environment

### 🏠 Local Development (.env file)
```bash
# Frontend Environment Variables
VITE_SUPABASE_URL=https://rcyweajmkkkhtfvzscey.supabase.co
VITE_SUPABASE_ANON_KEY=your_real_anon_key_here
VITE_API_URL=http://localhost:3001/api

# Backend Environment Variables
SUPABASE_URL=https://rcyweajmkkkhtfvzscey.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_real_service_role_key_here

# OpenAI Configuration
OPENAI_API_KEY=your_real_openai_key_here

# Server Configuration
PORT=3001
NODE_ENV=development

# Feature Flags
ENABLE_COMPRESSION=true
ENABLE_AI_ANALYSIS=true
ENABLE_REAL_TIME_CHAT=true
```

### 🌐 Netlify Production (Dashboard Settings)
Set these in Netlify Dashboard → Site Settings → Environment Variables:

```bash
# Frontend (Build-time variables)
VITE_SUPABASE_URL=https://rcyweajmkkkhtfvzscey.supabase.co
VITE_SUPABASE_ANON_KEY=your_real_anon_key_here
# Note: VITE_API_URL is NOT needed - uses /api redirects

# Backend (Function runtime variables)
SUPABASE_URL=https://rcyweajmkkkhtfvzscey.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_real_service_role_key_here
OPENAI_API_KEY=your_real_openai_key_here
NODE_ENV=production
```

## How It Works

### Local Development Flow
1. Frontend runs on `http://localhost:8080` (or assigned port)
2. Backend runs on `http://localhost:3001`
3. Frontend uses `VITE_API_URL=http://localhost:3001/api`
4. Direct API calls to Express server

### Production Flow
1. Frontend builds and deploys to Netlify
2. No backend server - uses Netlify Functions
3. Frontend uses `/api/*` paths (no VITE_API_URL needed)
4. Netlify redirects `/api/*` to `/.netlify/functions/*`

## Setup Instructions

### Step 1: Local .env File
1. Copy your existing `.env` file
2. Replace placeholder values with real credentials:

```bash
# Replace these placeholder values:
VITE_SUPABASE_URL=https://rcyweajmkkkhtfvzscey.supabase.co
VITE_SUPABASE_ANON_KEY=your_real_anon_key_here
SUPABASE_URL=https://rcyweajmkkkhtfvzscey.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_real_service_role_key_here
OPENAI_API_KEY=your_real_openai_key_here
```

### Step 2: Netlify Environment Variables
1. Go to Netlify Dashboard
2. Select your site
3. Go to Site Settings → Environment Variables
4. Add the same variables (except VITE_API_URL)

## Key Differences by Environment

| Variable | Local Development | Netlify Production |
|----------|------------------|-------------------|
| `VITE_API_URL` | `http://localhost:3001/api` | Not needed (uses redirects) |
| `NODE_ENV` | `development` | `production` |
| API Routing | Direct to Express server | Netlify Functions via redirects |

## Security Notes

1. **Never commit `.env` to git** - it's in `.gitignore`
2. **Frontend variables are public** - anything with `VITE_` is visible in browser
3. **Backend variables are private** - only accessible to server/functions
4. **Use service role key only in backend** - never in frontend

## Troubleshooting

### Common Issues
1. **CORS errors**: Check `VITE_API_URL` points to correct backend
2. **Supabase errors**: Verify URL format and key validity
3. **Function errors**: Check Netlify environment variables are set
4. **Build errors**: Ensure all `VITE_*` variables are set for build

### Testing Configuration
```bash
# Test local backend
curl http://localhost:3001/health

# Test frontend config
console.log(import.meta.env.VITE_SUPABASE_URL)

# Test Netlify functions
curl https://your-site.netlify.app/api/debug/categories
```

## Migration from Current Setup

If you're updating from a different configuration:

1. **Backup current .env**: `cp .env .env.backup`
2. **Update .env with new structure** (see template above)
3. **Set Netlify environment variables** in dashboard
4. **Test locally**: `npm run dev`
5. **Deploy and test**: Push to trigger Netlify build

## Environment Variable Template

Copy this template to your `.env` file and replace with real values:

```bash
# Frontend Environment Variables
VITE_SUPABASE_URL=https://rcyweajmkkkhtfvzscey.supabase.co
VITE_SUPABASE_ANON_KEY=your_real_anon_key_here
VITE_API_URL=http://localhost:3001/api

# Backend Environment Variables
SUPABASE_URL=https://rcyweajmkkkhtfvzscey.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_real_service_role_key_here

# OpenAI Configuration
OPENAI_API_KEY=your_real_openai_key_here

# Server Configuration
PORT=3001
NODE_ENV=development

# File Upload Configuration
MAX_FILE_SIZE=100MB
ALLOWED_FILE_TYPES=pdf,doc,docx,txt,jpg,jpeg,png,gif,mp4,mp3,wav

# Feature Flags
ENABLE_COMPRESSION=true
ENABLE_AI_ANALYSIS=true
ENABLE_VECTOR_SEARCH=false
ENABLE_REAL_TIME_CHAT=true
ENABLE_APPLE_PENCIL=true

# Development Settings
DEBUG_MODE=false
MOCK_AI_RESPONSES=false
SKIP_FILE_VALIDATION=false
```

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
VITE_SUPABASE_URL=https://rcyweajmkkkhtfvzscey.supabase.co
VITE_SUPABASE_ANON_KEY=your_real_anon_key_here

# Backend variables (same values):
SUPABASE_URL=https://rcyweajmkkkhtfvzscey.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_real_service_role_key_here
```

### 2. Database Schema Setup

After setting up Supabase, run this SQL in your Supabase SQL Editor:

```sql
-- Use the complete_schema.sql file in your project root
-- Or run the quick_add_syllabus.sql for basic categories
```

### 3. OpenAI Configuration (Optional - for AI features)

```bash
OPENAI_API_KEY=your_real_openai_key_here
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
   VITE_SUPABASE_URL=https://rcyweajmkkkhtfvzscey.supabase.co
   VITE_SUPABASE_ANON_KEY=your_real_anon_key_here
   SUPABASE_URL=https://rcyweajmkkkhtfvzscey.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_real_service_role_key_here
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
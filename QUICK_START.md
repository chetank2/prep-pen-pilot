# 🚀 Quick Start Guide - Enhanced Knowledge Base

## ⚡ Get Started in 5 Minutes

### 1. Run the Setup Script
```bash
./setup.sh
```

### 2. Configure Environment (Required)

#### Frontend (.env)
```bash
# Replace with your actual Supabase credentials
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_API_BASE_URL=http://localhost:3001/api
```

#### Backend (backend/.env)
```bash
# Replace with your actual credentials
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Set Up Supabase Database

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the schema file: `supabase_enhanced_schema.sql`
4. Create storage buckets:

```sql
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
('knowledge-files', 'knowledge-files', false),
('compressed-files', 'compressed-files', false);

-- Set up storage policies
CREATE POLICY "Users can upload files" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'knowledge-files');

CREATE POLICY "Users can view their files" ON storage.objects
FOR SELECT USING (bucket_id = 'knowledge-files');
```

### 4. Start Development Servers

#### Terminal 1 - Backend
```bash
cd backend
npm run dev
```

#### Terminal 2 - Frontend
```bash
npm run dev
```

### 5. Access Your Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## 🧪 Test the System

### Upload Test
1. Navigate to http://localhost:5173
2. Click "Upload File"
3. Upload a PDF or text file
4. Check compression statistics
5. Verify AI processing

### Chat Test
1. Go to the "AI Chat" tab
2. Ask: "What files do I have?"
3. Test content generation
4. Verify knowledge base integration

## 🔧 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Kill processes on ports
lsof -ti:3001 | xargs kill -9  # Backend
lsof -ti:5173 | xargs kill -9  # Frontend
```

#### Environment Variables Not Loading
- Restart development servers after updating .env files
- Check for typos in variable names
- Ensure no spaces around = in .env files

#### Database Connection Issues
- Verify Supabase URL and keys
- Check if schema has been applied
- Ensure storage buckets are created

#### File Upload Issues
- Check backend logs for errors
- Verify file size limits (100MB default)
- Ensure uploads directory exists

## 📊 System Status Check

### Backend Health
```bash
curl http://localhost:3001/health
```

### Frontend Status
```bash
curl http://localhost:5173
```

### Database Connection
Check Supabase dashboard for active connections

## 🎯 Next Steps After Setup

1. **Upload Test Files**
   - Try different file types (PDF, images, text)
   - Test compression efficiency
   - Verify AI processing

2. **Explore Features**
   - File organization with categories
   - AI chat with knowledge base context
   - Compression analytics dashboard
   - Real-time file management

3. **Customize**
   - Add custom categories
   - Configure AI prompts
   - Adjust compression settings
   - Implement Apple Pencil integration

## 📚 Documentation

- **Full Guide**: `NEXT_STEPS_GUIDE.md`
- **Implementation**: `IMPLEMENTATION_GUIDE.md`
- **Database Schema**: `supabase_enhanced_schema.sql`

## 🆘 Need Help?

1. Check the logs:
   - Backend: Console output
   - Frontend: Browser developer tools
   - Database: Supabase dashboard

2. Common solutions:
   - Restart servers
   - Clear browser cache
   - Check environment variables
   - Verify database schema

## 🎉 Success!

Once everything is running, you'll have:
- ✅ Intelligent file compression (30-70% savings)
- ✅ AI-powered content analysis
- ✅ Interactive chat with knowledge base
- ✅ Real-time analytics dashboard
- ✅ Modern, responsive interface

Your Enhanced Knowledge Base is now ready to revolutionize how you store and interact with educational content! 
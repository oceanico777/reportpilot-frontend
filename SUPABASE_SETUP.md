# Supabase Integration Guide

## Setup Instructions

### 1. Create a Supabase Project
1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Create a new project
4. Wait for the project to be provisioned

### 2. Get Your Credentials
1. In your Supabase dashboard, go to **Settings** > **API**
2. Copy the following:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

### 3. Configure Frontend
1. Create a `.env.local` file in the `frontend/` directory
2. Add your credentials:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Configure Backend
1. In your Supabase dashboard, go to **Settings** > **Database**
2. Copy the **Connection String** (URI format)
3. Update `backend/.env` or set the environment variable:
```env
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
```

### 5. Run Database Migrations
The backend will automatically create tables on startup using SQLAlchemy.

### 6. Test the Connection
- Start the backend: `python -m uvicorn app.main:app --reload`
- Start the frontend: `npm run dev`
- Try creating a new report to test the database connection

## Features Enabled
- ✅ PostgreSQL database (instead of SQLite)
- ✅ User authentication (ready to implement)
- ✅ Real-time subscriptions (optional)
- ✅ File storage for receipts/reports
- ✅ Row Level Security (RLS) for data protection

## Next Steps
1. Implement authentication with Supabase Auth
2. Add file upload to Supabase Storage
3. Enable real-time updates for report status

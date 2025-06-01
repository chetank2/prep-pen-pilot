-- BULLETPROOF SCHEMA - Step by Step with No Dependencies
-- This will work 100% without any errors

-- Step 1: Enable UUID extension (safe to run multiple times)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 2: Drop everything that might exist (ignore errors)
DO $$ 
BEGIN
    -- Drop tables in dependency order
    EXECUTE 'DROP TABLE IF EXISTS chat_messages CASCADE';
    EXECUTE 'DROP TABLE IF EXISTS chat_sessions CASCADE';
    EXECUTE 'DROP TABLE IF EXISTS folders CASCADE';
    
    -- Drop any leftover objects
    EXECUTE 'DROP VIEW IF EXISTS folder_stats CASCADE';
    EXECUTE 'DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE';
EXCEPTION 
    WHEN OTHERS THEN
        NULL; -- Ignore all errors during cleanup
END $$;

-- Step 3: Create folders table (NO foreign keys yet)
CREATE TABLE folders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6',
    icon VARCHAR(50) DEFAULT 'folder',
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create chat_sessions table (NO foreign keys yet)
CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL DEFAULT 'New Chat',
    folder_id UUID, -- Just UUID, no foreign key constraint yet
    context_type VARCHAR(50) DEFAULT 'general',
    context_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: Create chat_messages table (NO foreign keys yet)
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL, -- Just UUID, no foreign key constraint yet
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    attachments JSONB DEFAULT '[]',
    context_used JSONB DEFAULT '{}',
    processing_status VARCHAR(20) DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 6: Now add foreign key constraints (all tables exist)
ALTER TABLE chat_sessions 
ADD CONSTRAINT fk_chat_sessions_folder 
FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL;

ALTER TABLE chat_messages 
ADD CONSTRAINT fk_chat_messages_session 
FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE;

-- Step 7: Create indexes
CREATE INDEX idx_folders_user_id ON folders(user_id);
CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_folder_id ON chat_sessions(folder_id);
CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);

-- Step 8: Create trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 9: Add triggers
CREATE TRIGGER update_folders_updated_at 
    BEFORE UPDATE ON folders 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_sessions_updated_at 
    BEFORE UPDATE ON chat_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 10: Insert demo data
INSERT INTO folders (id, user_id, name, description, color, icon, position) VALUES
    ('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440000', 'UPSC Preparation', 'Main UPSC study materials and notes', '#3B82F6', 'graduation-cap', 1),
    ('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440000', 'History', 'Ancient, Medieval and Modern History', '#F59E0B', 'scroll', 2),
    ('550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440000', 'Geography', 'Physical and Human Geography', '#84CC16', 'map', 3),
    ('550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440000', 'Polity', 'Indian Constitution and Governance', '#EC4899', 'balance-scale', 4),
    ('550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440000', 'Economics', 'Economic Survey and Budget Analysis', '#06B6D4', 'trending-up', 5);

-- Step 11: Disable RLS for development
ALTER TABLE folders DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;

-- Step 12: Success message
DO $$ 
BEGIN
    RAISE NOTICE 'SUCCESS: Database schema created successfully with % folders', (SELECT COUNT(*) FROM folders);
END $$; 
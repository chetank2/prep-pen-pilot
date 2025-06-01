-- Complete Knowledge Base Schema for Supabase
-- This creates all tables from scratch without dependencies

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (optional, for future use with Supabase Auth)
-- Note: In production, this would reference auth.users

-- Categories table for organizing content (simplified without self-reference)
CREATE TABLE IF NOT EXISTS knowledge_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(100) DEFAULT 'folder',
    color VARCHAR(7) DEFAULT '#3B82F6',
    is_default BOOLEAN DEFAULT FALSE,
    is_custom BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_category_name UNIQUE(name)
);

-- Folders table for organizing content
CREATE TABLE IF NOT EXISTS folders (
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

-- Knowledge items table
CREATE TABLE IF NOT EXISTS knowledge_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    category_id UUID REFERENCES knowledge_categories(id),
    folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    
    -- File information
    file_type VARCHAR(50) NOT NULL CHECK (file_type IN ('pdf', 'video', 'audio', 'image', 'text', 'url')),
    file_path TEXT,
    original_file_path TEXT,
    file_name VARCHAR(255),
    file_size BIGINT,
    compressed_size BIGINT,
    mime_type VARCHAR(100),
    
    -- Content and AI processing
    extracted_text TEXT,
    summary TEXT,
    key_points JSONB,
    ai_analysis JSONB,
    
    -- Enhanced metadata
    metadata JSONB DEFAULT '{}',
    custom_category_type VARCHAR(100),
    
    -- Compression metadata
    compression_metadata JSONB DEFAULT '{}',
    
    -- Processing status
    processing_status VARCHAR(20) DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    processing_error TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL DEFAULT 'New Chat',
    folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
    context_type VARCHAR(50) DEFAULT 'general',
    context_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    attachments JSONB DEFAULT '[]',
    generated_content_ids UUID[] DEFAULT '{}',
    context_used JSONB DEFAULT '{}',
    processing_status VARCHAR(20) DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generated content table (for AI-generated content like mindmaps, notes, etc.)
CREATE TABLE IF NOT EXISTS generated_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    knowledge_item_id UUID REFERENCES knowledge_items(id) ON DELETE CASCADE,
    folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
    chat_message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
    content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('mindmap', 'notes', 'summary', 'chart', 'flashcards', 'quiz', 'annotation')),
    title VARCHAR(500),
    user_title VARCHAR(255),
    content_data JSONB NOT NULL DEFAULT '{}',
    canvas_data JSONB,
    prompt_used TEXT,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Folder contents junction table
CREATE TABLE IF NOT EXISTS folder_contents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,
    content_id UUID NOT NULL,
    content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('knowledge_item', 'generated_content', 'chat_session')),
    position INTEGER DEFAULT 0,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(folder_id, content_id, content_type)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_items_user_id ON knowledge_items(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_items_category_id ON knowledge_items(category_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_items_folder_id ON knowledge_items(folder_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_items_processing_status ON knowledge_items(processing_status);
CREATE INDEX IF NOT EXISTS idx_generated_content_knowledge_item ON generated_content(knowledge_item_id);
CREATE INDEX IF NOT EXISTS idx_generated_content_folder_id ON generated_content(folder_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_folder_id ON chat_sessions(folder_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_folder_contents_folder_id ON folder_contents(folder_id);
CREATE INDEX IF NOT EXISTS idx_folder_contents_content ON folder_contents(content_id, content_type);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_knowledge_categories_updated_at BEFORE UPDATE ON knowledge_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_folders_updated_at BEFORE UPDATE ON folders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_knowledge_items_updated_at BEFORE UPDATE ON knowledge_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_generated_content_updated_at BEFORE UPDATE ON generated_content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chat_sessions_updated_at BEFORE UPDATE ON chat_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default categories
INSERT INTO knowledge_categories (id, name, description, icon, color, is_default, is_custom) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'Books', 'Academic and reference books', 'book', '#3B82F6', TRUE, FALSE),
    ('550e8400-e29b-41d4-a716-446655440002', 'Standard Books', 'Curriculum and standard textbooks', 'book-open', '#10B981', TRUE, FALSE),
    ('550e8400-e29b-41d4-a716-446655440003', 'Articles', 'Research papers and articles', 'file-text', '#F59E0B', TRUE, FALSE),
    ('550e8400-e29b-41d4-a716-446655440004', 'Syllabus', 'Course syllabi and curricula', 'list', '#8B5CF6', TRUE, FALSE),
    ('550e8400-e29b-41d4-a716-446655440005', 'Question Papers', 'Past exam papers and questions', 'help-circle', '#EF4444', TRUE, FALSE),
    ('550e8400-e29b-41d4-a716-446655440006', 'Notes', 'Personal and study notes', 'edit', '#06B6D4', TRUE, FALSE),
    ('550e8400-e29b-41d4-a716-446655440007', 'Videos', 'Educational videos and lectures', 'video', '#EC4899', TRUE, FALSE),
    ('550e8400-e29b-41d4-a716-446655440008', 'Images', 'Diagrams, charts, and images', 'image', '#84CC16', TRUE, FALSE)
ON CONFLICT (id) DO NOTHING;

-- Insert default folders for demo
INSERT INTO folders (id, user_id, name, description, color, icon, position) VALUES
    ('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440000', 'UPSC Preparation', 'Main UPSC study materials and notes', '#3B82F6', 'graduation-cap', 1),
    ('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440000', 'History', 'Ancient, Medieval and Modern History', '#F59E0B', 'scroll', 2),
    ('550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440000', 'Geography', 'Physical and Human Geography', '#84CC16', 'map', 3),
    ('550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440000', 'Polity', 'Indian Constitution and Governance', '#EC4899', 'balance-scale', 4),
    ('550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440000', 'Economics', 'Economic Survey and Budget Analysis', '#06B6D4', 'trending-up', 5)
ON CONFLICT (id) DO NOTHING;

-- Disable RLS for development (enable in production)
ALTER TABLE knowledge_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE folders DISABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE generated_content DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE folder_contents DISABLE ROW LEVEL SECURITY;

-- Create helpful views
CREATE OR REPLACE VIEW folder_stats AS
SELECT 
    f.id,
    f.name,
    COUNT(DISTINCT CASE WHEN fc.content_type = 'knowledge_item' THEN fc.content_id END) as knowledge_items_count,
    COUNT(DISTINCT CASE WHEN fc.content_type = 'generated_content' THEN fc.content_id END) as generated_content_count,
    COUNT(DISTINCT CASE WHEN fc.content_type = 'chat_session' THEN fc.content_id END) as chat_sessions_count,
    f.updated_at as last_updated
FROM folders f
LEFT JOIN folder_contents fc ON f.id = fc.folder_id
GROUP BY f.id, f.name, f.updated_at;

CREATE OR REPLACE VIEW chat_session_summary AS
SELECT 
    cs.id,
    cs.title,
    cs.folder_id,
    f.name as folder_name,
    COUNT(cm.id) as message_count,
    MAX(cm.created_at) as last_message_at,
    cs.created_at,
    cs.updated_at
FROM chat_sessions cs
LEFT JOIN folders f ON cs.folder_id = f.id
LEFT JOIN chat_messages cm ON cs.id = cm.session_id
GROUP BY cs.id, cs.title, cs.folder_id, f.name, cs.created_at, cs.updated_at;

-- Comments for documentation
COMMENT ON TABLE folders IS 'User-created folders for organizing knowledge base content';
COMMENT ON TABLE knowledge_categories IS 'Categories for classifying knowledge items';
COMMENT ON TABLE knowledge_items IS 'Uploaded files and content items with AI processing';
COMMENT ON TABLE generated_content IS 'AI-generated content like summaries, mindmaps, etc.';
COMMENT ON TABLE chat_sessions IS 'AI chat conversations with context and folder association';
COMMENT ON TABLE chat_messages IS 'Individual messages within chat sessions';
COMMENT ON TABLE folder_contents IS 'Junction table linking content to folders'; 
-- Enhanced Knowledge Base Schema for Supabase
-- This schema supports compression, dynamic categories, AI processing, and chat functionality

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector"; -- For future vector search capabilities
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Knowledge Categories Table (Enhanced with dynamic categories)
CREATE TABLE knowledge_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(100) DEFAULT 'folder',
    color VARCHAR(7) DEFAULT '#3B82F6', -- Hex color code
    is_default BOOLEAN DEFAULT FALSE,
    is_custom BOOLEAN DEFAULT TRUE,
    parent_id UUID REFERENCES knowledge_categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_category_name UNIQUE(name),
    CONSTRAINT valid_color_format CHECK (color ~ '^#[0-9A-Fa-f]{6}$')
);

-- Knowledge Items Table (Enhanced with compression metadata)
CREATE TABLE knowledge_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL, -- Will be linked to auth.users in production
    category_id UUID NOT NULL REFERENCES knowledge_categories(id) ON DELETE RESTRICT,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    
    -- File information
    file_path TEXT, -- Path to compressed file in storage
    original_file_path TEXT, -- Path to original file (if preserved)
    file_name VARCHAR(500),
    file_size BIGINT, -- Original file size in bytes
    compressed_size BIGINT, -- Compressed file size in bytes
    file_type VARCHAR(50),
    mime_type VARCHAR(100),
    
    -- Content and AI processing
    extracted_text TEXT, -- Text extracted from file for AI processing
    summary TEXT, -- AI-generated summary
    key_points JSONB, -- Array of key points
    ai_analysis JSONB, -- AI analysis results
    embeddings VECTOR(1536), -- OpenAI embeddings for semantic search
    
    -- Enhanced metadata
    metadata JSONB DEFAULT '{}', -- Flexible metadata storage
    custom_category_type VARCHAR(255), -- User-defined category type
    
    -- Compression metadata
    compression_metadata JSONB DEFAULT '{}', -- Compression details
    
    -- Processing status
    processing_status VARCHAR(20) DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    processing_error TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for better performance
    CONSTRAINT valid_file_size CHECK (file_size >= 0),
    CONSTRAINT valid_compressed_size CHECK (compressed_size >= 0)
);

-- User Generated Content Table (for mindmaps, notes, summaries, etc.)
CREATE TABLE user_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    knowledge_item_id UUID NOT NULL REFERENCES knowledge_items(id) ON DELETE CASCADE,
    content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('mindmap', 'notes', 'summary', 'chart', 'flashcards', 'quiz', 'annotation')),
    title VARCHAR(500),
    content_data JSONB NOT NULL DEFAULT '{}', -- Flexible content storage
    canvas_data JSONB, -- For Apple Pencil annotations and drawings
    prompt_used TEXT, -- The prompt used to generate this content
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat Conversations Table
CREATE TABLE chat_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL, -- Will be linked to auth.users in production
    title VARCHAR(500) DEFAULT 'New Conversation',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat Messages Table
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    referenced_items JSONB DEFAULT '[]', -- Array of knowledge_item IDs referenced
    context_used JSONB, -- What context was used for this response
    generated_content JSONB, -- Any content generated as part of this message
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_knowledge_items_user_id ON knowledge_items(user_id);
CREATE INDEX idx_knowledge_items_category_id ON knowledge_items(category_id);
CREATE INDEX idx_knowledge_items_processing_status ON knowledge_items(processing_status);
CREATE INDEX idx_knowledge_items_created_at ON knowledge_items(created_at DESC);
CREATE INDEX idx_knowledge_items_file_type ON knowledge_items(file_type);
CREATE INDEX idx_knowledge_items_custom_category ON knowledge_items(custom_category_type);

-- Metadata indexes for filtering
CREATE INDEX idx_knowledge_items_metadata_subject ON knowledge_items USING GIN ((metadata->>'subject'));
CREATE INDEX idx_knowledge_items_metadata_tags ON knowledge_items USING GIN ((metadata->'tags'));
CREATE INDEX idx_knowledge_items_metadata_difficulty ON knowledge_items USING GIN ((metadata->>'difficulty_level'));

-- Full-text search indexes
CREATE INDEX idx_knowledge_items_title_search ON knowledge_items USING GIN (to_tsvector('english', title));
CREATE INDEX idx_knowledge_items_text_search ON knowledge_items USING GIN (to_tsvector('english', extracted_text));

-- User content indexes
CREATE INDEX idx_user_content_knowledge_item ON user_content(knowledge_item_id);
CREATE INDEX idx_user_content_type ON user_content(content_type);
CREATE INDEX idx_user_content_created_at ON user_content(created_at DESC);

-- Chat indexes
CREATE INDEX idx_chat_conversations_user_id ON chat_conversations(user_id);
CREATE INDEX idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);

-- Category indexes
CREATE INDEX idx_knowledge_categories_parent_id ON knowledge_categories(parent_id);
CREATE INDEX idx_knowledge_categories_is_default ON knowledge_categories(is_default);

-- Insert default categories
INSERT INTO knowledge_categories (id, name, description, icon, color, is_default, is_custom) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'Books', 'Academic and reference books', 'book', '#3B82F6', TRUE, FALSE),
    ('550e8400-e29b-41d4-a716-446655440002', 'Standard Books', 'Curriculum and standard textbooks', 'book-open', '#10B981', TRUE, FALSE),
    ('550e8400-e29b-41d4-a716-446655440003', 'Articles', 'Research papers and articles', 'file-text', '#F59E0B', TRUE, FALSE),
    ('550e8400-e29b-41d4-a716-446655440004', 'Syllabus', 'Course syllabi and curricula', 'list', '#8B5CF6', TRUE, FALSE),
    ('550e8400-e29b-41d4-a716-446655440005', 'Question Papers', 'Past exam papers and questions', 'help-circle', '#EF4444', TRUE, FALSE),
    ('550e8400-e29b-41d4-a716-446655440006', 'Notes', 'Personal and study notes', 'edit', '#06B6D4', TRUE, FALSE),
    ('550e8400-e29b-41d4-a716-446655440007', 'Videos', 'Educational videos and lectures', 'video', '#EC4899', TRUE, FALSE),
    ('550e8400-e29b-41d4-a716-446655440008', 'Images', 'Diagrams, charts, and images', 'image', '#84CC16', TRUE, FALSE);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_knowledge_categories_updated_at BEFORE UPDATE ON knowledge_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_knowledge_items_updated_at BEFORE UPDATE ON knowledge_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_content_updated_at BEFORE UPDATE ON user_content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chat_conversations_updated_at BEFORE UPDATE ON chat_conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate storage savings
CREATE OR REPLACE FUNCTION calculate_storage_savings()
RETURNS TABLE (
    total_original_size BIGINT,
    total_compressed_size BIGINT,
    total_savings BIGINT,
    average_compression_ratio NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(file_size), 0) as total_original_size,
        COALESCE(SUM(compressed_size), 0) as total_compressed_size,
        COALESCE(SUM(file_size) - SUM(compressed_size), 0) as total_savings,
        CASE 
            WHEN SUM(file_size) > 0 THEN 
                ROUND(((SUM(file_size) - SUM(compressed_size))::NUMERIC / SUM(file_size)::NUMERIC) * 100, 2)
            ELSE 0
        END as average_compression_ratio
    FROM knowledge_items 
    WHERE file_size IS NOT NULL AND compressed_size IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Function for semantic search (placeholder for vector search)
CREATE OR REPLACE FUNCTION search_similar_content(
    query_embedding VECTOR(1536),
    match_threshold FLOAT DEFAULT 0.8,
    match_count INT DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    title VARCHAR(500),
    similarity FLOAT
) AS $$
BEGIN
    -- This would use vector similarity search in production
    -- For now, return empty result
    RETURN QUERY
    SELECT 
        ki.id,
        ki.title,
        0.0::FLOAT as similarity
    FROM knowledge_items ki
    WHERE FALSE; -- Placeholder - no results for now
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS) policies
-- Enable RLS on all tables
ALTER TABLE knowledge_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Categories are readable by everyone, but only admins can modify default categories
CREATE POLICY "Categories are viewable by everyone" ON knowledge_categories FOR SELECT USING (true);
CREATE POLICY "Users can create custom categories" ON knowledge_categories FOR INSERT WITH CHECK (is_custom = true);
CREATE POLICY "Users can update their custom categories" ON knowledge_categories FOR UPDATE USING (is_custom = true);
CREATE POLICY "Users can delete their custom categories" ON knowledge_categories FOR DELETE USING (is_custom = true);

-- Knowledge items are private to users
CREATE POLICY "Users can view their own knowledge items" ON knowledge_items FOR SELECT USING (user_id = auth.uid()::UUID);
CREATE POLICY "Users can create their own knowledge items" ON knowledge_items FOR INSERT WITH CHECK (user_id = auth.uid()::UUID);
CREATE POLICY "Users can update their own knowledge items" ON knowledge_items FOR UPDATE USING (user_id = auth.uid()::UUID);
CREATE POLICY "Users can delete their own knowledge items" ON knowledge_items FOR DELETE USING (user_id = auth.uid()::UUID);

-- User content follows knowledge items permissions
CREATE POLICY "Users can view content for their knowledge items" ON user_content FOR SELECT 
    USING (EXISTS (SELECT 1 FROM knowledge_items WHERE id = knowledge_item_id AND user_id = auth.uid()::UUID));
CREATE POLICY "Users can create content for their knowledge items" ON user_content FOR INSERT 
    WITH CHECK (EXISTS (SELECT 1 FROM knowledge_items WHERE id = knowledge_item_id AND user_id = auth.uid()::UUID));
CREATE POLICY "Users can update content for their knowledge items" ON user_content FOR UPDATE 
    USING (EXISTS (SELECT 1 FROM knowledge_items WHERE id = knowledge_item_id AND user_id = auth.uid()::UUID));
CREATE POLICY "Users can delete content for their knowledge items" ON user_content FOR DELETE 
    USING (EXISTS (SELECT 1 FROM knowledge_items WHERE id = knowledge_item_id AND user_id = auth.uid()::UUID));

-- Chat conversations are private to users
CREATE POLICY "Users can view their own conversations" ON chat_conversations FOR SELECT USING (user_id = auth.uid()::UUID);
CREATE POLICY "Users can create their own conversations" ON chat_conversations FOR INSERT WITH CHECK (user_id = auth.uid()::UUID);
CREATE POLICY "Users can update their own conversations" ON chat_conversations FOR UPDATE USING (user_id = auth.uid()::UUID);
CREATE POLICY "Users can delete their own conversations" ON chat_conversations FOR DELETE USING (user_id = auth.uid()::UUID);

-- Chat messages follow conversation permissions
CREATE POLICY "Users can view messages in their conversations" ON chat_messages FOR SELECT 
    USING (EXISTS (SELECT 1 FROM chat_conversations WHERE id = conversation_id AND user_id = auth.uid()::UUID));
CREATE POLICY "Users can create messages in their conversations" ON chat_messages FOR INSERT 
    WITH CHECK (EXISTS (SELECT 1 FROM chat_conversations WHERE id = conversation_id AND user_id = auth.uid()::UUID));

-- Create storage buckets (run these in Supabase dashboard)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('knowledge-base-files', 'knowledge-base-files', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('user-content', 'user-content', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('thumbnails', 'thumbnails', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('exports', 'exports', false);

-- Storage policies (uncomment when setting up storage)
-- CREATE POLICY "Users can upload their own files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'knowledge-base-files' AND auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "Users can view their own files" ON storage.objects FOR SELECT USING (bucket_id = 'knowledge-base-files' AND auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "Users can update their own files" ON storage.objects FOR UPDATE USING (bucket_id = 'knowledge-base-files' AND auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "Users can delete their own files" ON storage.objects FOR DELETE USING (bucket_id = 'knowledge-base-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Sample data for testing (optional)
-- INSERT INTO knowledge_items (user_id, category_id, title, description, file_type, processing_status) VALUES
--     ('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', 'Sample Mathematics Book', 'A comprehensive guide to calculus', 'pdf', 'completed'),
--     ('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440005', 'Physics Question Paper 2023', 'Last year physics examination', 'pdf', 'completed');

COMMENT ON TABLE knowledge_categories IS 'Categories for organizing knowledge base items with support for custom user-defined categories';
COMMENT ON TABLE knowledge_items IS 'Main knowledge base items with compression metadata and AI processing results';
COMMENT ON TABLE user_content IS 'User-generated content like mindmaps, notes, and annotations';
COMMENT ON TABLE chat_conversations IS 'Chat conversations for AI-assisted learning';
COMMENT ON TABLE chat_messages IS 'Individual messages within chat conversations';

COMMENT ON COLUMN knowledge_items.compression_metadata IS 'JSON containing compression type, ratio, sizes, and quality settings';
COMMENT ON COLUMN knowledge_items.metadata IS 'Flexible JSON metadata for subject, tags, difficulty level, etc.';
COMMENT ON COLUMN user_content.canvas_data IS 'Canvas data for Apple Pencil drawings and annotations';
COMMENT ON COLUMN chat_messages.referenced_items IS 'Array of knowledge item IDs that were referenced in generating this response'; 
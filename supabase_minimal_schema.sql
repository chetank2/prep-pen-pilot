-- Minimal Knowledge Base Schema for Supabase (No Advanced Indexes)
-- This version focuses on core functionality without complex indexing

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Knowledge Categories Table
CREATE TABLE knowledge_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(100) DEFAULT 'folder',
    color VARCHAR(7) DEFAULT '#3B82F6',
    is_default BOOLEAN DEFAULT FALSE,
    is_custom BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Knowledge Items Table
CREATE TABLE knowledge_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    category_id UUID NOT NULL REFERENCES knowledge_categories(id),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    file_type VARCHAR(50) NOT NULL,
    file_path TEXT,
    file_name VARCHAR(255),
    file_size BIGINT,
    compressed_size BIGINT,
    mime_type VARCHAR(100),
    extracted_text TEXT,
    summary TEXT,
    metadata JSONB DEFAULT '{}',
    custom_category_type VARCHAR(100),
    compression_metadata JSONB DEFAULT '{}',
    processing_status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Content Table
CREATE TABLE user_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    knowledge_item_id UUID NOT NULL REFERENCES knowledge_items(id) ON DELETE CASCADE,
    content_type VARCHAR(50) NOT NULL,
    title VARCHAR(500),
    content_data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat Conversations Table
CREATE TABLE chat_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    title VARCHAR(500) DEFAULT 'New Conversation',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat Messages Table
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    referenced_items JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Basic indexes only
CREATE INDEX idx_knowledge_items_user_id ON knowledge_items(user_id);
CREATE INDEX idx_knowledge_items_category_id ON knowledge_items(category_id);
CREATE INDEX idx_knowledge_items_created_at ON knowledge_items(created_at DESC);
CREATE INDEX idx_chat_messages_conversation_id ON chat_messages(conversation_id);

-- Insert default categories
INSERT INTO knowledge_categories (id, name, description, icon, color, is_default, is_custom) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'Books', 'Academic and reference books', 'book', '#3B82F6', TRUE, FALSE),
    ('550e8400-e29b-41d4-a716-446655440002', 'Articles', 'Research papers and articles', 'file-text', '#F59E0B', TRUE, FALSE),
    ('550e8400-e29b-41d4-a716-446655440003', 'Notes', 'Personal and study notes', 'edit', '#06B6D4', TRUE, FALSE),
    ('550e8400-e29b-41d4-a716-446655440004', 'Videos', 'Educational videos and lectures', 'video', '#EC4899', TRUE, FALSE),
    ('550e8400-e29b-41d4-a716-446655440005', 'Images', 'Diagrams, charts, and images', 'image', '#84CC16', TRUE, FALSE);

-- Disable RLS for development
ALTER TABLE knowledge_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_content DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY; 
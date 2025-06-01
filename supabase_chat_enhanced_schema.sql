-- Enhanced Knowledge Base Schema with Chat and Folder Support
-- Extends existing schema for chat-centric interface

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

-- Chat sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL DEFAULT 'New Chat',
  folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
  context_type VARCHAR(50) DEFAULT 'general', -- general, folder, document
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

-- Extend generated_content table for chat responses
ALTER TABLE generated_content ADD COLUMN IF NOT EXISTS chat_message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE;
ALTER TABLE generated_content ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES folders(id) ON DELETE SET NULL;
ALTER TABLE generated_content ADD COLUMN IF NOT EXISTS user_title VARCHAR(255);
ALTER TABLE generated_content ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Add folder reference to knowledge_items
ALTER TABLE knowledge_items ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES folders(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_folder_id ON chat_sessions(folder_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_folder_contents_folder_id ON folder_contents(folder_id);
CREATE INDEX IF NOT EXISTS idx_folder_contents_content ON folder_contents(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_generated_content_folder_id ON generated_content(folder_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_items_folder_id ON knowledge_items(folder_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
DROP TRIGGER IF EXISTS update_folders_updated_at ON folders;
CREATE TRIGGER update_folders_updated_at BEFORE UPDATE ON folders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_chat_sessions_updated_at ON chat_sessions;
CREATE TRIGGER update_chat_sessions_updated_at BEFORE UPDATE ON chat_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default folders for demo
INSERT INTO folders (id, user_id, name, description, color, icon, position) VALUES
  ('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440000', 'UPSC Preparation', 'Main UPSC study materials and notes', '#3B82F6', 'graduation-cap', 1),
  ('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440000', 'History', 'Ancient, Medieval and Modern History', '#F59E0B', 'scroll', 2),
  ('550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440000', 'Geography', 'Physical and Human Geography', '#84CC16', 'map', 3),
  ('550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440000', 'Polity', 'Indian Constitution and Governance', '#EC4899', 'balance-scale', 4),
  ('550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440000', 'Economics', 'Economic Survey and Budget Analysis', '#06B6D4', 'trending-up', 5)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE folder_contents ENABLE ROW LEVEL SECURITY;

-- RLS policies for folders
CREATE POLICY "Users can view their own folders" ON folders FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create their own folders" ON folders FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own folders" ON folders FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own folders" ON folders FOR DELETE USING (user_id = auth.uid());

-- RLS policies for chat sessions
CREATE POLICY "Users can view their own chat sessions" ON chat_sessions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create their own chat sessions" ON chat_sessions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own chat sessions" ON chat_sessions FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own chat sessions" ON chat_sessions FOR DELETE USING (user_id = auth.uid());

-- RLS policies for chat messages
CREATE POLICY "Users can view messages from their sessions" ON chat_messages FOR SELECT 
  USING (session_id IN (SELECT id FROM chat_sessions WHERE user_id = auth.uid()));
CREATE POLICY "Users can create messages in their sessions" ON chat_messages FOR INSERT 
  WITH CHECK (session_id IN (SELECT id FROM chat_sessions WHERE user_id = auth.uid()));

-- RLS policies for folder contents
CREATE POLICY "Users can view their folder contents" ON folder_contents FOR SELECT 
  USING (folder_id IN (SELECT id FROM folders WHERE user_id = auth.uid()));
CREATE POLICY "Users can manage their folder contents" ON folder_contents FOR ALL 
  USING (folder_id IN (SELECT id FROM folders WHERE user_id = auth.uid()));

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

COMMENT ON TABLE folders IS 'User-created folders for organizing knowledge base content';
COMMENT ON TABLE chat_sessions IS 'AI chat conversations with context and folder association';
COMMENT ON TABLE chat_messages IS 'Individual messages within chat sessions';
COMMENT ON TABLE folder_contents IS 'Junction table linking content to folders'; 
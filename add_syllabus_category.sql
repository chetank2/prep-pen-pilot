-- Add Syllabus Category to Knowledge Base
-- This script safely adds the Syllabus category whether the table exists or not

-- First, create the knowledge_categories table if it doesn't exist
CREATE TABLE IF NOT EXISTS knowledge_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(100) DEFAULT 'folder',
    color VARCHAR(7) DEFAULT '#3B82F6',
    is_default BOOLEAN DEFAULT FALSE,
    is_custom BOOLEAN DEFAULT TRUE,
    parent_id UUID REFERENCES knowledge_categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_category_name UNIQUE(name)
);

-- Insert default categories including Syllabus (ignore if they already exist by ID or name)
INSERT INTO knowledge_categories (id, name, description, icon, color, is_default, is_custom) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'Books', 'Academic and reference books', 'book', '#3B82F6', TRUE, FALSE),
    ('550e8400-e29b-41d4-a716-446655440002', 'Standard Books', 'Curriculum and standard textbooks', 'book-open', '#10B981', TRUE, FALSE),
    ('550e8400-e29b-41d4-a716-446655440003', 'Articles', 'Research papers and articles', 'file-text', '#F59E0B', TRUE, FALSE),
    ('550e8400-e29b-41d4-a716-446655440004', 'Syllabus', 'Course syllabi and curricula', 'list', '#8B5CF6', TRUE, FALSE),
    ('550e8400-e29b-41d4-a716-446655440005', 'Question Papers', 'Past exam papers and questions', 'help-circle', '#EF4444', TRUE, FALSE),
    ('550e8400-e29b-41d4-a716-446655440006', 'Notes', 'Personal and study notes', 'edit', '#06B6D4', TRUE, FALSE),
    ('550e8400-e29b-41d4-a716-446655440007', 'Videos', 'Educational videos and lectures', 'video', '#EC4899', TRUE, FALSE),
    ('550e8400-e29b-41d4-a716-446655440008', 'Images', 'Diagrams, charts, and images', 'image', '#84CC16', TRUE, FALSE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    color = EXCLUDED.color,
    is_default = EXCLUDED.is_default,
    is_custom = EXCLUDED.is_custom,
    updated_at = NOW();

-- Alternative approach: Just add the Syllabus category if it doesn't exist
-- This will work even if some categories exist but Syllabus doesn't
INSERT INTO knowledge_categories (name, description, icon, color, is_default, is_custom) 
SELECT 'Syllabus', 'Course syllabi and curricula', 'list', '#8B5CF6', TRUE, FALSE
WHERE NOT EXISTS (
    SELECT 1 FROM knowledge_categories WHERE name = 'Syllabus'
);

-- Create indexes for better performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_knowledge_categories_is_default ON knowledge_categories(is_default);
CREATE INDEX IF NOT EXISTS idx_knowledge_categories_parent_id ON knowledge_categories(parent_id);

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE 'SUCCESS: Knowledge categories setup completed. Total categories: %', (SELECT COUNT(*) FROM knowledge_categories);
    RAISE NOTICE 'Syllabus category: %', (
        CASE WHEN EXISTS(SELECT 1 FROM knowledge_categories WHERE name = 'Syllabus') 
        THEN 'Available ✓' 
        ELSE 'Not found ✗' 
        END
    );
    RAISE NOTICE 'All categories: %', (
        SELECT STRING_AGG(name, ', ' ORDER BY name) FROM knowledge_categories
    );
END $$; 
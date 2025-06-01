-- Quick Add Syllabus Category
-- Run this in your Supabase SQL Editor

-- Just add the Syllabus category if it doesn't exist
INSERT INTO knowledge_categories (name, description, icon, color, is_default, is_custom) 
SELECT 'Syllabus', 'Course syllabi and curricula', 'list', '#8B5CF6', TRUE, FALSE
WHERE NOT EXISTS (
    SELECT 1 FROM knowledge_categories WHERE name = 'Syllabus'
);

-- Check if it was added successfully
SELECT 
    'SUCCESS: Syllabus category added!' as status,
    COUNT(*) as total_categories,
    CASE WHEN EXISTS(SELECT 1 FROM knowledge_categories WHERE name = 'Syllabus') 
        THEN 'Syllabus Available ✓' 
        ELSE 'Syllabus Not Found ✗' 
    END as syllabus_status
FROM knowledge_categories;

-- Show all categories
SELECT 
    name,
    description,
    icon,
    color,
    is_default
FROM knowledge_categories 
ORDER BY name; 
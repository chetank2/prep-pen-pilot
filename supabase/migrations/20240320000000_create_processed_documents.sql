-- Create processed_documents table
CREATE TABLE IF NOT EXISTS processed_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    original_name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('pdf', 'image')),
    content TEXT NOT NULL,
    metadata JSONB NOT NULL,
    storage_path TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index on type for faster filtering
CREATE INDEX IF NOT EXISTS idx_processed_documents_type ON processed_documents(type);

-- Create index on created_at for faster sorting
CREATE INDEX IF NOT EXISTS idx_processed_documents_created_at ON processed_documents(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_processed_documents_updated_at
    BEFORE UPDATE ON processed_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for processed content if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('processed-content', 'processed-content', false)
ON CONFLICT (id) DO NOTHING; 
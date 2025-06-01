import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { Buffer } from 'buffer';
import { gzip } from 'zlib';
import { promisify } from 'util';

const gzipAsync = promisify(gzip);

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, message: 'Method not allowed' }),
    };
  }

  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, message: 'Request body is required' }),
      };
    }

    // Parse multipart form data (simplified for demo)
    // In production, you'd use a proper multipart parser
    const uploadData = JSON.parse(event.body);
    
    // Mock file processing for demo
    const mockItem = {
      id: `mock-${Date.now()}`,
      user_id: 'demo-user',
      category_id: uploadData.categoryId,
      title: uploadData.title,
      description: uploadData.description,
      file_type: uploadData.fileType || 'pdf',
      file_name: uploadData.fileName,
      file_size: uploadData.fileSize || 1024000,
      compressed_size: Math.floor((uploadData.fileSize || 1024000) * 0.7),
      mime_type: uploadData.mimeType,
      metadata: uploadData.metadata,
      custom_category_type: uploadData.customCategoryType,
      compression_metadata: {
        compressionType: 'gzip',
        compressionRatio: 0.3,
        originalSize: uploadData.fileSize || 1024000,
        compressedSize: Math.floor((uploadData.fileSize || 1024000) * 0.7),
        preservedForAI: true
      },
      processing_status: 'completed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Insert into database
    const { data, error } = await supabase
      .from('knowledge_items')
      .insert(mockItem)
      .select()
      .single();

    if (error) throw error;

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({ success: true, data }),
    };
  } catch (error) {
    console.error('Upload function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        message: 'Upload failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
}; 
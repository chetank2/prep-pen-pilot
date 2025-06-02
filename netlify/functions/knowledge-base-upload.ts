import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Use frontend environment variables (VITE_*) since this function serves frontend requests
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Database configuration missing',
          details: 'Supabase environment variables not set'
        }),
      };
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse the body to get uploadData
    const body = JSON.parse(event.body || '{}');
    const uploadData = JSON.parse(body.uploadData || '{}');
    
    // Create a basic knowledge item without actual file processing for now
    const knowledgeItem = {
      id: uuidv4(),
      user_id: '00000000-0000-0000-0000-000000000000', // Default user for single-user system
      category_id: uploadData.categoryId,
      title: uploadData.title,
      description: uploadData.description || null,
      file_type: body.fileType ? body.fileType.split('/')[0] : 'text', // Use actual file type
      file_name: body.fileName || 'Untitled',
      file_size: body.fileSize || 0,
      file_path: null, // No actual file storage yet
      processing_status: 'completed', // Mark as completed for immediate display
      metadata: uploadData.metadata || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('knowledge_items')
      .insert(knowledgeItem)
      .select(`
        *,
        knowledge_categories(name, color, icon)
      `)
      .single();

    if (error) {
      console.error('Database error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Failed to create knowledge item',
          details: error.message
        }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: data,
        message: 'File uploaded successfully'
      }),
    };

  } catch (error: any) {
    console.error('Upload function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message
      }),
    };
  }
}; 
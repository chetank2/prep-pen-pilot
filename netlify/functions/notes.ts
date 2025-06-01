import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

  try {
    if (event.httpMethod === 'GET') {
      // Get all notes - map from user_content
      const { data, error } = await supabase
        .from('user_content')
        .select('*')
        .in('content_type', ['notes', 'annotation', 'mindmap'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform to match old API format
      const notes = (data || []).map(item => ({
        id: item.id,
        type: item.content_type === 'mindmap' ? 'mindmap' : 'canvas',
        title: item.title || 'Untitled Note',
        imageData: item.content_data?.imageData,
        data: item.content_data,
        tags: item.content_data?.tags || [],
        folderId: null,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, data: notes }),
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, message: 'Method not allowed' }),
    };
  } catch (error) {
    console.error('Notes function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        message: 'Failed to get notes',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
}; 
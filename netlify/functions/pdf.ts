import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
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

    if (event.httpMethod === 'GET') {
      // Get PDF files from knowledge_items where file_type = 'pdf'
      const { data, error } = await supabase
        .from('knowledge_items')
        .select('*')
        .eq('file_type', 'pdf')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Database error:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ 
            error: 'Database query failed',
            details: error.message
          }),
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: data || [],
          count: data?.length || 0
        }),
      };
    }

    if (event.httpMethod === 'POST') {
      // Handle PDF upload or processing
      const requestBody = JSON.parse(event.body || '{}');
      
      // For now, return a placeholder response
      // In production, this would handle PDF text extraction, etc.
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'PDF processing endpoint ready',
          note: 'PDF text extraction and processing needs to be implemented'
        }),
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };

  } catch (error: any) {
    console.error('PDF function error:', error);
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
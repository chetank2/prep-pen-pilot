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
      // Get all PDFs - map from knowledge_items
      const { data, error } = await supabase
        .from('knowledge_items')
        .select('*')
        .eq('file_type', 'pdf')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform to match old API format
      const pdfs = (data || []).map(item => ({
        id: item.id,
        filename: item.file_name || 'Unknown.pdf',
        pageCount: 1, // Mock data
        size: item.file_size || 0,
        uploadedAt: item.created_at,
        text: item.extracted_text
      }));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, data: pdfs }),
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, message: 'Method not allowed' }),
    };
  } catch (error) {
    console.error('PDF function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        message: 'Failed to get PDFs',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
}; 
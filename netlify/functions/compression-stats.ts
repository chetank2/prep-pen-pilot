import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

  if (event.httpMethod !== 'GET') {
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

    // Get compression stats from database
    const { data, error } = await supabase
      .from('knowledge_items')
      .select('file_size, compressed_size')
      .not('file_size', 'is', null)
      .not('compressed_size', 'is', null);

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

    let totalOriginalSize = 0;
    let totalCompressedSize = 0;

    data.forEach(item => {
      totalOriginalSize += item.file_size || 0;
      totalCompressedSize += item.compressed_size || 0;
    });

    const totalSavings = totalOriginalSize - totalCompressedSize;
    const averageCompressionRatio = totalOriginalSize > 0 
      ? ((totalSavings / totalOriginalSize) * 100) 
      : 0;

    const stats = {
      totalOriginalSize,
      totalCompressedSize,
      totalSavings,
      averageCompressionRatio: Math.round(averageCompressionRatio * 100) / 100,
      formattedStats: {
        totalOriginalSize: formatBytes(totalOriginalSize),
        totalCompressedSize: formatBytes(totalCompressedSize),
        totalSavings: formatBytes(totalSavings),
      }
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, data: stats }),
    };
  } catch (error: any) {
    console.error('Compression stats function error:', error);
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
import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
      body: JSON.stringify({ success: false, message: 'Method not allowed' }),
    };
  }

  try {
    // Get compression stats from database
    const { data, error } = await supabase
      .from('knowledge_items')
      .select('file_size, compressed_size')
      .not('file_size', 'is', null)
      .not('compressed_size', 'is', null);

    if (error) throw error;

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
  } catch (error) {
    console.error('Compression stats function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        message: 'Failed to get compression stats',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
}; 
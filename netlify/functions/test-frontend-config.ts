import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const result: any = {
      timestamp: new Date().toISOString(),
      frontendConfig: {
        hasViteSupabaseUrl: !!process.env.VITE_SUPABASE_URL,
        hasViteSupabaseAnonKey: !!process.env.VITE_SUPABASE_ANON_KEY,
        viteUrlPrefix: process.env.VITE_SUPABASE_URL ? process.env.VITE_SUPABASE_URL.substring(0, 30) + '...' : 'NOT SET',
      },
      backendConfig: {
        hasSupabaseUrl: !!process.env.SUPABASE_URL,
        hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        supabaseUrlPrefix: process.env.SUPABASE_URL ? process.env.SUPABASE_URL.substring(0, 30) + '...' : 'NOT SET',
      },
      frontendDatabaseTest: {
        success: false,
        categoriesCount: 0,
        error: null as string | null,
      }
    };

    // Test frontend database connection using VITE variables
    if (process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY) {
      try {
        const supabaseFrontend = createClient(
          process.env.VITE_SUPABASE_URL,
          process.env.VITE_SUPABASE_ANON_KEY
        );

        const { data, error, count } = await supabaseFrontend
          .from('knowledge_categories')
          .select('*', { count: 'exact' })
          .limit(5);

        if (error) {
          result.frontendDatabaseTest.error = error.message;
        } else {
          result.frontendDatabaseTest.success = true;
          result.frontendDatabaseTest.categoriesCount = count || 0;
          result.frontendDatabaseTest.sampleCategories = data?.map(cat => cat.name) || [];
        }
      } catch (dbError: any) {
        result.frontendDatabaseTest.error = dbError.message;
      }
    } else {
      result.frontendDatabaseTest.error = 'Missing VITE environment variables';
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result),
    };

  } catch (error: any) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Function error', 
        message: error.message,
        timestamp: new Date().toISOString()
      }),
    };
  }
}; 
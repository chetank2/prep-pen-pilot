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
    // Check environment variables - use VITE_* pattern with fallbacks
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      environment: {
        hasSupabaseUrl: !!supabaseUrl,
        hasSupabaseKey: !!supabaseServiceKey,
        supabaseUrlPrefix: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'NOT SET',
        envPattern: process.env.VITE_SUPABASE_URL ? 'VITE_*' : 'Legacy',
      },
      database: {
        connected: false,
        tableExists: false,
        categoriesCount: 0,
        error: null as string | null,
      }
    };

    if (!supabaseUrl || !supabaseServiceKey) {
      diagnostics.database.error = 'Missing Supabase environment variables';
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(diagnostics),
      };
    }

    // Test database connection
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    try {
      // Check if table exists by trying to select from it
      const { data, error, count } = await supabase
        .from('knowledge_categories')
        .select('*', { count: 'exact' })
        .limit(1);

      if (error) {
        diagnostics.database.error = error.message;
        diagnostics.database.tableExists = !error.message.includes('does not exist');
      } else {
        diagnostics.database.connected = true;
        diagnostics.database.tableExists = true;
        diagnostics.database.categoriesCount = count || 0;
      }

      // If table exists but is empty, provide setup instructions
      if (diagnostics.database.tableExists && diagnostics.database.categoriesCount === 0) {
        diagnostics.setupInstructions = {
          message: "Table exists but no categories found",
          sqlToRun: "Use the quick_add_syllabus.sql script in your Supabase SQL Editor",
          categories: [
            "Books", "Standard Books", "Articles", "Syllabus", 
            "Question Papers", "Notes", "Videos", "Images"
          ]
        };
      }

    } catch (dbError: any) {
      diagnostics.database.error = dbError.message;
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(diagnostics),
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
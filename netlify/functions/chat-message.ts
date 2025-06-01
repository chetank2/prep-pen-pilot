import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
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
      // Get chat sessions
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .order('updated_at', { ascending: false });

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
      const requestBody = JSON.parse(event.body || '{}');
      const { sessionId, message, role = 'user' } = requestBody;

      if (!sessionId || !message) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'sessionId and message are required' }),
        };
      }

      // Save the user message
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          role,
          content: message,
        })
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ 
            error: 'Failed to save message',
            details: error.message
          }),
        };
      }

      // For now, return a basic response
      // In production, this would integrate with OpenAI or other AI service
      const aiResponse = {
        id: `msg_${Date.now()}`,
        session_id: sessionId,
        role: 'assistant',
        content: 'This is a placeholder response. AI integration needs to be implemented.',
        created_at: new Date().toISOString()
      };

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          userMessage: data,
          assistantMessage: aiResponse,
        }),
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };

  } catch (error: any) {
    console.error('Chat function error:', error);
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
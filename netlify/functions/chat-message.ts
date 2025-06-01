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

    const { conversationId, content } = JSON.parse(event.body);

    // Create user message
    const userMessage = {
      id: `user-${Date.now()}`,
      conversation_id: conversationId,
      role: 'user' as const,
      content,
      created_at: new Date().toISOString()
    };

    // Insert user message
    const { error: userError } = await supabase
      .from('chat_messages')
      .insert(userMessage);

    if (userError) throw userError;

    // Generate AI response (mock for now)
    const aiResponses = [
      `I understand you're asking about "${content}". Based on your knowledge base, here are some key insights...`,
      `That's an interesting question about "${content}". Let me analyze your uploaded materials to provide a comprehensive answer.`,
      `Regarding "${content}", I can help you understand this concept better by referencing your study materials.`,
      `Great question! "${content}" is an important topic. Let me break it down based on your knowledge base.`,
    ];

    const assistantMessage = {
      id: `assistant-${Date.now()}`,
      conversation_id: conversationId,
      role: 'assistant' as const,
      content: aiResponses[Math.floor(Math.random() * aiResponses.length)],
      created_at: new Date().toISOString()
    };

    // Insert assistant message
    const { error: assistantError } = await supabase
      .from('chat_messages')
      .insert(assistantMessage);

    if (assistantError) throw assistantError;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        data: { userMessage, assistantMessage }
      }),
    };
  } catch (error) {
    console.error('Chat function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        message: 'Chat failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
}; 
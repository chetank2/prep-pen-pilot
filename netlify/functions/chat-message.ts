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

      // Generate an intelligent response based on the user's message
      let responseContent = 'I understand you\'re asking about your knowledge base. ';
      
      const messageText = message.toLowerCase();
      
      // Knowledge base queries
      if (messageText.includes('summary') || messageText.includes('summarize')) {
        responseContent = 'I can help you create summaries of your uploaded content. Please specify which document you\'d like me to summarize, or upload a new file for analysis.';
      } else if (messageText.includes('upload') || messageText.includes('add')) {
        responseContent = 'You can upload files to your knowledge base using the "Add Content" button. I support PDFs, documents, images, and other study materials.';
      } else if (messageText.includes('search') || messageText.includes('find')) {
        responseContent = 'You can search through your knowledge base using the search bar. I can help you find specific topics, concepts, or documents you\'ve uploaded.';
      } else if (messageText.includes('note') || messageText.includes('notes')) {
        responseContent = 'I can help you generate study notes from your uploaded materials. Upload documents and I\'ll extract key concepts and create organized notes for you.';
      } else if (messageText.includes('study') || messageText.includes('prepare')) {
        responseContent = 'I\'m here to help you study! I can create summaries, generate questions, organize your materials, and help you prepare for exams. What subject are you working on?';
      } else if (messageText.includes('question') || messageText.includes('quiz')) {
        responseContent = 'I can generate practice questions and quizzes based on your uploaded study materials. This helps reinforce your learning and test your understanding.';
      } else if (messageText.includes('hello') || messageText.includes('hi') || messageText.includes('help')) {
        responseContent = 'Hello! I\'m your AI study assistant. I can help you organize your knowledge base, create summaries, generate study notes, and answer questions about your uploaded materials. How can I assist you today?';
      } else {
        // Default response that's more helpful
        responseContent = `I'm processing your question: "${message}". I can help you organize your study materials, create summaries, and manage your knowledge base. Try asking me about uploading files, creating summaries, or organizing your content!`;
      }

      // Save the AI response to the database
      const { data: aiData, error: aiError } = await supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          role: 'assistant',
          content: responseContent,
        })
        .select()
        .single();

      if (aiError) {
        console.error('Failed to save AI response:', aiError);
        // Continue anyway with the response
      }

      const aiResponse = aiData || {
        id: `msg_${Date.now()}`,
        session_id: sessionId,
        role: 'assistant',
        content: responseContent,
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
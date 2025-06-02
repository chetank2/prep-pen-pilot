import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Simple text extraction function
function extractTextFromFile(fileName: string, fileContent: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'txt':
    case 'md':
      return fileContent;
    case 'json':
      try {
        return JSON.stringify(JSON.parse(fileContent), null, 2);
      } catch {
        return fileContent;
      }
    default:
      // For other file types, return a placeholder indicating processing is needed
      return `File uploaded: ${fileName}\nSize: ${fileContent.length} characters\nType: ${extension}\n\nContent extraction for this file type requires additional processing.`;
  }
}

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
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

    // Parse the body to get uploadData and file information
    const body = JSON.parse(event.body || '{}');
    const uploadData = JSON.parse(body.uploadData || '{}');
    
    // Extract file type from MIME type
    const fileType = body.fileType ? body.fileType.split('/')[0] : 'text';
    const fileExtension = body.fileName ? body.fileName.split('.').pop()?.toLowerCase() : 'txt';
    
    // Extract text content if available
    let extractedText = '';
    if (body.fileContent) {
      extractedText = extractTextFromFile(body.fileName, body.fileContent);
    } else {
      extractedText = `File uploaded: ${body.fileName}\nProcessing required for content extraction.`;
    }
    
    // Create a knowledge item with extracted content
    const knowledgeItem = {
      id: uuidv4(),
      user_id: '00000000-0000-0000-0000-000000000000', // Default user for single-user system
      category_id: uploadData.categoryId,
      title: uploadData.title,
      description: uploadData.description || null,
      file_type: fileType,
      file_name: body.fileName || 'Untitled',
      file_size: body.fileSize || 0,
      file_path: null, // No file storage in this implementation
      mime_type: body.fileType || 'text/plain',
      extracted_text: extractedText,
      processing_status: 'completed', // Mark as completed since we processed it
      metadata: {
        ...uploadData.metadata,
        file_extension: fileExtension,
        processing_method: 'netlify_function'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('knowledge_items')
      .insert(knowledgeItem)
      .select(`
        *,
        knowledge_categories(name, color, icon)
      `)
      .single();

    if (error) {
      console.error('Database error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Failed to create knowledge item',
          details: error.message
        }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: data,
        message: 'File processed and uploaded successfully'
      }),
    };

  } catch (error: any) {
    console.error('Upload function error:', error);
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
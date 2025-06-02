import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
      // Get all folders
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .order('position', { ascending: true });

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
      // Create new folder
      const requestBody = JSON.parse(event.body || '{}');
      const { name, description, color, icon, user_id } = requestBody;

      if (!name) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Folder name is required' }),
        };
      }

      const { data, error } = await supabase
        .from('folders')
        .insert({
          name,
          description: description || '',
          color: color || '#3B82F6',
          icon: icon || 'folder',
          user_id: user_id || 'default-user', // Replace with actual user ID when auth is implemented
        })
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ 
            error: 'Failed to create folder',
            details: error.message
          }),
        };
      }

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          success: true,
          data: data,
          message: 'Folder created successfully'
        }),
      };
    }

    if (event.httpMethod === 'PUT') {
      // Update folder
      const pathSegments = event.path.split('/');
      const folderId = pathSegments[pathSegments.length - 1];
      
      if (!folderId || folderId === 'folders') {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Folder ID is required for updates' }),
        };
      }

      const requestBody = JSON.parse(event.body || '{}');
      const { name, description, color, icon } = requestBody;

      const updateData: any = {};
      if (name) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (color) updateData.color = color;
      if (icon) updateData.icon = icon;

      const { data, error } = await supabase
        .from('folders')
        .update(updateData)
        .eq('id', folderId)
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ 
            error: 'Failed to update folder',
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
          message: 'Folder updated successfully'
        }),
      };
    }

    if (event.httpMethod === 'DELETE') {
      // Delete folder
      const pathSegments = event.path.split('/');
      const folderId = pathSegments[pathSegments.length - 1];
      
      if (!folderId || folderId === 'folders') {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Folder ID is required for deletion' }),
        };
      }

      const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', folderId);

      if (error) {
        console.error('Database error:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ 
            error: 'Failed to delete folder',
            details: error.message
          }),
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Folder deleted successfully'
        }),
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };

  } catch (error: any) {
    console.error('Folders function error:', error);
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
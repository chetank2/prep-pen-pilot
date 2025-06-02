import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';

// Debug environment variables
console.log('DEBUG - Environment variables:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET (length: ' + process.env.SUPABASE_SERVICE_ROLE_KEY.length + ')' : 'NOT SET');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  global: {
    headers: {
      'x-application-name': 'prep-pen-pilot-backend',
    },
  },
});

// Storage bucket names
export const STORAGE_BUCKETS = {
  KNOWLEDGE_BASE: 'knowledge-base-files',
  USER_CONTENT: 'user-content',
  THUMBNAILS: 'thumbnails',
  EXPORTS: 'exports',
} as const;

// Test connection
export const testConnection = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.from('knowledge_categories').select('count').limit(1);
    if (error) {
      logger.error('Supabase connection test failed:', error);
      return false;
    }
    logger.info('Supabase connection successful');
    return true;
  } catch (error) {
    logger.error('Supabase connection test error:', error);
    return false;
  }
};

export default supabase; 
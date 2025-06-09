import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Test the connection
const testConnection = async (): Promise<void> => {
  try {
    const { data, error } = await supabase.from('upsc_subjects').select('count');
    if (error) throw error;
    console.log('Supabase connection successful');
  } catch (error: unknown) {
    console.error('Error connecting to Supabase:', error);
    process.exit(1);
  }
};

testConnection(); 
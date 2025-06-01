import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
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

// Helper function to get file URL
export const getFileUrl = (bucket: string, path: string): string => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

// Helper function to upload file
export const uploadFile = async (
  bucket: string,
  path: string,
  file: File | Buffer,
  options?: { contentType?: string; upsert?: boolean }
): Promise<{ path: string; publicUrl: string }> => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      contentType: options?.contentType,
      upsert: options?.upsert || false,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  const publicUrl = getFileUrl(bucket, data.path);
  return { path: data.path, publicUrl };
};

// Helper function to download file
export const downloadFile = async (bucket: string, path: string): Promise<Blob> => {
  const { data, error } = await supabase.storage.from(bucket).download(path);

  if (error) {
    throw new Error(`Download failed: ${error.message}`);
  }

  return data;
};

// Helper function to delete file
export const deleteFile = async (bucket: string, path: string): Promise<void> => {
  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) {
    throw new Error(`Delete failed: ${error.message}`);
  }
};

// Database helper functions
export const dbHelpers = {
  // Get categories
  getCategories: async () => {
    const { data, error } = await supabase
      .from('knowledge_categories')
      .select('*')
      .order('is_default', { ascending: false })
      .order('name');

    if (error) throw error;
    return data;
  },

  // Create category
  createCategory: async (category: Omit<any, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('knowledge_categories')
      .insert(category)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get knowledge items
  getKnowledgeItems: async (filters?: any) => {
    let query = supabase
      .from('knowledge_items')
      .select(`
        *,
        knowledge_categories(name, color, icon)
      `)
      .order('created_at', { ascending: false });

    if (filters?.categoryId) {
      query = query.eq('category_id', filters.categoryId);
    }

    if (filters?.subject) {
      query = query.ilike('metadata->subject', `%${filters.subject}%`);
    }

    if (filters?.tags && filters.tags.length > 0) {
      query = query.overlaps('metadata->tags', filters.tags);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Create knowledge item
  createKnowledgeItem: async (item: any) => {
    const { data, error } = await supabase
      .from('knowledge_items')
      .insert(item)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update knowledge item
  updateKnowledgeItem: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from('knowledge_items')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Search knowledge items
  searchKnowledgeItems: async (query: string, filters?: any) => {
    let dbQuery = supabase
      .from('knowledge_items')
      .select(`
        *,
        knowledge_categories(name, color, icon)
      `)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%,extracted_text.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (filters?.categoryId) {
      dbQuery = dbQuery.eq('category_id', filters.categoryId);
    }

    const { data, error } = await dbQuery;
    if (error) throw error;
    return data;
  },
};

export default supabase; 
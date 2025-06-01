import { supabase, STORAGE_BUCKETS } from '../config/supabase';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class SupabaseService {
  
  // File Storage Operations
  static async uploadFile(
    bucket: string,
    filePath: string,
    file: Buffer,
    contentType: string,
    options: { upsert?: boolean } = {}
  ): Promise<{ path: string; publicUrl: string }> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          contentType,
          upsert: options.upsert || false,
        });

      if (error) {
        logger.error('File upload failed:', error);
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      logger.info(`File uploaded successfully: ${filePath}`);
      return { path: data.path, publicUrl };
    } catch (error) {
      logger.error('File upload error:', error);
      throw error;
    }
  }

  static async downloadFile(bucket: string, path: string): Promise<Buffer> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .download(path);

      if (error) {
        logger.error('File download failed:', error);
        throw error;
      }

      return Buffer.from(await data.arrayBuffer());
    } catch (error) {
      logger.error('File download error:', error);
      throw error;
    }
  }

  static getFileUrl(bucket: string, path: string): string {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  static async deleteFile(bucket: string, path: string): Promise<void> {
    try {
      const { error } = await supabase.storage.from(bucket).remove([path]);
      if (error) {
        logger.error('File deletion failed:', error);
        throw error;
      }
      logger.info(`File deleted successfully: ${path}`);
    } catch (error) {
      logger.error('File deletion error:', error);
      throw error;
    }
  }

  // Category Operations
  static async getCategories(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('knowledge_categories')
        .select('*')
        .order('is_default', { ascending: false })
        .order('name');

      if (error) {
        logger.error('Failed to fetch categories:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('Get categories error:', error);
      throw error;
    }
  }

  static async createCategory(categoryData: any): Promise<any> {
    try {
      const category = {
        id: uuidv4(),
        ...categoryData,
        is_default: false,
        is_custom: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('knowledge_categories')
        .insert(category)
        .select()
        .single();

      if (error) {
        logger.error('Failed to create category:', error);
        throw error;
      }

      logger.info(`Category created: ${category.name}`);
      return data;
    } catch (error) {
      logger.error('Create category error:', error);
      throw error;
    }
  }

  static async updateCategory(id: string, updates: any): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('knowledge_categories')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('Failed to update category:', error);
        throw error;
      }

      logger.info(`Category updated: ${id}`);
      return data;
    } catch (error) {
      logger.error('Update category error:', error);
      throw error;
    }
  }

  static async deleteCategory(id: string): Promise<boolean> {
    try {
      // Check if category has items
      const { data: items } = await supabase
        .from('knowledge_items')
        .select('id')
        .eq('category_id', id)
        .limit(1);

      if (items && items.length > 0) {
        throw new Error('Cannot delete category with existing items');
      }

      // Check if it's a default category
      const { data: category } = await supabase
        .from('knowledge_categories')
        .select('is_default')
        .eq('id', id)
        .single();

      if (category?.is_default) {
        throw new Error('Cannot delete default category');
      }

      const { error } = await supabase
        .from('knowledge_categories')
        .delete()
        .eq('id', id);

      if (error) {
        logger.error('Failed to delete category:', error);
        throw error;
      }

      logger.info(`Category deleted: ${id}`);
      return true;
    } catch (error) {
      logger.error('Delete category error:', error);
      return false;
    }
  }

  // Knowledge Item Operations
  static async createKnowledgeItem(item: any): Promise<any> {
    try {
      const knowledgeItem = {
        id: item.id || uuidv4(),
        ...item,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('knowledge_items')
        .insert(knowledgeItem)
        .select()
        .single();

      if (error) {
        logger.error('Failed to create knowledge item:', error);
        throw error;
      }

      logger.info(`Knowledge item created: ${knowledgeItem.title}`);
      return data;
    } catch (error) {
      logger.error('Create knowledge item error:', error);
      throw error;
    }
  }

  static async updateKnowledgeItem(id: string, updates: any): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('knowledge_items')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('Failed to update knowledge item:', error);
        throw error;
      }

      logger.info(`Knowledge item updated: ${id}`);
      return data;
    } catch (error) {
      logger.error('Update knowledge item error:', error);
      throw error;
    }
  }

  static async getKnowledgeItems(filters: any = {}): Promise<any[]> {
    try {
      let query = supabase
        .from('knowledge_items')
        .select(`
          *,
          knowledge_categories(name, color, icon)
        `)
        .order('created_at', { ascending: false });

      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }

      if (filters.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }

      if (filters.folderId) {
        query = query.eq('folder_id', filters.folderId);
      }

      const { data, error } = await query;
      if (error) {
        logger.error('Failed to fetch knowledge items:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('Get knowledge items error:', error);
      throw error;
    }
  }

  static async getKnowledgeItemById(id: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('knowledge_items')
        .select(`
          *,
          knowledge_categories(name, color, icon)
        `)
        .eq('id', id)
        .single();

      if (error) {
        logger.error('Failed to fetch knowledge item:', error);
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Get knowledge item error:', error);
      throw error;
    }
  }

  static async searchKnowledgeItems(userId: string, query: string, filters: any = {}): Promise<any[]> {
    try {
      let dbQuery = supabase
        .from('knowledge_items')
        .select(`
          *,
          knowledge_categories(name, color, icon)
        `)
        .eq('user_id', userId)
        .or(`title.ilike.%${query}%,description.ilike.%${query}%,extracted_text.ilike.%${query}%`)
        .order('created_at', { ascending: false });

      if (filters.categoryId) {
        dbQuery = dbQuery.eq('category_id', filters.categoryId);
      }

      if (filters.folderId) {
        dbQuery = dbQuery.eq('folder_id', filters.folderId);
      }

      const { data, error } = await dbQuery;
      if (error) {
        logger.error('Failed to search knowledge items:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('Search knowledge items error:', error);
      throw error;
    }
  }

  // User Generated Content Operations
  static async createUserContent(content: any): Promise<any> {
    try {
      const userContent = {
        id: uuidv4(),
        ...content,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('generated_content')
        .insert(userContent)
        .select()
        .single();

      if (error) {
        logger.error('Failed to create user content:', error);
        throw error;
      }

      logger.info(`User content created: ${userContent.content_type}`);
      return data;
    } catch (error) {
      logger.error('Create user content error:', error);
      throw error;
    }
  }

  static async getUserContent(knowledgeItemId: string, contentType?: string): Promise<any[]> {
    try {
      let query = supabase
        .from('generated_content')
        .select('*')
        .eq('knowledge_item_id', knowledgeItemId)
        .order('created_at', { ascending: false });

      if (contentType) {
        query = query.eq('content_type', contentType);
      }

      const { data, error } = await query;
      if (error) {
        logger.error('Failed to fetch user content:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('Get user content error:', error);
      throw error;
    }
  }

  // Chat Operations
  static async createChatConversation(userId: string, title?: string): Promise<any> {
    try {
      const conversation = {
        id: uuidv4(),
        user_id: userId,
        title: title || 'New Conversation',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('chat_conversations')
        .insert(conversation)
        .select()
        .single();

      if (error) {
        logger.error('Failed to create chat conversation:', error);
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Create chat conversation error:', error);
      throw error;
    }
  }

  // Storage & Analytics
  static async getStorageStats(): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('get_storage_stats');
      
      if (error) {
        logger.error('Failed to get storage stats:', error);
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Get storage stats error:', error);
      return { total_size: 0, file_count: 0 };
    }
  }

  // Vector Search (placeholder for future implementation)
  static async searchSimilarContent(embedding: number[], limit = 5): Promise<any[]> {
    try {
      // Placeholder for vector similarity search
      // This would use pgvector extension in production
      return [];
    } catch (error) {
      logger.error('Vector search error:', error);
      return [];
    }
  }

  // Folder Operations
  static async getFolders(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('user_id', userId)
        .order('position', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Failed to fetch folders:', error);
      throw error;
    }
  }

  static async createFolder(folderData: any): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('folders')
        .insert(folderData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Failed to create folder:', error);
      throw error;
    }
  }

  static async updateFolder(folderId: string, updates: any): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('folders')
        .update(updates)
        .eq('id', folderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Failed to update folder:', error);
      throw error;
    }
  }

  static async deleteFolder(folderId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', folderId);

      if (error) throw error;
    } catch (error) {
      logger.error('Failed to delete folder:', error);
      throw error;
    }
  }

  static async getFolderContents(folderId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('folder_contents')
        .select(`
          *,
          knowledge_items(*),
          generated_content(*),
          chat_sessions(*)
        `)
        .eq('folder_id', folderId)
        .order('position', { ascending: true });

      if (error) throw error;
      
      // Flatten the results to include the actual content objects
      return (data || []).map((item: any) => ({
        ...item,
        content: item.knowledge_items || item.generated_content || item.chat_sessions
      }));
    } catch (error) {
      logger.error('Failed to fetch folder contents:', error);
      throw error;
    }
  }

  static async addToFolder(folderId: string, contentId: string, contentType: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('folder_contents')
        .insert({
          folder_id: folderId,
          content_id: contentId,
          content_type: contentType,
          position: 0
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Failed to add content to folder:', error);
      throw error;
    }
  }

  static async removeFromFolder(folderId: string, contentId: string, contentType: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('folder_contents')
        .delete()
        .eq('folder_id', folderId)
        .eq('content_id', contentId)
        .eq('content_type', contentType);

      if (error) throw error;
    } catch (error) {
      logger.error('Failed to remove content from folder:', error);
      throw error;
    }
  }

  // Chat Session Operations
  static async createChatSession(sessionData: any): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert(sessionData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Failed to create chat session:', error);
      throw error;
    }
  }

  static async getChatSessions(userId: string, folderId?: string): Promise<any[]> {
    try {
      let query = supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (folderId) {
        query = query.eq('folder_id', folderId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Failed to fetch chat sessions:', error);
      throw error;
    }
  }

  static async getChatSession(sessionId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Failed to fetch chat session:', error);
      throw error;
    }
  }

  static async updateChatSession(sessionId: string, updates: any): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .update(updates)
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Failed to update chat session:', error);
      throw error;
    }
  }

  static async deleteChatSession(sessionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;
    } catch (error) {
      logger.error('Failed to delete chat session:', error);
      throw error;
    }
  }

  // Chat Message Operations
  static async createChatMessage(messageData: any): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert(messageData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Failed to create chat message:', error);
      throw error;
    }
  }

  static async getChatMessages(sessionId: string, limit?: number): Promise<any[]> {
    try {
      let query = supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Failed to fetch chat messages:', error);
      throw error;
    }
  }

  // Enhanced Generated Content Operations
  static async createGeneratedContent(contentData: any): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('generated_content')
        .insert(contentData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Failed to create generated content:', error);
      throw error;
    }
  }

  static async getGeneratedContent(filters: any = {}): Promise<any[]> {
    try {
      let query = supabase
        .from('generated_content')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters.folderId) {
        query = query.eq('folder_id', filters.folderId);
      }

      if (filters.contentType) {
        query = query.eq('content_type', filters.contentType);
      }

      if (filters.knowledgeItemId) {
        query = query.eq('knowledge_item_id', filters.knowledgeItemId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Failed to fetch generated content:', error);
      throw error;
    }
  }

  // Utility method for supabase access (keeping compatibility)
  static get supabase() {
    return supabase;
  }
} 
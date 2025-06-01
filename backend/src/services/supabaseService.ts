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
        .select(`
          *,
          knowledge_categories(name, color, icon)
        `)
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
        .select(`
          *,
          knowledge_categories(name, color, icon)
        `)
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

      // Apply filters
      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }

      if (filters.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }

      if (filters.contentType) {
        query = query.eq('custom_category_type', filters.contentType);
      }

      if (filters.subject) {
        query = query.ilike('metadata->subject', `%${filters.subject}%`);
      }

      if (filters.difficultyLevel) {
        query = query.eq('metadata->difficulty_level', filters.difficultyLevel);
      }

      if (filters.tags && filters.tags.length > 0) {
        query = query.overlaps('metadata->tags', filters.tags);
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

      // Apply additional filters
      if (filters.categoryId) {
        dbQuery = dbQuery.eq('category_id', filters.categoryId);
      }

      if (filters.contentType) {
        dbQuery = dbQuery.eq('custom_category_type', filters.contentType);
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

  // User Content Operations (for generated content and annotations)
  static async createUserContent(content: any): Promise<any> {
    try {
      const userContent = {
        id: uuidv4(),
        ...content,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('user_content')
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
        .from('user_content')
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

  static async createChatMessage(message: any): Promise<any> {
    try {
      const chatMessage = {
        id: uuidv4(),
        ...message,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('chat_messages')
        .insert(chatMessage)
        .select()
        .single();

      if (error) {
        logger.error('Failed to create chat message:', error);
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Create chat message error:', error);
      throw error;
    }
  }

  static async getChatMessages(conversationId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        logger.error('Failed to fetch chat messages:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('Get chat messages error:', error);
      throw error;
    }
  }

  // Utility Methods
  static async getStorageStats(): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('calculate_storage_savings');

      if (error) {
        logger.error('Failed to get storage stats:', error);
        throw error;
      }

      return data?.[0] || {
        total_original_size: 0,
        total_compressed_size: 0,
        total_savings: 0,
        average_compression_ratio: 0,
      };
    } catch (error) {
      logger.error('Get storage stats error:', error);
      throw error;
    }
  }

  // Vector search for semantic similarity (placeholder)
  static async searchSimilarContent(embedding: number[], limit = 5): Promise<any[]> {
    try {
      // This would use pgvector extension in production
      // For now, return empty array
      return [];
    } catch (error) {
      logger.error('Vector search error:', error);
      throw error;
    }
  }
} 
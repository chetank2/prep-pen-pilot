import { supabase, dbHelpers } from '../lib/supabase';
import { 
  KnowledgeItem, 
  KnowledgeCategory, 
  UploadData, 
  SearchFilters, 
  SearchResult,
  CreateCategoryRequest,
  ChatConversation,
  ChatMessage,
  GeneratedContent
} from '../types/knowledgeBase';
import { API_CONFIG, getApiUrl, checkBackendAvailability, API_ENDPOINTS } from '../lib/config';

// Check if backend is available
async function isBackendAvailable(): Promise<boolean> {
  try {
    if (!API_CONFIG.USE_BACKEND_FALLBACK) return false;
    return await checkBackendAvailability();
  } catch {
    return false;
  }
}

export class KnowledgeBaseService {
  
  // Category Management
  static async getCategories(): Promise<KnowledgeCategory[]> {
    try {
      // Try Netlify function first, then Supabase fallback
      const url = getApiUrl(API_ENDPOINTS.KNOWLEDGE_BASE.CATEGORIES);
      const response = await fetch(url);
      
      if (response.ok) {
        const result = await response.json();
        return Array.isArray(result.data) ? result.data : (Array.isArray(result) ? result : []);
      }
      
      // Fallback to direct Supabase
      return await dbHelpers.getCategories();
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      // Final fallback to Supabase
      try {
        return await dbHelpers.getCategories();
      } catch (fallbackError) {
        console.error('Supabase fallback also failed:', fallbackError);
        throw new Error('Unable to fetch categories. Please check your connection.');
      }
    }
  }

  static async createCategory(categoryData: CreateCategoryRequest): Promise<KnowledgeCategory> {
    try {
      return await dbHelpers.createCategory({
        ...categoryData,
        is_default: false,
        is_custom: true,
      });
    } catch (error) {
      console.error('Failed to create category:', error);
      throw error;
    }
  }

  // File Upload with Compression
  static async uploadFile(
    file: File, 
    uploadData: UploadData,
    onProgress?: (progress: number) => void
  ): Promise<KnowledgeItem> {
    const backendAvailable = await isBackendAvailable();
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('uploadData', JSON.stringify(uploadData));

      const url = backendAvailable 
        ? `${API_CONFIG.DEVELOPMENT_API}/knowledge-base/upload`
        : getApiUrl(API_ENDPOINTS.KNOWLEDGE_BASE.UPLOAD);

      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Upload failed');
      }

      const result = await response.json();
      return result.data || result;
    } catch (error) {
      console.error('File upload failed:', error);
      throw error;
    }
  }

  // Knowledge Items Management
  static async getKnowledgeItems(filters?: SearchFilters): Promise<KnowledgeItem[]> {
    try {
      // Try Netlify function first
      const params = new URLSearchParams();
      if (filters?.categoryId) {
        params.append('categoryId', filters.categoryId);
      }

      const url = getApiUrl(`${API_ENDPOINTS.KNOWLEDGE_BASE.ITEMS}?${params}`);
      const response = await fetch(url);
      
      if (response.ok) {
        const result = await response.json();
        return Array.isArray(result.data) ? result.data : (Array.isArray(result) ? result : []);
      }
      
      // Fallback to direct Supabase
      return await dbHelpers.getKnowledgeItems(filters);
    } catch (error) {
      console.error('Failed to fetch knowledge items:', error);
      // Fallback to direct Supabase
      try {
        return await dbHelpers.getKnowledgeItems(filters);
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        throw new Error('Unable to fetch knowledge items from any source.');
      }
    }
  }

  static async getKnowledgeItemById(id: string): Promise<KnowledgeItem> {
    try {
      const { data, error } = await supabase
        .from('knowledge_items')
        .select(`
          *,
          knowledge_categories(name, color, icon)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to fetch knowledge item:', error);
      throw error;
    }
  }

  static async updateKnowledgeItem(id: string, updates: Partial<KnowledgeItem>): Promise<KnowledgeItem> {
    try {
      return await dbHelpers.updateKnowledgeItem(id, updates);
    } catch (error) {
      console.error('Failed to update knowledge item:', error);
      throw error;
    }
  }

  static async deleteKnowledgeItem(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('knowledge_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to delete knowledge item:', error);
      throw error;
    }
  }

  // Search and Discovery
  static async searchKnowledgeItems(
    query: string, 
    filters?: SearchFilters
  ): Promise<SearchResult> {
    try {
      const items = await dbHelpers.searchKnowledgeItems(query, filters);
      
      // Calculate facets for better search experience
      const facets = this.calculateSearchFacets(items);
      
      return {
        items,
        totalCount: items.length,
        facets,
      };
    } catch (error) {
      console.error('Search failed:', error);
      throw error;
    }
  }

  private static calculateSearchFacets(items: KnowledgeItem[]) {
    const categories = new Map<string, number>();
    const fileTypes = new Map<string, number>();
    const subjects = new Map<string, number>();

    items.forEach(item => {
      // Count categories
      if (item.knowledge_categories?.name) {
        const count = categories.get(item.knowledge_categories.name) || 0;
        categories.set(item.knowledge_categories.name, count + 1);
      }

      // Count file types
      if (item.file_type) {
        const count = fileTypes.get(item.file_type) || 0;
        fileTypes.set(item.file_type, count + 1);
      }

      // Count subjects from metadata
      const subject = item.metadata?.subject;
      if (subject) {
        const count = subjects.get(subject) || 0;
        subjects.set(subject, count + 1);
      }
    });

    return {
      categories: Array.from(categories.entries()).map(([name, count]) => ({ name, count })),
      fileTypes: Array.from(fileTypes.entries()).map(([name, count]) => ({ name, count })),
      subjects: Array.from(subjects.entries()).map(([name, count]) => ({ name, count })),
    };
  }

  // Generated Content (AI Features)
  static async generateMindmap(knowledgeItemId: string, subject?: string): Promise<GeneratedContent> {
    const backendAvailable = await isBackendAvailable();
    
    if (!backendAvailable) {
      throw new Error('AI features require backend service. Please enable backend or implement in Netlify functions.');
    }

    try {
      const response = await fetch(`${API_CONFIG.DEVELOPMENT_API}/knowledge-base/items/${knowledgeItemId}/generate-mindmap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject }),
      });

      if (!response.ok) throw new Error('Failed to generate mindmap');
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Mindmap generation failed:', error);
      throw error;
    }
  }

  static async generateNotes(knowledgeItemId: string, subject?: string): Promise<GeneratedContent> {
    const backendAvailable = await isBackendAvailable();
    
    if (!backendAvailable) {
      throw new Error('AI features require backend service. Please enable backend or implement in Netlify functions.');
    }

    try {
      const response = await fetch(`${API_CONFIG.DEVELOPMENT_API}/knowledge-base/items/${knowledgeItemId}/generate-notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject }),
      });

      if (!response.ok) throw new Error('Failed to generate notes');
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Notes generation failed:', error);
      throw error;
    }
  }

  static async generateSummary(knowledgeItemId: string): Promise<GeneratedContent> {
    try {
      const { data, error } = await supabase
        .from('generated_content')
        .insert({
          knowledge_item_id: knowledgeItemId,
          content_type: 'summary',
          title: 'AI Generated Summary',
          content_data: {
            summary: 'This is a placeholder summary. AI integration needs to be implemented.',
            keyPoints: ['Key point 1', 'Key point 2', 'Key point 3'],
            wordCount: 0,
          },
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Summary generation failed:', error);
      throw error;
    }
  }

  // User Content Management
  static async getUserContent(knowledgeItemId: string, contentType?: string): Promise<GeneratedContent[]> {
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
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch user content:', error);
      throw error;
    }
  }

  static async saveUserContent(content: Omit<GeneratedContent, 'id' | 'created_at' | 'updated_at'>): Promise<GeneratedContent> {
    try {
      const { data, error } = await supabase
        .from('generated_content')
        .insert(content)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to save user content:', error);
      throw error;
    }
  }

  // Chat Integration
  static async getChatConversations(): Promise<ChatConversation[]> {
    try {
      const url = getApiUrl(API_ENDPOINTS.CHAT.MESSAGE);
      const response = await fetch(url);
      
      if (response.ok) {
        const result = await response.json();
        return Array.isArray(result.data) ? result.data : [];
      }
      
      // Fallback to direct Supabase
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch chat conversations:', error);
      return [];
    }
  }

  static async createChatConversation(title?: string): Promise<ChatConversation> {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: 'default-user', // Replace with actual user ID when auth is implemented
          title: title || 'New Chat',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to create chat conversation:', error);
      throw error;
    }
  }

  static async getChatMessages(conversationId: string): Promise<ChatMessage[]> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch chat messages:', error);
      throw error;
    }
  }

  static subscribeToChatMessages(conversationId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`chat_messages:${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `session_id=eq.${conversationId}` },
        callback
      )
      .subscribe();
  }

  static async sendChatMessage(
    conversationId: string, 
    content: string
  ): Promise<{ userMessage: ChatMessage; assistantMessage: ChatMessage }> {
    try {
      const url = getApiUrl(API_ENDPOINTS.CHAT.MESSAGE);
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: conversationId,
          message: content,
          role: 'user',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const result = await response.json();
      return {
        userMessage: result.userMessage,
        assistantMessage: result.assistantMessage,
      };
    } catch (error) {
      console.error('Failed to send chat message:', error);
      throw error;
    }
  }

  // Compression Stats
  static async getCompressionStats(): Promise<{
    totalOriginalSize: number;
    totalCompressedSize: number;
    totalSavings: number;
    averageCompressionRatio: number;
    formattedStats: {
      totalOriginalSize: string;
      totalCompressedSize: string;
      totalSavings: string;
    };
  }> {
    try {
      const url = getApiUrl(API_ENDPOINTS.KNOWLEDGE_BASE.COMPRESSION_STATS);
      const response = await fetch(url);
      
      if (response.ok) {
        const result = await response.json();
        return result.data || result;
      }
      
      // Fallback calculation from knowledge items
      const items = await this.getKnowledgeItems();
      
      const stats = items.reduce((acc, item) => {
        const originalSize = item.file_size || 0;
        const compressedSize = item.compressed_size || originalSize;
        
        acc.totalOriginalSize += originalSize;
        acc.totalCompressedSize += compressedSize;
        
        return acc;
      }, { totalOriginalSize: 0, totalCompressedSize: 0 });

      const totalSavings = stats.totalOriginalSize - stats.totalCompressedSize;
      const averageCompressionRatio = stats.totalOriginalSize > 0 
        ? (totalSavings / stats.totalOriginalSize) * 100 
        : 0;

      return {
        ...stats,
        totalSavings,
        averageCompressionRatio,
        formattedStats: {
          totalOriginalSize: this.formatBytes(stats.totalOriginalSize),
          totalCompressedSize: this.formatBytes(stats.totalCompressedSize),
          totalSavings: this.formatBytes(totalSavings),
        },
      };
    } catch (error) {
      console.error('Failed to fetch compression stats:', error);
      throw error;
    }
  }

  static async downloadFile(knowledgeItemId: string): Promise<Blob> {
    try {
      const item = await this.getKnowledgeItemById(knowledgeItemId);
      
      if (!item.file_path) {
        throw new Error('File path not found');
      }

      // This would typically use Supabase Storage or backend file serving
      throw new Error('File download not implemented yet');
    } catch (error) {
      console.error('File download failed:', error);
      throw error;
    }
  }

  static subscribeToKnowledgeItems(callback: (payload: any) => void) {
    return supabase
      .channel('knowledge_items')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'knowledge_items' },
        callback
      )
      .subscribe();
  }

  private static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
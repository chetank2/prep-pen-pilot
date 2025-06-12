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
  GeneratedContent,
  FileMetadata,
  UploadResponse
} from '../types/knowledgeBase';
import { api } from '../lib/api';
import { API_ENDPOINTS } from '../lib/config';

// Helper function to handle API responses
async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      // If we can't parse the error response, use the default message
    }
    throw new Error(errorMessage);
  }

  const result = await response.json();
  
  // Handle different API response formats
  if (result && typeof result === 'object') {
    // If it has a success field and it's false, treat as error
    if (result.success === false) {
      throw new Error(result.message || 'API returned error');
    }
    
    // If it has a data field, return that
    if (result.data !== undefined) {
      return result.data;
    }
  }
  
  return result;
}

export class KnowledgeBaseService {
  
  // Category Management
  static async getCategories(): Promise<KnowledgeCategory[]> {
    try {
      const result = await api.get<{ data: KnowledgeCategory[] }>(API_ENDPOINTS.KNOWLEDGE_BASE.CATEGORIES);
      return result.data || [];
    } catch (error) {
      console.error('Failed to fetch categories from API:', error);
      
      // Fallback to direct Supabase
      try {
        return await dbHelpers.getCategories();
      } catch (fallbackError) {
        console.error('Fallback to Supabase also failed:', fallbackError);
        // Return default categories as last resort
        return [
          { 
            id: '1', 
            name: 'Books', 
            description: 'Academic and reference books', 
            icon: 'book', 
            color: '#3B82F6',
            is_default: true,
            is_custom: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          { 
            id: '2', 
            name: 'Articles', 
            description: 'Research papers and articles', 
            icon: 'file-text', 
            color: '#F59E0B',
            is_default: true,
            is_custom: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          { 
            id: '3', 
            name: 'Notes', 
            description: 'Personal and study notes', 
            icon: 'edit', 
            color: '#06B6D4',
            is_default: true,
            is_custom: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          { 
            id: '4', 
            name: 'Videos', 
            description: 'Educational videos', 
            icon: 'video', 
            color: '#EC4899',
            is_default: true,
            is_custom: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          { 
            id: '5', 
            name: 'Images', 
            description: 'Diagrams and charts', 
            icon: 'image', 
            color: '#84CC16',
            is_default: true,
            is_custom: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
        ];
      }
    }
  }

  static async createCategory(categoryData: CreateCategoryRequest): Promise<KnowledgeCategory> {
    try {
      const result = await api.post<{ data: KnowledgeCategory }>(API_ENDPOINTS.KNOWLEDGE_BASE.CATEGORIES, categoryData);
      return result.data;
    } catch (error) {
      console.error('Failed to create category:', error);
      // Fallback to direct Supabase
      return await dbHelpers.createCategory({
        ...categoryData,
        is_default: false,
        is_custom: true,
      });
    }
  }

  // File Upload with Compression
  static async uploadFile(file: File, metadata: FileMetadata): Promise<UploadResponse> {
    try {
      console.log('Starting file upload process...');
      console.log('File details:', {
        name: file.name,
        type: file.type,
        size: file.size
      });
      
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadData = {
        title: metadata.title,
        description: metadata.description,
        categoryId: metadata.categoryId,
        custom_category_type: metadata.customCategoryType,
        metadata: metadata.metadata,
        userId: metadata.userId || '550e8400-e29b-41d4-a716-446655440000', // Default user ID
        file_name: file.name,
        mime_type: file.type,
        file_size: file.size,
      };
      
      console.log('Upload metadata:', uploadData);
      formData.append('uploadData', JSON.stringify(uploadData));

      console.log('Making upload request to:', API_ENDPOINTS.KNOWLEDGE_BASE.UPLOAD);
      const response = await api.upload(API_ENDPOINTS.KNOWLEDGE_BASE.UPLOAD, formData);
      
      if (!response.ok) {
        // Try to get error message from response
        const errorText = await response.text();
        console.error('Upload response not OK:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        
        let errorMessage = 'Upload failed';
        
        try {
          // Try to parse as JSON
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          // If not JSON, use the raw text if available
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }
      
      console.log('Upload successful, parsing response...');
      const result = await response.json();
      return result as UploadResponse;
    } catch (error) {
      console.error('Upload error:', error);
      throw error instanceof Error ? error : new Error('Upload failed');
    }
  }

  // Knowledge Items Management
  static async getKnowledgeItems(filters?: SearchFilters): Promise<KnowledgeItem[]> {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (filters?.categoryId) {
        params.append('categoryId', filters.categoryId);
      }

      const endpoint = `${API_ENDPOINTS.KNOWLEDGE_BASE.ITEMS}${params.toString() ? `?${params.toString()}` : ''}`;
      const result = await api.get<{ data: KnowledgeItem[] }>(endpoint);
      return result.data || [];
    } catch (error) {
      console.error('Failed to fetch knowledge items:', error);
      
      // Fallback to direct Supabase
      try {
        return await dbHelpers.getKnowledgeItems(filters);
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        return [];
      }
    }
  }

  static async getKnowledgeItemById(id: string): Promise<KnowledgeItem> {
    try {
      const result = await api.get<{ data: KnowledgeItem }>(`${API_ENDPOINTS.KNOWLEDGE_BASE.ITEMS}/${id}`);
      return result.data;
    } catch (error) {
      console.error('Failed to fetch knowledge item:', error);
      const { data, error: dbError } = await supabase
        .from('knowledge_items')
        .select(`
          *,
          knowledge_categories(name, color, icon)
        `)
        .eq('id', id)
        .single();

      if (dbError) throw dbError;
      return data as KnowledgeItem;
    }
  }

  static async updateKnowledgeItem(id: string, updates: Partial<KnowledgeItem>): Promise<KnowledgeItem> {
    try {
      const result = await api.put<{ data: KnowledgeItem }>(`${API_ENDPOINTS.KNOWLEDGE_BASE.ITEMS}/${id}`, updates);
      return result.data;
    } catch (error) {
      console.error('Failed to update knowledge item:', error);
      const { data, error: dbError } = await supabase
        .from('knowledge_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (dbError) throw dbError;
      return data as KnowledgeItem;
    }
  }

  static async deleteKnowledgeItem(id: string): Promise<void> {
    try {
      await api.delete(`${API_ENDPOINTS.KNOWLEDGE_BASE.ITEMS}/${id}`);
    } catch (error) {
      console.error('Failed to delete knowledge item:', error);
      const { error: dbError } = await supabase
        .from('knowledge_items')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;
    }
  }

  // Search and Discovery
  static async searchKnowledgeItems(query: string, filters?: SearchFilters): Promise<SearchResult> {
    try {
      const params = new URLSearchParams({ query });
      if (filters?.categoryId) {
        params.append('categoryId', filters.categoryId);
      }

      const endpoint = `${API_ENDPOINTS.KNOWLEDGE_BASE.ITEMS}/search?${params.toString()}`;
      const result = await api.get<{ data: SearchResult }>(endpoint);
      return {
        items: result.data.items,
        totalCount: result.data.items.length,
        facets: result.data.facets
      };
    } catch (error) {
      console.error('Failed to search knowledge items:', error);
      const items = await dbHelpers.searchKnowledgeItems(query, filters);
      const facets = this.calculateSearchFacets(items);
      return {
        items,
        totalCount: items.length,
        facets
      };
    }
  }

  private static calculateSearchFacets(items: KnowledgeItem[]) {
    const categories = new Map<string, { id: string; name: string; count: number }>();
    const subjects = new Map<string, number>();
    const contentTypes = new Map<string, number>();
    const tags = new Map<string, number>();

    items.forEach(item => {
      // Count categories
      if (item.knowledge_categories) {
        const cat = item.knowledge_categories;
        if (!categories.has(cat.id)) {
          categories.set(cat.id, { id: cat.id, name: cat.name, count: 0 });
        }
        categories.get(cat.id)!.count++;
      }

      // Count subjects
      if (item.metadata?.subject) {
        subjects.set(
          item.metadata.subject,
          (subjects.get(item.metadata.subject) || 0) + 1
        );
      }

      // Count content types
      contentTypes.set(
        item.file_type,
        (contentTypes.get(item.file_type) || 0) + 1
      );

      // Count tags
      item.metadata?.tags?.forEach(tag => {
        tags.set(tag, (tags.get(tag) || 0) + 1);
      });
    });

    return {
      categories: Array.from(categories.values()),
      subjects: Array.from(subjects.entries()).map(([name, count]) => ({ name, count })),
      contentTypes: Array.from(contentTypes.entries()).map(([type, count]) => ({ type, count })),
      tags: Array.from(tags.entries()).map(([tag, count]) => ({ tag, count }))
    };
  }

  // Generated Content (AI Features)
  static async generateMindmap(knowledgeItemId: string, subject?: string): Promise<GeneratedContent> {
    try {
      const result = await api.post<{ data: GeneratedContent }>(
        `${API_ENDPOINTS.KNOWLEDGE_BASE.ITEMS}/${knowledgeItemId}/generate-mindmap`,
        { subject }
      );
      return result.data;
    } catch (error) {
      console.error('Mindmap generation failed:', error);
      throw error;
    }
  }

  static async generateNotes(knowledgeItemId: string, subject?: string): Promise<GeneratedContent> {
    try {
      const result = await api.post<{ data: GeneratedContent }>(
        `${API_ENDPOINTS.KNOWLEDGE_BASE.ITEMS}/${knowledgeItemId}/generate-notes`,
        { subject }
      );
      return result.data;
    } catch (error) {
      console.error('Notes generation failed:', error);
      throw error;
    }
  }

  static async generateSummary(knowledgeItemId: string): Promise<GeneratedContent> {
    try {
      const result = await api.post<{ data: GeneratedContent }>(
        `${API_ENDPOINTS.KNOWLEDGE_BASE.ITEMS}/${knowledgeItemId}/generate-summary`,
        {}
      );
      return result.data;
    } catch (error) {
      console.error('Summary generation failed:', error);
      // Fallback to local summary generation
      return this.generateLocalSummary(knowledgeItemId);
    }
  }

  private static async generateLocalSummary(knowledgeItemId: string): Promise<GeneratedContent> {
    // Get the knowledge item to extract content for summary
    const item = await this.getKnowledgeItemById(knowledgeItemId);
    
    // Generate a real summary based on the content
    let summary = 'No content available to summarize.';
    let keyPoints: string[] = [];
    let wordCount = 0;
    
    if (item.extracted_text) {
      const text = item.extracted_text;
      wordCount = text.split(/\s+/).length;
      
      // Create a simple but functional summary
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const firstSentences = sentences.slice(0, 3).map(s => s.trim()).filter(s => s.length > 0);
      summary = firstSentences.join('. ') + (firstSentences.length > 0 ? '.' : '');
      
      // Extract key points (sentences with important keywords)
      const importantWords = ['important', 'key', 'main', 'primary', 'essential', 'critical', 'significant', 'major', 'conclusion', 'summary'];
      keyPoints = sentences
        .filter(sentence => 
          importantWords.some(word => 
            sentence.toLowerCase().includes(word)
          )
        )
        .slice(0, 5)
        .map(s => s.trim())
        .filter(s => s.length > 0);
      
      // If no key points found, use first few sentences
      if (keyPoints.length === 0) {
        keyPoints = sentences.slice(0, 3).map(s => s.trim()).filter(s => s.length > 0);
      }
    } else if (item.title) {
      summary = `This document is titled "${item.title}"` + (item.description ? ` and is described as: ${item.description}` : '.');
      keyPoints = [`Title: ${item.title}`];
      if (item.description) {
        keyPoints.push(`Description: ${item.description}`);
      }
    }

    const { data, error } = await supabase
      .from('generated_content')
      .insert({
        knowledge_item_id: knowledgeItemId,
        content_type: 'summary',
        title: `Summary: ${item.title}`,
        content_data: {
          summary,
          keyPoints,
          wordCount,
          generatedAt: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (error) throw error;
    return data;
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
      const result = await api.get<{ data: ChatConversation[] }>(API_ENDPOINTS.CHAT.SESSIONS);
      return result.data || [];
    } catch (error) {
      console.error('Failed to fetch chat conversations:', error);
      return [];
    }
  }

  static async createChatConversation(title?: string): Promise<ChatConversation> {
    try {
      const result = await api.post<{ data: ChatConversation }>(API_ENDPOINTS.CHAT.SESSIONS, { title });
      return result.data;
    } catch (error) {
      console.error('Failed to create chat conversation:', error);
      throw error;
    }
  }

  static async getChatMessages(conversationId: string): Promise<ChatMessage[]> {
    try {
      const result = await api.get<{ data: ChatMessage[] }>(`${API_ENDPOINTS.CHAT.SESSIONS}/${conversationId}/messages`);
      return result.data || [];
    } catch (error) {
      console.error('Failed to fetch chat messages:', error);
      return [];
    }
  }

  static subscribeToChatMessages(conversationId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`chat:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `conversation_id=eq.${conversationId}`
      }, callback)
      .subscribe();
  }

  static async sendChatMessage(
    conversationId: string, 
    content: string
  ): Promise<{ userMessage: ChatMessage; assistantMessage: ChatMessage }> {
    try {
      const result = await api.post<{ data: { userMessage: ChatMessage; assistantMessage: ChatMessage } }>(
        `${API_ENDPOINTS.CHAT.SESSIONS}/${conversationId}/messages`,
        { content }
      );
      return result.data;
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
      const result = await api.get<{ data: {
        totalOriginalSize: number;
        totalCompressedSize: number;
        totalSavings: number;
        averageCompressionRatio: number;
      } }>(`${API_ENDPOINTS.KNOWLEDGE_BASE.BASE}/stats/compression`);

      const stats = result.data;
      return {
        ...stats,
        formattedStats: {
          totalOriginalSize: this.formatBytes(stats.totalOriginalSize),
          totalCompressedSize: this.formatBytes(stats.totalCompressedSize),
          totalSavings: this.formatBytes(stats.totalSavings)
        }
      };
    } catch (error) {
      console.error('Failed to fetch compression stats:', error);
      return {
        totalOriginalSize: 0,
        totalCompressedSize: 0,
        totalSavings: 0,
        averageCompressionRatio: 0,
        formattedStats: {
          totalOriginalSize: '0 B',
          totalCompressedSize: '0 B',
          totalSavings: '0 B'
        }
      };
    }
  }

  static async downloadFile(knowledgeItemId: string): Promise<Blob> {
    try {
      const response = await fetch(`${API_ENDPOINTS.KNOWLEDGE_BASE.ITEMS}/${knowledgeItemId}/download`);
      if (!response.ok) throw new Error('Failed to download file');
      return await response.blob();
    } catch (error) {
      console.error('Failed to download file:', error);
      throw error;
    }
  }

  static subscribeToKnowledgeItems(callback: (payload: any) => void) {
    return supabase
      .channel('knowledge_items')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'knowledge_items'
      }, callback)
      .subscribe();
  }

  private static formatBytes(bytes: number): string {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
}
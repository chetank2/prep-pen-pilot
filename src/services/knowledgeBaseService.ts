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

const API_BASE_URL = 'http://localhost:3001/api';

// Helper function to check if backend is available
async function isBackendAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, { 
      method: 'GET',
      signal: AbortSignal.timeout(3000) // 3 second timeout
    });
    return response.ok;
  } catch {
    return false;
  }
}

// Mock data for when backend is not available
const mockCategories: KnowledgeCategory[] = [
  { id: '1', name: 'Books', description: 'Academic and reference books', icon: 'book', color: '#3B82F6', is_default: true, is_custom: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '2', name: 'Articles', description: 'Research papers and articles', icon: 'file-text', color: '#F59E0B', is_default: true, is_custom: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '3', name: 'Notes', description: 'Personal and study notes', icon: 'edit', color: '#06B6D4', is_default: true, is_custom: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '4', name: 'Videos', description: 'Educational videos and lectures', icon: 'video', color: '#EC4899', is_default: true, is_custom: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '5', name: 'Images', description: 'Diagrams, charts, and images', icon: 'image', color: '#84CC16', is_default: true, is_custom: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

export class KnowledgeBaseService {
  
  // Category Management
  static async getCategories(): Promise<KnowledgeCategory[]> {
    try {
      // Try Supabase first
      return await dbHelpers.getCategories();
    } catch (error) {
      console.warn('Supabase not available, using mock categories:', error);
      // Fallback to mock data
      return mockCategories;
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
    
    if (!backendAvailable) {
      // Mock upload for demo purposes
      console.warn('Backend not available, simulating upload...');
      
      // Simulate upload progress
      if (onProgress) {
        for (let i = 0; i <= 100; i += 10) {
          setTimeout(() => onProgress(i), i * 10);
        }
      }
      
      // Return mock uploaded item
      const mockItem: KnowledgeItem = {
        id: `mock-${Date.now()}`,
        user_id: 'demo-user',
        category_id: uploadData.categoryId,
        title: uploadData.title,
        description: uploadData.description,
        file_type: file.type.includes('pdf') ? 'pdf' : 'image',
        file_name: file.name,
        file_size: file.size,
        compressed_size: Math.floor(file.size * 0.7), // Mock 30% compression
        mime_type: file.type,
        metadata: uploadData.metadata,
        custom_category_type: uploadData.customCategoryType,
        compression_metadata: {
          compressionType: 'zlib',
          compressionRatio: 0.3,
          originalSize: file.size,
          compressedSize: Math.floor(file.size * 0.7),
          preservedForAI: true
        },
        processing_status: 'completed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      return mockItem;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('uploadData', JSON.stringify(uploadData));

      const response = await fetch(`${API_BASE_URL}/knowledge-base/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('File upload failed:', error);
      throw error;
    }
  }

  // Knowledge Items Management
  static async getKnowledgeItems(filters?: SearchFilters): Promise<KnowledgeItem[]> {
    try {
      return await dbHelpers.getKnowledgeItems(filters);
    } catch (error) {
      console.error('Failed to fetch knowledge items:', error);
      throw error;
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
    const categories = new Map<string, { id: string; name: string; count: number }>();
    const subjects = new Map<string, number>();
    const contentTypes = new Map<string, number>();
    const tags = new Map<string, number>();

    items.forEach(item => {
      // Categories
      if (item.knowledge_categories) {
        const cat = item.knowledge_categories as any;
        const key = item.category_id;
        if (!categories.has(key)) {
          categories.set(key, { id: key, name: cat.name, count: 0 });
        }
        categories.get(key)!.count++;
      }

      // Subjects
      if (item.metadata?.subject) {
        subjects.set(item.metadata.subject, (subjects.get(item.metadata.subject) || 0) + 1);
      }

      // Content types
      if (item.custom_category_type) {
        contentTypes.set(item.custom_category_type, (contentTypes.get(item.custom_category_type) || 0) + 1);
      }

      // Tags
      if (item.metadata?.tags) {
        item.metadata.tags.forEach(tag => {
          tags.set(tag, (tags.get(tag) || 0) + 1);
        });
      }
    });

    return {
      categories: Array.from(categories.values()),
      subjects: Array.from(subjects.entries()).map(([name, count]) => ({ name, count })),
      contentTypes: Array.from(contentTypes.entries()).map(([type, count]) => ({ type, count })),
      tags: Array.from(tags.entries()).map(([tag, count]) => ({ tag, count })),
    };
  }

  // AI Content Generation
  static async generateMindmap(knowledgeItemId: string, subject?: string): Promise<GeneratedContent> {
    try {
      const response = await fetch(`${API_BASE_URL}/ai/generate-mindmap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ knowledgeItemId, subject }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate mindmap');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Mindmap generation failed:', error);
      throw error;
    }
  }

  static async generateNotes(knowledgeItemId: string, subject?: string): Promise<GeneratedContent> {
    try {
      const response = await fetch(`${API_BASE_URL}/ai/generate-notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ knowledgeItemId, subject }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate notes');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Notes generation failed:', error);
      throw error;
    }
  }

  static async generateSummary(knowledgeItemId: string): Promise<GeneratedContent> {
    try {
      const response = await fetch(`${API_BASE_URL}/ai/generate-summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ knowledgeItemId }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate summary');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Summary generation failed:', error);
      throw error;
    }
  }

  // User Generated Content
  static async getUserContent(knowledgeItemId: string, contentType?: string): Promise<GeneratedContent[]> {
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
        .from('user_content')
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

  // Chat Functionality
  static async getChatConversations(): Promise<ChatConversation[]> {
    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      throw error;
    }
  }

  static async createChatConversation(title?: string): Promise<ChatConversation> {
    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .insert({
          title: title || 'New Conversation',
          user_id: 'user-123', // Mock user ID
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to create conversation:', error);
      throw error;
    }
  }

  static async getChatMessages(conversationId: string): Promise<ChatMessage[]> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      throw error;
    }
  }

  static async sendChatMessage(
    conversationId: string, 
    content: string
  ): Promise<{ userMessage: ChatMessage; assistantMessage: ChatMessage }> {
    const backendAvailable = await isBackendAvailable();
    
    if (!backendAvailable) {
      // Mock chat response when backend is not available
      console.warn('Backend not available, using mock chat response...');
      
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        conversation_id: conversationId,
        role: 'user',
        content,
        created_at: new Date().toISOString()
      };
      
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        conversation_id: conversationId,
        role: 'assistant',
        content: `I understand you're asking about "${content}". This is a demo response since the AI backend is not currently available. In the full version, I would analyze your knowledge base and provide detailed, contextual answers based on your uploaded content.`,
        created_at: new Date().toISOString()
      };
      
      return { userMessage, assistantMessage };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, content }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Failed to send chat message:', error);
      throw error;
    }
  }

  // Compression Statistics
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
      const response = await fetch(`${API_BASE_URL}/knowledge-base/compression-stats`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch compression stats');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Failed to fetch compression stats:', error);
      return {
        totalOriginalSize: 0,
        totalCompressedSize: 0,
        totalSavings: 0,
        averageCompressionRatio: 0,
        formattedStats: {
          totalOriginalSize: '0 Bytes',
          totalCompressedSize: '0 Bytes',
          totalSavings: '0 Bytes',
        }
      };
    }
  }

  // File Download
  static async downloadFile(knowledgeItemId: string): Promise<Blob> {
    try {
      const response = await fetch(`${API_BASE_URL}/knowledge-base/download/${knowledgeItemId}`);
      
      if (!response.ok) {
        throw new Error('Failed to download file');
      }

      return await response.blob();
    } catch (error) {
      console.error('File download failed:', error);
      throw error;
    }
  }

  // Real-time subscriptions
  static subscribeToKnowledgeItems(callback: (payload: any) => void) {
    return supabase
      .channel('knowledge_items_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'knowledge_items' }, 
        callback
      )
      .subscribe();
  }

  static subscribeToChatMessages(conversationId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`chat_messages_${conversationId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`
        }, 
        callback
      )
      .subscribe();
  }
} 
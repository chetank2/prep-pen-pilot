import { KnowledgeCategory, KnowledgeItem, GeneratedContent } from '../types/knowledgeBase';
import { getApiUrl, API_ENDPOINTS } from '../lib/config';

class KnowledgeBaseAPI {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    try {
      const response = await fetch(`${getApiUrl(API_ENDPOINTS.KNOWLEDGE_BASE.CATEGORIES.replace('/categories', ''))}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        let errorMessage = 'Request failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || `HTTP ${response.status}`;
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
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
        
        // Otherwise return the whole result
        return result;
      }
      
      return result;
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  async getCategories(): Promise<KnowledgeCategory[]> {
    return this.request<KnowledgeCategory[]>('/categories');
  }

  async getKnowledgeItems(userId: string, categoryId?: string): Promise<KnowledgeItem[]> {
    const params = new URLSearchParams({ userId });
    if (categoryId) params.append('categoryId', categoryId);
    
    return this.request<KnowledgeItem[]>(`/items?${params}`);
  }

  async getKnowledgeItem(id: string): Promise<KnowledgeItem> {
    return this.request<KnowledgeItem>(`/items/${id}`);
  }

  async uploadFile(
    file: File,
    userId: string,
    categoryId: string,
    title: string,
    description?: string,
    onProgress?: (progress: number) => void
  ): Promise<KnowledgeItem> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);
    formData.append('categoryId', categoryId);
    formData.append('title', title);
    if (description) formData.append('description', description);

    const xhr = new XMLHttpRequest();
    
    return new Promise((resolve, reject) => {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          reject(new Error('Upload failed'));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      xhr.open('POST', getApiUrl(API_ENDPOINTS.KNOWLEDGE_BASE.UPLOAD));
      xhr.send(formData);
    });
  }

  async generateMindmap(itemId: string, subject?: string): Promise<GeneratedContent> {
    return this.request<GeneratedContent>(`/items/${itemId}/generate-mindmap`, {
      method: 'POST',
      body: JSON.stringify({ subject }),
    });
  }

  async generateNotes(itemId: string, subject?: string): Promise<GeneratedContent> {
    return this.request<GeneratedContent>(`/items/${itemId}/generate-notes`, {
      method: 'POST',
      body: JSON.stringify({ subject }),
    });
  }

  async getGeneratedContent(itemId: string, type?: string): Promise<GeneratedContent[]> {
    const params = type ? `?type=${type}` : '';
    return this.request<GeneratedContent[]>(`/items/${itemId}/generated-content${params}`);
  }
}

export const knowledgeBaseAPI = new KnowledgeBaseAPI(); 
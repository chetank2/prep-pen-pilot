import { API_CONFIG, getApiUrl, checkBackendAvailability } from '../lib/config';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PDFMetadata {
  id: string;
  filename: string;
  pageCount: number;
  size: number;
  uploadedAt: string;
  text?: string;
}

export interface Note {
  id: string;
  type: 'canvas' | 'mindmap';
  title: string;
  imageData?: string;
  data?: any;
  tags: string[];
  folderId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MindMapNode {
  title: string;
  children?: MindMapNode[];
}

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      // Use the unified configuration to get the proper API URL
      const url = getApiUrl(endpoint);
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Check if we should use backend or Netlify functions
  private async getApiBaseUrl(): Promise<string> {
    if (API_CONFIG.USE_NETLIFY_FUNCTIONS) {
      return API_CONFIG.BASE_URL;
    }
    
    const backendAvailable = await checkBackendAvailability();
    return backendAvailable ? API_CONFIG.DEVELOPMENT_API : API_CONFIG.BASE_URL;
  }

  // PDF Operations
  async uploadPDF(file: File): Promise<ApiResponse<PDFMetadata>> {
    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const baseUrl = await this.getApiBaseUrl();
      const response = await fetch(`${baseUrl}/pdf/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      return data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  async getPDFMetadata(id: string): Promise<ApiResponse<PDFMetadata>> {
    return this.request<PDFMetadata>(`/pdf/${id}`);
  }

  async getPDFs(): Promise<ApiResponse<PDFMetadata[]>> {
    return this.request<PDFMetadata[]>(`/pdf`);
  }

  async extractText(pdfId: string, startPage: number, endPage: number): Promise<ApiResponse<{ text: string; pageRange: { startPage: number; endPage: number } }>> {
    return this.request(`/pdf/extract-text`, {
      method: 'POST',
      body: JSON.stringify({ pdfId, startPage, endPage }),
    });
  }

  // AI Operations
  async summarizeText(text: string, context?: string): Promise<ApiResponse<{ summary: string; originalLength: number; summaryLength: number }>> {
    return this.request(`/ai/summarize`, {
      method: 'POST',
      body: JSON.stringify({ text, context }),
    });
  }

  async generateMindMap(text: string, topic?: string): Promise<ApiResponse<MindMapNode>> {
    return this.request(`/ai/mindmap`, {
      method: 'POST',
      body: JSON.stringify({ text, topic }),
    });
  }

  async askQuestion(question: string, context?: string): Promise<ApiResponse<{ question: string; answer: string; timestamp: string }>> {
    return this.request(`/ai/question`, {
      method: 'POST',
      body: JSON.stringify({ question, context }),
    });
  }

  // Notes Operations - Updated to use new endpoint structure
  async saveCanvasNote(title: string, imageData: string, tags: string[] = [], folderId?: string): Promise<ApiResponse<Note>> {
    return this.request(`/notes/canvas`, {
      method: 'POST',
      body: JSON.stringify({ title, imageData, tags, folderId }),
    });
  }

  async saveMindMap(title: string, data: any, tags: string[] = [], folderId?: string): Promise<ApiResponse<Note>> {
    return this.request(`/notes/mindmap`, {
      method: 'POST',
      body: JSON.stringify({ title, data, tags, folderId }),
    });
  }

  async getNotes(type?: string, folderId?: string): Promise<ApiResponse<Note[]>> {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (folderId) params.append('folderId', folderId);
    
    return this.request<Note[]>(`/notes?${params.toString()}`);
  }

  async getNote(id: string): Promise<ApiResponse<Note>> {
    return this.request<Note>(`/notes/${id}`);
  }

  async updateNote(id: string, updates: Partial<Note>): Promise<ApiResponse<Note>> {
    return this.request(`/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteNote(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.request(`/notes/${id}`, {
      method: 'DELETE',
    });
  }

  // Health check for backend availability
  async healthCheck(): Promise<boolean> {
    try {
      const baseUrl = await this.getApiBaseUrl();
      const response = await fetch(`${baseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000)
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const apiService = new ApiService(); 
import { API_BASE_URL, APP_CONFIG, validateFile, formatFileSize } from '../lib/config';
import { 
  ChatSession, 
  ChatMessage, 
  ChatContext, 
  AIGenerationRequest,
  SaveContentRequest
} from '../types/chat';

export class ChatService {
  private static readonly BASE_URL = `${API_BASE_URL}/chat`;
  private static readonly USER_ID = '550e8400-e29b-41d4-a716-446655440000';

  // Session Management
  static async createSession(sessionData: {
    title?: string;
    folder_id?: string;
    context_type?: 'general' | 'folder' | 'document';
    context_data?: Record<string, any>;
  }): Promise<ChatSession> {
    try {
      const response = await fetch(`${this.BASE_URL}/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...sessionData,
          title: sessionData.title || 'New Chat',
          context_type: sessionData.context_type || 'general',
          context_data: sessionData.context_data || {},
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create session: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Failed to create chat session:', error);
      throw error;
    }
  }

  static async getSessions(folderId?: string): Promise<ChatSession[]> {
    try {
      const url = folderId 
        ? `${this.BASE_URL}/sessions?userId=${this.USER_ID}&folderId=${folderId}`
        : `${this.BASE_URL}/sessions?userId=${this.USER_ID}`;

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch sessions: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Failed to fetch chat sessions:', error);
      return [];
    }
  }

  static async getMessages(sessionId: string): Promise<ChatMessage[]> {
    try {
      const response = await fetch(`${this.BASE_URL}/sessions/${sessionId}/messages`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      return [];
    }
  }

  // Send message with optional files
  static async sendMessage(
    sessionId: string, 
    content: string, 
    files?: File[], 
    context?: ChatContext
  ): Promise<any> {
    try {
      // Validate files if provided
      if (files && files.length > 0) {
        if (files.length > APP_CONFIG.chat.maxFilesPerMessage) {
          throw new Error(`Maximum ${APP_CONFIG.chat.maxFilesPerMessage} files allowed per message`);
        }

        for (const file of files) {
          const validation = validateFile(file);
          if (!validation.valid) {
            throw new Error(validation.error);
          }
        }
      }

      // Validate message length
      if (content.length > APP_CONFIG.chat.maxMessageLength) {
        throw new Error(`Message exceeds maximum length of ${APP_CONFIG.chat.maxMessageLength} characters`);
      }

      // Prepare form data
      const formData = new FormData();
      formData.append('content', content);

      if (files && files.length > 0) {
        files.forEach(file => formData.append('files', file));
      }

      if (context) {
        formData.append('context', JSON.stringify(context));
      }

      const response = await fetch(`${this.BASE_URL}/sessions/${sessionId}/messages`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }

  // Generate content (mindmap, notes, etc.)
  static async generateContent(request: AIGenerationRequest): Promise<any> {
    try {
      if (!request.type || !request.content || !request.user_query) {
        throw new Error('Type, content, and user_query are required');
      }

      const response = await fetch(`${this.BASE_URL}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Content generation failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Content generation failed:', error);
      throw error;
    }
  }

  // Save content to folder
  static async saveContent(request: SaveContentRequest): Promise<any> {
    try {
      if (!request.content || !request.content_type || !request.title || !request.folder_id) {
        throw new Error('Content, content_type, title, and folder_id are required');
      }

      const response = await fetch(`${this.BASE_URL}/save-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to save content: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Failed to save content:', error);
      throw error;
    }
  }

  // Helper methods
  static createContext(
    type: 'general' | 'folder' | 'document',
    options: {
      folder_id?: string;
      document_ids?: string[];
      previous_messages?: ChatMessage[];
    } = {}
  ): ChatContext {
    return {
      type,
      folder_id: options.folder_id,
      document_ids: options.document_ids,
      previous_messages: options.previous_messages,
    };
  }

  static validateMessage(content: string, files?: File[]): { valid: boolean; error?: string } {
    if (!content.trim() && (!files || files.length === 0)) {
      return { valid: false, error: 'Please enter a message or attach files' };
    }

    if (content.length > APP_CONFIG.chat.maxMessageLength) {
      return { 
        valid: false, 
        error: `Message too long (${content.length}/${APP_CONFIG.chat.maxMessageLength} characters)` 
      };
    }

    if (files && files.length > APP_CONFIG.chat.maxFilesPerMessage) {
      return { 
        valid: false, 
        error: `Too many files (${files.length}/${APP_CONFIG.chat.maxFilesPerMessage} max)` 
      };
    }

    if (files) {
      for (const file of files) {
        const validation = validateFile(file);
        if (!validation.valid) {
          return validation;
        }
      }
    }

    return { valid: true };
  }

  static formatAttachment(file: File): {
    name: string;
    size: string;
    type: string;
    icon: string;
  } {
    return {
      name: file.name,
      size: formatFileSize(file.size),
      type: this.getFileType(file.type),
      icon: this.getFileIcon(file.type),
    };
  }

  private static getFileType(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'Image';
    if (mimeType === 'application/pdf') return 'PDF';
    if (mimeType.includes('word')) return 'Word Document';
    if (mimeType.includes('powerpoint')) return 'PowerPoint';
    if (mimeType.includes('text/')) return 'Text Document';
    return 'Document';
  }

  private static getFileIcon(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType === 'application/pdf') return 'file-pdf';
    if (mimeType.includes('word')) return 'file-text';
    if (mimeType.includes('powerpoint')) return 'presentation';
    if (mimeType.includes('text/')) return 'file-text';
    return 'file';
  }
} 
import { Folder, FolderContent, FolderStats } from '../types/chat';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export class FolderService {
  private static readonly BASE_URL = `${API_BASE_URL}/folders`;

  // Get all folders for user
  static async getFolders(): Promise<Folder[]> {
    try {
      const response = await fetch(`${this.BASE_URL}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Failed to fetch folders:', error);
      throw new Error('Unable to fetch folders. Please check your connection.');
    }
  }

  // Create new folder
  static async createFolder(folderData: {
    name: string;
    description?: string;
    color?: string;
    icon?: string;
    position?: number;
  }): Promise<Folder> {
    try {
      const response = await fetch(`${this.BASE_URL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(folderData),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Failed to create folder:', error);
      throw error;
    }
  }

  // Update folder
  static async updateFolder(folderId: string, updates: Partial<Folder>): Promise<Folder> {
    try {
      const response = await fetch(`${this.BASE_URL}/${folderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Failed to update folder:', error);
      throw error;
    }
  }

  // Delete folder
  static async deleteFolder(folderId: string): Promise<void> {
    try {
      const response = await fetch(`${this.BASE_URL}/${folderId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to delete folder:', error);
      throw error;
    }
  }

  // Get folder contents
  static async getFolderContents(folderId: string, contentType?: string): Promise<any[]> {
    try {
      const url = contentType 
        ? `${this.BASE_URL}/${folderId}/contents?contentType=${contentType}`
        : `${this.BASE_URL}/${folderId}/contents`;

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Failed to fetch folder contents:', error);
      return [];
    }
  }

  // Add content to folder
  static async addToFolder(
    folderId: string, 
    contentId: string, 
    contentType: 'knowledge_item' | 'generated_content' | 'chat_session'
  ): Promise<FolderContent> {
    try {
      const response = await fetch(`${this.BASE_URL}/${folderId}/contents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentId,
          contentType,
          position: 0,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Failed to add content to folder:', error);
      throw error;
    }
  }

  // Remove content from folder
  static async removeFromFolder(
    folderId: string, 
    contentId: string, 
    contentType: 'knowledge_item' | 'generated_content' | 'chat_session'
  ): Promise<void> {
    try {
      const response = await fetch(`${this.BASE_URL}/${folderId}/contents`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentId,
          contentType,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to remove content from folder:', error);
      throw error;
    }
  }

  // Get folder statistics
  static async getFolderStats(folderId: string): Promise<any> {
    try {
      const response = await fetch(`${this.BASE_URL}/${folderId}/stats`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Failed to fetch folder stats:', error);
      return {
        total_items: 0,
        knowledge_items: 0,
        generated_content: 0,
        chat_sessions: 0,
        content_types: [],
        last_updated: null,
      };
    }
  }

  // Utility methods
  static getIconComponent(iconName: string): string {
    const iconMap: Record<string, string> = {
      'graduation-cap': '🎓',
      'scroll': '📜',
      'map': '🗺️',
      'balance-scale': '⚖️',
      'trending-up': '📈',
      'folder': '📁',
      'book': '📚',
      'file-text': '📄',
      'brain': '🧠',
      'chart': '📊',
    };
    
    return iconMap[iconName] || '📁';
  }

  static getColorVariants(color: string) {
    return {
      bg: `bg-${color}-100`,
      text: `text-${color}-600`,
      border: `border-${color}-200`,
      hover: `hover:bg-${color}-50`,
    };
  }
} 
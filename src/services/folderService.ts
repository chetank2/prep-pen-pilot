import { API_BASE_URL } from '../lib/config';
import { Folder, FolderContent, FolderStats } from '../types/chat';

export class FolderService {
  private static readonly BASE_URL = `${API_BASE_URL}/folders`;
  private static readonly USER_ID = '550e8400-e29b-41d4-a716-446655440000';

  // Get all folders for user
  static async getFolders(): Promise<Folder[]> {
    try {
      const response = await fetch(`${this.BASE_URL}?userId=${this.USER_ID}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Failed to fetch folders:', error);
      return this.getMockFolders();
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
      const response = await fetch(`${this.BASE_URL}?userId=${this.USER_ID}`, {
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

  // Get mock data for offline use
  private static getMockFolders(): Folder[] {
    return [
      {
        id: '550e8400-e29b-41d4-a716-446655440010',
        user_id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'UPSC Preparation',
        description: 'Main UPSC study materials and notes',
        color: '#3B82F6',
        icon: 'graduation-cap',
        position: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440011',
        user_id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'History',
        description: 'Ancient, Medieval and Modern History',
        color: '#F59E0B',
        icon: 'scroll',
        position: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440012',
        user_id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Geography',
        description: 'Physical and Human Geography',
        color: '#84CC16',
        icon: 'map',
        position: 3,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440013',
        user_id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Polity',
        description: 'Indian Constitution and Governance',
        color: '#EC4899',
        icon: 'balance-scale',
        position: 4,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440014',
        user_id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Economics',
        description: 'Economic Survey and Budget Analysis',
        color: '#06B6D4',
        icon: 'trending-up',
        position: 5,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
  }

  // Utility methods
  static getIconComponent(iconName: string): string {
    const iconMap: Record<string, string> = {
      'graduation-cap': 'GraduationCap',
      'scroll': 'Scroll',
      'map': 'Map',
      'balance-scale': 'Scale',
      'trending-up': 'TrendingUp',
      'folder': 'Folder',
      'book': 'Book',
      'file-text': 'FileText',
      'brain': 'Brain',
      'chart': 'BarChart3',
    };
    
    return iconMap[iconName] || 'Folder';
  }

  static getColorVariants(color: string) {
    const colorMap: Record<string, any> = {
      '#3B82F6': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: 'text-blue-500' },
      '#F59E0B': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: 'text-amber-500' },
      '#84CC16': { bg: 'bg-lime-50', text: 'text-lime-700', border: 'border-lime-200', icon: 'text-lime-500' },
      '#EC4899': { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200', icon: 'text-pink-500' },
      '#06B6D4': { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', icon: 'text-cyan-500' },
      '#8B5CF6': { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', icon: 'text-violet-500' },
      '#EF4444': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: 'text-red-500' },
      '#10B981': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: 'text-emerald-500' },
    };
    
    return colorMap[color] || colorMap['#3B82F6'];
  }
} 
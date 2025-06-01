import { v4 as uuidv4 } from 'uuid';
import { KnowledgeItem, KnowledgeCategory, GeneratedContent } from '../types/knowledgeBase';
import { logger } from '../utils/logger';

// In-memory storage for now (replace with actual database later)
class InMemoryStorage {
  private categories: KnowledgeCategory[] = [
    {
      id: '1',
      name: 'Books',
      description: 'Academic books and textbooks',
      icon: 'book',
      created_at: new Date()
    },
    {
      id: '2',
      name: 'Study Material',
      description: 'Study guides and reference materials',
      icon: 'file-text',
      created_at: new Date()
    },
    {
      id: '3',
      name: 'Syllabus',
      description: 'Course syllabi and curricula',
      icon: 'list',
      created_at: new Date()
    },
    {
      id: '4',
      name: 'Articles',
      description: 'Research papers and articles',
      icon: 'newspaper',
      created_at: new Date()
    },
    {
      id: '5',
      name: 'Videos',
      description: 'Educational videos and lectures',
      icon: 'video',
      created_at: new Date()
    },
    {
      id: '6',
      name: 'Audio',
      description: 'Podcasts and audio lectures',
      icon: 'headphones',
      created_at: new Date()
    },
    {
      id: '7',
      name: 'Images',
      description: 'Diagrams, charts, and visual aids',
      icon: 'image',
      created_at: new Date()
    },
    {
      id: '8',
      name: 'Text Notes',
      description: 'Personal notes and text documents',
      icon: 'edit',
      created_at: new Date()
    }
  ];

  private knowledgeItems: KnowledgeItem[] = [];
  private generatedContent: GeneratedContent[] = [];

  getCategories(): KnowledgeCategory[] {
    return this.categories;
  }

  getCategoryById(id: string): KnowledgeCategory | undefined {
    return this.categories.find(cat => cat.id === id);
  }

  createKnowledgeItem(item: Omit<KnowledgeItem, 'id' | 'created_at' | 'updated_at'>): KnowledgeItem {
    const newItem: KnowledgeItem = {
      ...item,
      id: uuidv4(),
      created_at: new Date(),
      updated_at: new Date()
    };
    
    this.knowledgeItems.push(newItem);
    return newItem;
  }

  getKnowledgeItems(userId: string, categoryId?: string): KnowledgeItem[] {
    let items = this.knowledgeItems.filter(item => item.user_id === userId);
    
    if (categoryId) {
      items = items.filter(item => item.category_id === categoryId);
    }
    
    return items.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
  }

  getKnowledgeItemById(id: string): KnowledgeItem | undefined {
    return this.knowledgeItems.find(item => item.id === id);
  }

  updateKnowledgeItem(id: string, updates: Partial<KnowledgeItem>): KnowledgeItem | undefined {
    const index = this.knowledgeItems.findIndex(item => item.id === id);
    if (index === -1) return undefined;

    const existingItem = this.knowledgeItems[index];
    if (!existingItem) return undefined;

    const updatedItem: KnowledgeItem = {
      id: existingItem.id,
      user_id: updates.user_id ?? existingItem.user_id,
      category_id: updates.category_id ?? existingItem.category_id,
      title: updates.title ?? existingItem.title,
      description: updates.description ?? existingItem.description,
      file_type: updates.file_type ?? existingItem.file_type,
      file_path: updates.file_path ?? existingItem.file_path,
      file_size: updates.file_size ?? existingItem.file_size,
      content_text: updates.content_text ?? existingItem.content_text,
      metadata: updates.metadata ?? existingItem.metadata,
      processing_status: updates.processing_status ?? existingItem.processing_status,
      created_at: existingItem.created_at,
      updated_at: new Date()
    };

    this.knowledgeItems[index] = updatedItem;
    return updatedItem;
  }

  createGeneratedContent(content: Omit<GeneratedContent, 'id' | 'created_at'>): GeneratedContent {
    const newContent: GeneratedContent = {
      ...content,
      id: uuidv4(),
      created_at: new Date()
    };
    
    this.generatedContent.push(newContent);
    return newContent;
  }

  getGeneratedContent(knowledgeItemId: string, contentType?: string): GeneratedContent[] {
    let content = this.generatedContent.filter(c => c.knowledge_item_id === knowledgeItemId);
    
    if (contentType) {
      content = content.filter(c => c.content_type === contentType);
    }
    
    return content.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
  }
}

export class KnowledgeBaseService {
  private storage = new InMemoryStorage();

  async getCategories(): Promise<KnowledgeCategory[]> {
    return this.storage.getCategories();
  }

  async getCategoryById(id: string): Promise<KnowledgeCategory | null> {
    const category = this.storage.getCategoryById(id);
    return category || null;
  }

  async createKnowledgeItem(data: {
    user_id: string;
    category_id: string;
    title: string;
    description?: string;
    file_type: KnowledgeItem['file_type'];
    file_path?: string;
    file_size?: number;
    content_text?: string;
    metadata?: Record<string, any>;
  }): Promise<KnowledgeItem> {
    const item = this.storage.createKnowledgeItem({
      ...data,
      processing_status: 'pending'
    });

    logger.info(`Created knowledge item: ${item.id}`);
    return item;
  }

  async getKnowledgeItems(userId: string, categoryId?: string): Promise<KnowledgeItem[]> {
    return this.storage.getKnowledgeItems(userId, categoryId);
  }

  async getKnowledgeItemById(id: string): Promise<KnowledgeItem | null> {
    const item = this.storage.getKnowledgeItemById(id);
    return item || null;
  }

  async updateKnowledgeItem(id: string, updates: Partial<KnowledgeItem>): Promise<KnowledgeItem | null> {
    const item = this.storage.updateKnowledgeItem(id, updates);
    return item || null;
  }

  async createGeneratedContent(data: {
    knowledge_item_id: string;
    content_type: GeneratedContent['content_type'];
    content_data: Record<string, any>;
    prompt_used?: string;
  }): Promise<GeneratedContent> {
    const content = this.storage.createGeneratedContent(data);
    logger.info(`Created generated content: ${content.id}`);
    return content;
  }

  async getGeneratedContent(knowledgeItemId: string, contentType?: string): Promise<GeneratedContent[]> {
    return this.storage.getGeneratedContent(knowledgeItemId, contentType);
  }
} 
export interface KnowledgeCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  created_at: string;
}

export interface KnowledgeItem {
  id: string;
  user_id: string;
  category_id: string;
  title: string;
  description?: string;
  file_type: 'pdf' | 'video' | 'audio' | 'image' | 'text' | 'url';
  file_path?: string;
  file_size?: number;
  content_text?: string;
  metadata?: Record<string, any>;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface GeneratedContent {
  id: string;
  knowledge_item_id: string;
  content_type: 'mindmap' | 'notes' | 'summary' | 'chart';
  content_data: Record<string, any>;
  prompt_used?: string;
  created_at: string;
} 
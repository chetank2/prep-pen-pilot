export interface KnowledgeCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  is_default: boolean; // Whether it's a system default category
  is_custom: boolean;  // Whether it's user-created
  parent_id?: string;  // For subcategories
  created_at: string;
  updated_at: string;
}

export interface CompressionStats {
  compressionRatio: number;
  originalSize: number;
  compressedSize: number;
  spaceSaved: number;
  algorithm: string;
  preservedOriginal: boolean;
}

export interface KnowledgeItem {
  id: string;
  user_id: string;
  category_id: string;
  title: string;
  description?: string;
  file_type: 'pdf' | 'video' | 'audio' | 'image' | 'text' | 'url';
  file_path?: string;
  original_file_path?: string; // Path to uncompressed original
  file_name?: string;
  file_size?: number;
  compressed_size?: number;
  mime_type?: string;
  content_text?: string;
  
  // Enhanced metadata for better categorization
  metadata?: {
    subject?: string;
    academic_year?: string;
    difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
    tags?: string[];
    source?: string;
    author?: string;
    publication_date?: string;
    exam_board?: string;
    custom_fields?: Record<string, any>;
  };
  
  // Custom category type if user creates their own
  custom_category_type?: string;
  
  // Compression metadata
  compression_metadata?: {
    compressionType: string;
    compressionRatio: number;
    originalSize: number;
    compressedSize: number;
    quality?: number;
    preservedForAI: boolean;
  };
  
  // AI processing results
  extracted_text?: string;
  summary?: string;
  key_points?: any;
  ai_analysis?: any;
  embeddings?: number[];
  
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  processing_error?: string;
  created_at: string;
  updated_at: string;
  compression_stats?: CompressionStats;
  knowledge_categories?: KnowledgeCategory;
}

export interface GeneratedContent {
  id: string;
  knowledge_item_id: string;
  content_type: 'mindmap' | 'notes' | 'summary' | 'chart' | 'flashcards' | 'quiz' | 'annotation';
  title?: string;
  content_data: Record<string, any>;
  canvas_data?: any; // For Apple Pencil annotations
  prompt_used?: string;
  ai_model?: string;
  created_at: string;
  updated_at: string;
}

// New interface for category creation
export interface CreateCategoryRequest {
  name: string;
  description: string;
  icon: string;
  color: string;
  parent_id?: string;
}

// Enhanced upload data interface
export interface UploadData {
  categoryId: string;
  title: string;
  description?: string;
  customCategoryType?: string;
  metadata: {
    subject?: string;
    academic_year?: string;
    difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
    tags?: string[];
    source?: string;
    author?: string;
    exam_board?: string;
  };
}

// Chat interfaces
export interface ChatConversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  referenced_items?: string[]; // Array of knowledge_item IDs
  context_used?: any; // What context was used for this response
  generated_content?: {
    type: 'mindmap' | 'summary' | 'notes' | 'diagram';
    data: any;
  };
  created_at: string;
}

// Compression interfaces
export interface CompressionResult {
  compressedBuffer: Buffer;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  extractedText?: string;
  metadata: {
    compressionType: string;
    quality?: number;
    preservedForAI: boolean;
  };
}

export interface CompressionOptions {
  imageQuality?: number;
  videoQuality?: 'low' | 'medium' | 'high';
  audioQuality?: 'low' | 'medium' | 'high';
  preserveOriginal?: boolean;
}

// Search and filter interfaces
export interface SearchFilters {
  categoryId?: string;
  contentType?: string;
  subject?: string;
  difficultyLevel?: string;
  tags?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  userId?: string;
}

export interface SearchResult {
  items: KnowledgeItem[];
  totalCount: number;
  facets?: {
    categories: Array<{ id: string; name: string; count: number }>;
    subjects: Array<{ name: string; count: number }>;
    contentTypes: Array<{ type: string; count: number }>;
    tags: Array<{ tag: string; count: number }>;
  };
} 
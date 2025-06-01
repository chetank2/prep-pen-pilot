export interface Folder {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  folder_id?: string;
  context_type: 'general' | 'folder' | 'document';
  context_data: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments: FileAttachment[];
  generated_content_ids: string[];
  context_used: {
    knowledge_items?: number;
    context_length?: number;
    sources?: string[];
  };
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
}

export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
  processing_status: 'uploading' | 'processing' | 'completed' | 'failed';
}

export interface FolderContent {
  id: string;
  folder_id: string;
  content_id: string;
  content_type: 'knowledge_item' | 'generated_content' | 'chat_session';
  position: number;
  added_at: string;
}

export interface SaveContentRequest {
  content: string;
  content_type: 'summary' | 'notes' | 'mindmap' | 'chart' | 'analysis';
  title: string;
  folder_id: string;
  tags?: string[];
  source_message_id?: string;
  knowledge_item_id?: string;
}

export interface ChatContext {
  type: 'general' | 'folder' | 'document';
  folder_id?: string;
  document_ids?: string[];
  previous_messages?: ChatMessage[];
}

export interface AIGenerationRequest {
  type: 'summary' | 'notes' | 'mindmap' | 'chart' | 'analysis' | 'chat_response';
  content: string;
  context?: ChatContext;
  user_query: string;
  options?: {
    format?: 'bullet' | 'paragraph' | 'outline' | 'visual';
    depth?: 'brief' | 'detailed' | 'comprehensive';
    style?: 'academic' | 'casual' | 'professional';
  };
}

export interface ChatStats {
  total_sessions: number;
  total_messages: number;
  folders_count: number;
  saved_content_count: number;
  recent_activity: {
    date: string;
    sessions: number;
    messages: number;
  }[];
}

export interface FolderStats {
  id: string;
  name: string;
  knowledge_items_count: number;
  generated_content_count: number;
  chat_sessions_count: number;
  last_updated: string;
}

// Extended from existing types
export interface EnhancedGeneratedContent {
  id: string;
  knowledge_item_id?: string;
  chat_message_id?: string;
  folder_id?: string;
  content_type: 'mindmap' | 'notes' | 'summary' | 'chart' | 'flashcards' | 'quiz' | 'annotation' | 'analysis';
  title?: string;
  user_title?: string;
  content_data: Record<string, any>;
  canvas_data?: any;
  prompt_used?: string;
  ai_model?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface ChatCompletionRequest {
  message: string;
  session_id: string;
  attachments?: File[];
  context?: ChatContext;
}

export interface ChatCompletionResponse {
  user_message: ChatMessage;
  assistant_message: ChatMessage;
  suggestions?: string[];
  generated_content?: EnhancedGeneratedContent[];
}

// UI State types
export interface ChatUIState {
  current_session: ChatSession | null;
  messages: ChatMessage[];
  loading: boolean;
  typing: boolean;
  error?: string;
}

export interface FolderUIState {
  folders: Folder[];
  active_folder: Folder | null;
  folder_contents: Record<string, any[]>;
  loading: boolean;
  error?: string;
}

export interface AppUIState {
  chat: ChatUIState;
  folders: FolderUIState;
  sidebar_open: boolean;
  save_modal_open: boolean;
  current_content_to_save?: {
    content: string;
    type: string;
    message_id: string;
  };
} 
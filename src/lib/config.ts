// Environment configuration for the frontend application

export const isDevelopment = import.meta.env.MODE === 'development';
export const isProduction = import.meta.env.MODE === 'production';

// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Supabase Configuration
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Frontend Configuration
export const APP_CONFIG = {
  // App Information
  name: 'UPSC Prep Assistant',
  version: '2.0.0',
  description: 'AI-powered knowledge management for UPSC preparation',

  // Chat Configuration
  chat: {
    maxMessageLength: 4000,
    maxFileSize: 100 * 1024 * 1024, // 100MB
    allowedFileTypes: [
      'application/pdf',
      'text/plain',
      'text/markdown',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    maxFilesPerMessage: 5,
    messageSuggestions: [
      'Summarize this document',
      'Create study notes',
      'Generate a mind map',
      'Explain key concepts',
      'Create practice questions'
    ]
  },

  // Folder Configuration
  folders: {
    maxFolders: 50,
    maxDepth: 5,
    defaultColors: [
      '#3B82F6', // blue
      '#F59E0B', // amber
      '#84CC16', // lime
      '#EC4899', // pink
      '#06B6D4', // cyan
      '#8B5CF6', // violet
      '#EF4444', // red
      '#10B981', // emerald
    ],
    defaultIcons: [
      'folder',
      'book',
      'graduation-cap',
      'scroll',
      'map',
      'balance-scale',
      'trending-up',
      'file-text',
      'brain',
      'chart'
    ]
  },

  // Upload Configuration
  upload: {
    maxFileSize: 100 * 1024 * 1024, // 100MB
    allowedTypes: [
      'application/pdf',
      'text/plain',
      'text/markdown',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ],
    compressionQuality: 85,
    preserveOriginal: true
  },

  // UI Configuration
  ui: {
    theme: 'light',
    sidebarWidth: 280,
    chatWidth: 400,
    animations: true,
    compactMode: false
  },

  // Storage Configuration
  storage: {
    cacheTimeout: 5 * 60 * 1000, // 5 minutes
    maxCacheSize: 50 * 1024 * 1024, // 50MB
    persistSession: true
  }
};

// API Endpoints
export const API_ENDPOINTS = {
  // Chat endpoints
  chat: {
    sessions: '/chat/sessions',
    messages: '/chat/sessions/{sessionId}/messages',
    generate: '/chat/generate',
    saveContent: '/chat/save-content'
  },

  // Folder endpoints
  folders: {
    base: '/folders',
    contents: '/folders/{folderId}/contents',
    stats: '/folders/{folderId}/stats'
  },

  // Knowledge base endpoints
  knowledgeBase: {
    items: '/knowledge-base/items',
    categories: '/knowledge-base/categories',
    upload: '/knowledge-base/upload',
    search: '/knowledge-base/search'
  },

  // Generated content endpoints
  generatedContent: {
    base: '/knowledge-base/generated-content',
    mindmap: '/knowledge-base/generate/mindmap',
    notes: '/knowledge-base/generate/notes',
    summary: '/knowledge-base/generate/summary'
  }
};

// Helper function to replace URL parameters
export function buildApiUrl(endpoint: string, params: Record<string, string> = {}): string {
  let url = `${API_BASE_URL}${endpoint}`;
  
  for (const [key, value] of Object.entries(params)) {
    url = url.replace(`{${key}}`, value);
  }
  
  return url;
}

// Helper function to get file type from MIME type
export function getFileTypeFromMime(mimeType: string): string {
  const typeMap: Record<string, string> = {
    'application/pdf': 'PDF',
    'text/plain': 'Text',
    'text/markdown': 'Markdown',
    'image/jpeg': 'Image',
    'image/png': 'Image',
    'image/gif': 'Image',
    'image/webp': 'Image',
    'application/msword': 'Word Document',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Document',
    'application/vnd.ms-powerpoint': 'PowerPoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PowerPoint'
  };
  
  return typeMap[mimeType] || 'Unknown';
}

// Helper function to format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Helper function to validate file
export function validateFile(file: File): { valid: boolean; error?: string } {
  if (!APP_CONFIG.upload.allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${getFileTypeFromMime(file.type)} is not supported`
    };
  }
  
  if (file.size > APP_CONFIG.upload.maxFileSize) {
    return {
      valid: false,
      error: `File size ${formatFileSize(file.size)} exceeds limit of ${formatFileSize(APP_CONFIG.upload.maxFileSize)}`
    };
  }
  
  return { valid: true };
}

// Environment check
export function checkEnvironment(): {
  supabaseConfigured: boolean;
  apiConfigured: boolean;
  development: boolean;
} {
  return {
    supabaseConfigured: !!(SUPABASE_URL && SUPABASE_ANON_KEY),
    apiConfigured: !!API_BASE_URL,
    development: isDevelopment
  };
} 
// Unified configuration for API endpoints and environment variables

// Environment detection
const isDevelopment = import.meta.env.DEV;
const isNetlifyProduction = window.location.hostname.includes('netlify.app');

// API Configuration
export const API_CONFIG = {
  // Base URLs for different environments
  DEVELOPMENT_API: 'http://localhost:3001/api',
  NETLIFY_API: '/api', // Uses Netlify redirects
  
  // Current API base URL - Always use Netlify functions now
  BASE_URL: '/api', // Always use Netlify functions for consistency
  
  // Feature flags - Disable backend fallback to prevent localhost:3001 calls
  USE_BACKEND_FALLBACK: false, // Changed from isDevelopment
  USE_NETLIFY_FUNCTIONS: true, // Always use Netlify functions
};

// Legacy compatibility export
export const API_BASE_URL = API_CONFIG.BASE_URL;

// Supabase Configuration
export const SUPABASE_CONFIG = {
  URL: import.meta.env.VITE_SUPABASE_URL,
  ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  IS_CONFIGURED: !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY),
};

// API Endpoints
export const API_ENDPOINTS = {
  KNOWLEDGE_BASE: {
    CATEGORIES: '/knowledge-base/categories',
    ITEMS: '/knowledge-base/items',
    UPLOAD: '/knowledge-base/upload',
    COMPRESSION_STATS: '/knowledge-base/compression-stats',
  },
  CHAT: {
    MESSAGE: '/chat/message',
    SESSIONS: '/chat/sessions',
  },
  DEBUG: {
    CATEGORIES: '/debug/categories',
    FRONTEND_CONFIG: '/test/frontend-config',
  },
  LEGACY: {
    PDF: '/pdf',
    NOTES: '/notes',
    FOLDERS: '/folders',
  },
};

// Helper function to get full API URL
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function to check if backend is available
export const checkBackendAvailability = async (): Promise<boolean> => {
  if (!API_CONFIG.USE_BACKEND_FALLBACK) return false;
  
  try {
    const response = await fetch(`${API_CONFIG.DEVELOPMENT_API}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000)
    });
    return response.ok;
  } catch {
    return false;
  }
};

// Storage Configuration
export const STORAGE_CONFIG = {
  BUCKETS: {
    KNOWLEDGE_BASE: 'knowledge-base-files',
    USER_CONTENT: 'user-content',
    THUMBNAILS: 'thumbnails',
    EXPORTS: 'exports',
  },
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
  ALLOWED_TYPES: ['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png', 'gif', 'mp4', 'mp3', 'wav'],
};

// App Configuration
export const APP_CONFIG = {
  NAME: 'PrepPen Pilot',
  VERSION: '2.0.0',
  ENVIRONMENT: isDevelopment ? 'development' : 'production',
  DEBUG_MODE: isDevelopment,
  chat: {
    maxFilesPerMessage: 5,
    maxMessageLength: 10000,
    allowedFileTypes: ['pdf', 'txt', 'md', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'gif'],
    maxFileSize: 50 * 1024 * 1024, // 50MB
  },
};

// Rate Limiting Configuration
export const RATE_LIMIT_CONFIG = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: 100,
  UPLOAD_LIMIT: 50,
  CHAT_LIMIT: 200,
};

// Utility Functions
export const validateFile = (file: File): { valid: boolean; error?: string } => {
  // Check file size
  if (file.size > STORAGE_CONFIG.MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds ${formatFileSize(STORAGE_CONFIG.MAX_FILE_SIZE)} limit`
    };
  }

  // Check file type
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  if (fileExtension && !STORAGE_CONFIG.ALLOWED_TYPES.includes(fileExtension)) {
    return {
      valid: false,
      error: `File type .${fileExtension} is not supported`
    };
  }

  // Check for chat-specific limits
  if (file.size > APP_CONFIG.chat.maxFileSize) {
    return {
      valid: false,
      error: `File size exceeds chat limit of ${formatFileSize(APP_CONFIG.chat.maxFileSize)}`
    };
  }

  const chatFileExtension = fileExtension || '';
  if (!APP_CONFIG.chat.allowedFileTypes.includes(chatFileExtension)) {
    return {
      valid: false,
      error: `File type .${chatFileExtension} is not supported in chat`
    };
  }

  return { valid: true };
};

export const formatFileSize = (bytes: number): string => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

export default {
  API_CONFIG,
  SUPABASE_CONFIG,
  API_ENDPOINTS,
  STORAGE_CONFIG,
  APP_CONFIG,
  RATE_LIMIT_CONFIG,
  getApiUrl,
  checkBackendAvailability,
  validateFile,
  formatFileSize,
}; 
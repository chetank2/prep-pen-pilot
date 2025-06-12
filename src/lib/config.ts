// Unified configuration for API endpoints and environment variables
import { portConfig } from './portConfig';

// Environment detection
const isDevelopment = import.meta.env.DEV;
const isNetlifyProduction = window.location.hostname.includes('netlify.app');

// API Configuration
const API_PORTS = [3001, 3002, 3003, 3004, 3005, 3006, 3007, 3008, 3009, 3010];
let cachedPort: number | null = null;

// Default to 3003 based on current backend port
const DEFAULT_PORT = 3003;

export const API_CONFIG = {
  getBaseUrl: () => `http://localhost:${cachedPort || DEFAULT_PORT}`,
  TIMEOUT: 30000, // 30 seconds
  RETRY_COUNT: 3,
  RETRY_DELAY: 1000, // 1 second
};

// API Endpoints - Define without base URL first
export const API_ENDPOINTS = {
  KNOWLEDGE_BASE: {
    BASE: '/api/knowledge-base',
    UPLOAD: '/api/knowledge-base/upload',
    CATEGORIES: '/api/knowledge-base/categories',
    ITEMS: '/api/knowledge-base/items',
  },
  CHAT: {
    BASE: '/api/chat',
    MESSAGE: '/api/chat/message',
    SESSIONS: '/api/chat/sessions',
  },
  FOLDERS: {
    BASE: '/api/folders',
    LIST: '/api/folders/list',
    CREATE: '/api/folders/create',
  },
  HEALTH: '/health',
};

// Get full API URL for a specific endpoint
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.getBaseUrl()}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
};

async function findActivePort() {
  console.log('Starting port discovery...');
  
  // First try the default port (3003)
  try {
    console.log('Trying default port 3003...');
    const response = await fetch('http://localhost:3003/health', {
      signal: AbortSignal.timeout(1000)
    });
    if (response.ok) {
      console.log('Default port 3003 is active');
      portConfig.updatePorts({ backend: 3003 });
      cachedPort = 3003;
      return 3003;
    }
  } catch (error) {
    console.log('Default port 3003 failed:', error.message);
  }

  // Then try other ports if default fails
  for (const port of API_PORTS.filter(p => p !== 3003)) {
    console.log(`Trying port ${port}...`);
    try {
      const response = await fetch(`http://localhost:${port}/health`, {
        signal: AbortSignal.timeout(1000)
      });
      if (response.ok) {
        console.log(`Found active backend on port ${port}`);
        portConfig.updatePorts({ backend: port });
        cachedPort = port;
        return port;
      }
    } catch (error) {
      console.log(`Port ${port} failed:`, error.message);
      continue;
    }
  }
  
  console.warn('No active backend port found, using default:', DEFAULT_PORT);
  cachedPort = DEFAULT_PORT;
  portConfig.updatePorts({ backend: DEFAULT_PORT });
  return DEFAULT_PORT;
}

// Initialize port discovery
export const initializationPromise = findActivePort().catch(error => {
  console.error('Failed to initialize API:', error);
  cachedPort = DEFAULT_PORT;
  portConfig.updatePorts({ backend: DEFAULT_PORT });
});

// Legacy compatibility export
export const API_BASE_URL = API_CONFIG.getBaseUrl();

// Rest of the configuration
export const SUPABASE_CONFIG = {
  URL: import.meta.env.VITE_SUPABASE_URL,
  ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  IS_CONFIGURED: !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY),
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
  STORAGE_CONFIG,
  APP_CONFIG,
  RATE_LIMIT_CONFIG,
  validateFile,
  formatFileSize,
  getApiUrl,
  initializationPromise,
  API_ENDPOINTS,
};
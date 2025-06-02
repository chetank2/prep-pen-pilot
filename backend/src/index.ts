import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables FIRST before any other imports
// Try multiple possible paths for the .env file
const envPaths = [
  path.join(__dirname, '../.env'),
  path.join(__dirname, '../../.env'), // Root directory from backend/src
  path.join(process.cwd(), '.env'),
  path.join(process.cwd(), '../.env'), // Parent directory
  '.env'
];

console.log('DEBUG - Trying to load .env from paths:');
envPaths.forEach(envPath => {
  console.log('  -', envPath);
});

// Try loading from the first path that exists
let envLoaded = false;
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    console.log('DEBUG - Loading .env from:', envPath);
    dotenv.config({ path: envPath });
    envLoaded = true;
    break;
  }
}

if (!envLoaded) {
  console.log('DEBUG - No .env file found in any of the paths');
}

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { logger } from './utils/logger';
import { testConnection } from './config/supabase';
import knowledgeBaseRoutes from './routes/knowledgeBaseRoutes';
import chatRoutes from './routes/chatRoutes';
import folderRoutes from './routes/folderRoutes';
import notesRoutes from './routes/notes';
import pdfRoutes from './routes/pdf';
import aiRoutes from './routes/ai';

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration - Updated to include user's current IP
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:8080',
    'http://localhost:8087',
    'http://localhost:8091',
    'http://192.168.1.8:8080',
    'http://192.168.1.8:8081',
    'http://192.168.1.8:3000',
    'http://192.168.1.8:5173',
    'https://preperation.netlify.app'
  ],
  credentials: true,
}));

// Compression middleware
app.use(compression());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Enhanced rate limiting for different endpoints
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // limit file uploads
  message: 'Too many uploads from this IP, please try again later.',
});

const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Allow more chat requests
  message: 'Too many chat messages, please slow down.',
});

// Apply rate limiting
app.use('/api', generalLimiter);
app.use('/api/knowledge-base/upload', uploadLimiter);
app.use('/api/chat', chatLimiter);

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '2.0.0',
  });
});

// Health check endpoint under /api path for frontend compatibility
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '2.0.0',
  });
});

// API routes
app.use('/api/knowledge-base', knowledgeBaseRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/ai', aiRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', error);
  
  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(isDevelopment && { stack: error.stack }),
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
async function startServer() {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      logger.error('Failed to connect to database');
      process.exit(1);
    }

    app.listen(PORT, () => {
      logger.info(`🚀 Enhanced Knowledge Base API Server running on port ${PORT}`);
      logger.info(`📊 Health check available at: http://localhost:${PORT}/health`);
      logger.info(`🤖 Chat API available at: http://localhost:${PORT}/api/chat`);
      logger.info(`📁 Folders API available at: http://localhost:${PORT}/api/folders`);
      logger.info(`📚 Knowledge Base API available at: http://localhost:${PORT}/api/knowledge-base`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer(); 
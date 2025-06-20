import express from 'express';
import multer from 'multer';
import { EnhancedFileUploadService } from '../services/enhancedFileUploadService';
import { SupabaseService } from '../services/supabaseService';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Default user UUID for demo/testing purposes
const DEFAULT_USER_UUID = '550e8400-e29b-41d4-a716-446655440000';

// Helper function to get or create default user
async function getValidUserId(userId?: string): Promise<string> {
  if (!userId || userId === 'default-user' || userId === 'undefined' || userId === 'null') {
    return DEFAULT_USER_UUID;
  }
  
  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId)) {
    logger.warn(`Invalid UUID format for userId: ${userId}, using default`);
    return DEFAULT_USER_UUID;
  }
  
  return userId;
}

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
  fileFilter: (req, file, cb) => {
    // Allow all file types for now
    cb(null, true);
  },
});

// Upload file with compression and AI processing
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    if (!req.body.uploadData) {
      return res.status(400).json({
        success: false,
        message: 'Upload data is required',
      });
    }

    const uploadData = JSON.parse(req.body.uploadData);
    const userId = await getValidUserId(req.body.userId || req.query.userId as string);
    
    logger.info('Processing file upload', {
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      userId,
    });

    const result = await EnhancedFileUploadService.processFileUpload(
      req.file,
      uploadData,
      userId
    );

    res.json({
      success: true,
      message: 'File uploaded successfully',
      data: result,
    });
  } catch (error) {
    logger.error('File upload failed:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Upload failed',
    });
  }
});

// Get knowledge items with filters
router.get('/items', async (req, res) => {
  try {
    const userId = await getValidUserId(req.query.userId as string);
    
    const filters = {
      userId,
      categoryId: req.query.categoryId as string,
      contentType: req.query.contentType as string,
      subject: req.query.subject as string,
      difficultyLevel: req.query.difficultyLevel as string,
      tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
    };

    logger.info('Fetching knowledge items with filters:', filters);

    const items = await SupabaseService.getKnowledgeItems(filters);

    res.json({
      success: true,
      data: items,
    });
  } catch (error) {
    logger.error('Failed to fetch knowledge items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch knowledge items',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get single knowledge item
router.get('/items/:id', async (req, res) => {
  try {
    const item = await SupabaseService.getKnowledgeItemById(req.params.id);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Knowledge item not found',
      });
    }

    res.json({
      success: true,
      data: item,
    });
  } catch (error) {
    logger.error('Failed to fetch knowledge item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch knowledge item',
    });
  }
});

// Update knowledge item
router.put('/items/:id', async (req, res) => {
  try {
    const updates = req.body;
    const item = await SupabaseService.updateKnowledgeItem(req.params.id, updates);

    res.json({
      success: true,
      data: item,
    });
  } catch (error) {
    logger.error('Failed to update knowledge item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update knowledge item',
    });
  }
});

// Search knowledge items
router.get('/search', async (req, res) => {
  try {
    const query = req.query.q as string;
    const userId = await getValidUserId(req.query.userId as string);
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    const filters = {
      categoryId: req.query.categoryId as string,
      contentType: req.query.contentType as string,
    };

    const items = await SupabaseService.searchKnowledgeItems(userId, query, filters);

    res.json({
      success: true,
      data: items,
    });
  } catch (error) {
    logger.error('Search failed:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed',
    });
  }
});

// Download file (decompressed)
router.get('/download/:id', async (req, res) => {
  try {
    const fileBuffer = await EnhancedFileUploadService.getDecompressedFile(req.params.id);
    const item = await SupabaseService.getKnowledgeItemById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${item.file_name}"`);
    res.setHeader('Content-Type', item.mime_type || 'application/octet-stream');
    res.send(fileBuffer);
  } catch (error) {
    logger.error('File download failed:', error);
    res.status(500).json({
      success: false,
      message: 'File download failed',
    });
  }
});

// Get compression statistics
router.get('/compression-stats', async (req, res) => {
  try {
    const userId = await getValidUserId(req.query.userId as string);

    const stats = await EnhancedFileUploadService.getCompressionStats(userId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Failed to get compression stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get compression stats',
    });
  }
});

// Regenerate AI content for existing item
router.post('/items/:id/regenerate-ai', async (req, res) => {
  try {
    await EnhancedFileUploadService.regenerateAIContent(req.params.id);

    res.json({
      success: true,
      message: 'AI content regeneration started',
    });
  } catch (error) {
    logger.error('Failed to regenerate AI content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to regenerate AI content',
    });
  }
});

// Get categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await SupabaseService.getCategories();

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    logger.error('Failed to fetch categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
    });
  }
});

// Create category
router.post('/categories', async (req, res) => {
  try {
    const categoryData = req.body;
    const category = await SupabaseService.createCategory(categoryData);

    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    logger.error('Failed to create category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create category',
    });
  }
});

// Get user content for knowledge item
router.get('/items/:id/content', async (req, res) => {
  try {
    const contentType = req.query.type as string;
    const content = await SupabaseService.getUserContent(req.params.id, contentType);

    res.json({
      success: true,
      data: content,
    });
  } catch (error) {
    logger.error('Failed to fetch user content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user content',
    });
  }
});

// Save user content
router.post('/items/:id/content', async (req, res) => {
  try {
    const contentData = {
      ...req.body,
      knowledge_item_id: req.params.id,
    };
    
    const content = await SupabaseService.createUserContent(contentData);

    res.json({
      success: true,
      data: content,
    });
  } catch (error) {
    logger.error('Failed to save user content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save user content',
    });
  }
});

export default router; 
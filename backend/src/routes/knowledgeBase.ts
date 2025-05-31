import express from 'express';
import multer from 'multer';
import { KnowledgeBaseService } from '../services/KnowledgeBaseService';
import { FileProcessingService } from '../services/FileProcessingService';
import { OpenAIService } from '../services/OpenAIService';
import { logger } from '../utils/logger';

const router = express.Router();
const knowledgeBaseService = new KnowledgeBaseService();
const fileProcessingService = new FileProcessingService();
const openAIService = new OpenAIService();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow specific file types
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'text/markdown',
      'image/jpeg',
      'image/png',
      'image/gif',
      'video/mp4',
      'video/avi',
      'video/mov',
      'audio/mp3',
      'audio/wav',
      'audio/m4a'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not supported`));
    }
  }
});

// Get all categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await knowledgeBaseService.getCategories();
    res.json(categories);
  } catch (error) {
    logger.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get knowledge items
router.get('/items', async (req, res) => {
  try {
    const { userId, categoryId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const items = await knowledgeBaseService.getKnowledgeItems(
      userId as string,
      categoryId as string
    );
    
    return res.json(items);
  } catch (error) {
    logger.error('Error fetching knowledge items:', error);
    return res.status(500).json({ error: 'Failed to fetch knowledge items' });
  }
});

// Upload and process file
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { userId, categoryId, title, description } = req.body;
    const file = req.file;

    if (!file || !userId || !categoryId || !title) {
      return res.status(400).json({ 
        error: 'File, userId, categoryId, and title are required' 
      });
    }

    // Validate category exists
    const category = await knowledgeBaseService.getCategoryById(categoryId);
    if (!category) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    // Save file
    const filePath = await fileProcessingService.saveFile(file);

    // Create knowledge item
    const knowledgeItem = await knowledgeBaseService.createKnowledgeItem({
      user_id: userId,
      category_id: categoryId,
      title,
      description,
      file_type: getFileType(file.mimetype),
      file_path: filePath,
      file_size: file.size,
      metadata: {
        originalName: file.originalname,
        mimeType: file.mimetype
      }
    });

    // Process file in background
    processFileAsync(knowledgeItem.id, file, category.name);

    return res.status(201).json(knowledgeItem);
  } catch (error) {
    logger.error('Error uploading file:', error);
    return res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Get specific knowledge item
router.get('/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const item = await knowledgeBaseService.getKnowledgeItemById(id);
    
    if (!item) {
      return res.status(404).json({ error: 'Knowledge item not found' });
    }
    
    return res.json(item);
  } catch (error) {
    logger.error('Error fetching knowledge item:', error);
    return res.status(500).json({ error: 'Failed to fetch knowledge item' });
  }
});

// Generate mindmap for knowledge item
router.post('/items/:id/generate-mindmap', async (req, res) => {
  try {
    const { id } = req.params;
    const { subject } = req.body;

    const item = await knowledgeBaseService.getKnowledgeItemById(id);
    if (!item) {
      return res.status(404).json({ error: 'Knowledge item not found' });
    }

    if (!item.content_text) {
      return res.status(400).json({ error: 'Content not yet processed' });
    }

    const mindmapSyntax = await openAIService.generateMindmap(
      item.content_text,
      subject || item.title
    );

    const generatedContent = await knowledgeBaseService.createGeneratedContent({
      knowledge_item_id: id,
      content_type: 'mindmap',
      content_data: { 
        mermaidSyntax: mindmapSyntax,
        subject: subject || item.title
      }
    });

    return res.json(generatedContent);
  } catch (error) {
    logger.error('Error generating mindmap:', error);
    return res.status(500).json({ error: 'Failed to generate mindmap' });
  }
});

// Generate notes for knowledge item
router.post('/items/:id/generate-notes', async (req, res) => {
  try {
    const { id } = req.params;
    const { subject } = req.body;

    const item = await knowledgeBaseService.getKnowledgeItemById(id);
    if (!item) {
      return res.status(404).json({ error: 'Knowledge item not found' });
    }

    if (!item.content_text) {
      return res.status(400).json({ error: 'Content not yet processed' });
    }

    const notes = await openAIService.generateNotes(
      item.content_text,
      subject || item.title
    );

    const generatedContent = await knowledgeBaseService.createGeneratedContent({
      knowledge_item_id: id,
      content_type: 'notes',
      content_data: { 
        notes,
        subject: subject || item.title
      }
    });

    return res.json(generatedContent);
  } catch (error) {
    logger.error('Error generating notes:', error);
    return res.status(500).json({ error: 'Failed to generate notes' });
  }
});

// Get generated content for knowledge item
router.get('/items/:id/generated-content', async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query;

    const content = await knowledgeBaseService.getGeneratedContent(
      id,
      type as string
    );

    return res.json(content);
  } catch (error) {
    logger.error('Error fetching generated content:', error);
    return res.status(500).json({ error: 'Failed to fetch generated content' });
  }
});

// Helper functions
function getFileType(mimeType: string): 'pdf' | 'video' | 'audio' | 'image' | 'text' | 'url' {
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('text/')) return 'text';
  return 'text';
}

async function processFileAsync(itemId: string, file: Express.Multer.File, categoryName: string) {
  try {
    // Update status to processing
    await knowledgeBaseService.updateKnowledgeItem(itemId, {
      processing_status: 'processing'
    });

    // Process file content
    const processedContent = await fileProcessingService.processFile(file, categoryName);

    // Update item with processed content
    await knowledgeBaseService.updateKnowledgeItem(itemId, {
      content_text: processedContent.text,
      metadata: {
        ...processedContent.metadata,
        chunks: processedContent.chunks.length
      },
      processing_status: 'completed'
    });

    logger.info(`Successfully processed file for item: ${itemId}`);
  } catch (error) {
    logger.error(`Error processing file for item ${itemId}:`, error);
    
    // Update status to failed
    await knowledgeBaseService.updateKnowledgeItem(itemId, {
      processing_status: 'failed'
    });
  }
}

export default router; 
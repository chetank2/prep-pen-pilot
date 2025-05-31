import express from 'express';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// Upload and parse PDF
router.post('/upload', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    const pdfId = uuidv4();
    const { originalname, buffer } = req.file;

    // Parse PDF content
    const pdfData = await pdfParse(buffer);
    
    // Extract metadata
    const metadata = {
      id: pdfId,
      filename: originalname,
      size: buffer.length,
      pageCount: pdfData.numpages,
      uploadedAt: new Date().toISOString(),
      text: pdfData.text
    };

    logger.info(`PDF uploaded successfully: ${originalname}`, { pdfId });

    res.json({
      success: true,
      data: {
        id: pdfId,
        filename: originalname,
        pageCount: pdfData.numpages,
        size: buffer.length,
        text: pdfData.text
      }
    });
  } catch (error) {
    logger.error('PDF upload failed:', error);
    res.status(500).json({ error: 'Failed to process PDF' });
  }
});

// Extract text from specific page range
router.post('/extract-text', async (req, res) => {
  try {
    const { pdfId, startPage, endPage } = req.body;

    if (!pdfId) {
      return res.status(400).json({ error: 'PDF ID is required' });
    }

    // In a real implementation, you would fetch the PDF from storage
    // For now, return a mock response
    res.json({
      success: true,
      data: {
        text: 'Sample extracted text from pages ' + startPage + ' to ' + endPage,
        pageRange: { startPage, endPage }
      }
    });
  } catch (error) {
    logger.error('Text extraction failed:', error);
    res.status(500).json({ error: 'Failed to extract text' });
  }
});

// Get PDF metadata
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // In a real implementation, fetch from database
    res.json({
      success: true,
      data: {
        id,
        filename: 'sample.pdf',
        pageCount: 120,
        size: 2048576,
        uploadedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Failed to get PDF metadata:', error);
    res.status(500).json({ error: 'Failed to get PDF metadata' });
  }
});

export default router; 
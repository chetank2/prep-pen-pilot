import express from 'express';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

const router = express.Router();

// In-memory storage for PDF metadata (replace with database in production)
interface PDFMetadata {
  id: string;
  filename: string;
  size: number;
  pageCount: number;
  uploadedAt: string;
  text: string;
}

const pdfStorage: PDFMetadata[] = [];

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
    
    // Store metadata
    const metadata: PDFMetadata = {
      id: pdfId,
      filename: originalname,
      size: buffer.length,
      pageCount: pdfData.numpages,
      uploadedAt: new Date().toISOString(),
      text: pdfData.text
    };

    pdfStorage.push(metadata);

    logger.info(`PDF uploaded successfully: ${originalname}`, { pdfId });

    return res.json({
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
    return res.status(500).json({ error: 'Failed to process PDF' });
  }
});

// Extract text from specific page range
router.post('/extract-text', async (req, res) => {
  try {
    const { pdfId, startPage, endPage } = req.body;

    if (!pdfId) {
      return res.status(400).json({ error: 'PDF ID is required' });
    }

    const pdf = pdfStorage.find(p => p.id === pdfId);

    if (!pdf) {
      return res.status(404).json({ error: 'PDF not found' });
    }

    // For now, return the full text since we don't have page-specific extraction
    // In a real implementation, you would extract text from specific pages
    const extractedText = pdf.text;

    return res.json({
      success: true,
      data: {
        text: extractedText,
        pageRange: { startPage, endPage },
        totalPages: pdf.pageCount
      }
    });
  } catch (error) {
    logger.error('Text extraction failed:', error);
    return res.status(500).json({ error: 'Failed to extract text' });
  }
});

// Get PDF metadata
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const pdf = pdfStorage.find(p => p.id === id);

    if (!pdf) {
      return res.status(404).json({ error: 'PDF not found' });
    }

    return res.json({
      success: true,
      data: {
        id: pdf.id,
        filename: pdf.filename,
        pageCount: pdf.pageCount,
        size: pdf.size,
        uploadedAt: pdf.uploadedAt
      }
    });
  } catch (error) {
    logger.error('Failed to get PDF metadata:', error);
    return res.status(500).json({ error: 'Failed to get PDF metadata' });
  }
});

// Get all PDFs
router.get('/', async (req, res) => {
  try {
    const pdfs = pdfStorage.map(pdf => ({
      id: pdf.id,
      filename: pdf.filename,
      pageCount: pdf.pageCount,
      size: pdf.size,
      uploadedAt: pdf.uploadedAt
    }));

    return res.json({
      success: true,
      data: pdfs
    });
  } catch (error) {
    logger.error('Failed to get PDFs:', error);
    return res.status(500).json({ error: 'Failed to get PDFs' });
  }
});

// Delete PDF
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const pdfIndex = pdfStorage.findIndex(p => p.id === id);

    if (pdfIndex === -1) {
      return res.status(404).json({ error: 'PDF not found' });
    }

    const pdfToDelete = pdfStorage[pdfIndex];
    if (!pdfToDelete) {
      return res.status(404).json({ error: 'PDF not found' });
    }

    pdfStorage.splice(pdfIndex, 1);

    logger.info(`PDF deleted: ${pdfToDelete.filename}`, { id });

    return res.json({
      success: true,
      message: 'PDF deleted successfully'
    });
  } catch (error) {
    logger.error('Failed to delete PDF:', error);
    return res.status(500).json({ error: 'Failed to delete PDF' });
  }
});

export default router; 
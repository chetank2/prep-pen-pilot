import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { ProcessedContent } from '../types/knowledgeBase';

export class FileProcessingService {
  private uploadDir = process.env.UPLOAD_DIR || './uploads';

  constructor() {
    // Ensure upload directory exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async processFile(file: Express.Multer.File, category: string): Promise<ProcessedContent> {
    try {
      logger.info(`Processing file: ${file.originalname}, type: ${file.mimetype}`);
      
      switch (file.mimetype) {
        case 'application/pdf':
          return await this.processPDF(file);
        case 'text/plain':
        case 'text/markdown':
          return await this.processText(file);
        case 'image/jpeg':
        case 'image/png':
        case 'image/gif':
          return await this.processImage(file);
        default:
          if (file.mimetype.startsWith('video/')) {
            return await this.processVideo(file);
          } else if (file.mimetype.startsWith('audio/')) {
            return await this.processAudio(file);
          } else {
            throw new Error(`Unsupported file type: ${file.mimetype}`);
          }
      }
    } catch (error) {
      logger.error('Error processing file:', error);
      throw error;
    }
  }

  private async processPDF(file: Express.Multer.File): Promise<ProcessedContent> {
    try {
      const pdfData = await pdfParse(file.buffer);
      const text = pdfData.text;
      const chunks = this.splitIntoChunks(text, 1000);

      return {
        text,
        metadata: {
          pages: pdfData.numpages,
          info: pdfData.info,
          fileSize: file.size,
          originalName: file.originalname
        },
        chunks
      };
    } catch (error) {
      logger.error('Error processing PDF:', error);
      throw new Error('Failed to process PDF file');
    }
  }

  private async processText(file: Express.Multer.File): Promise<ProcessedContent> {
    const text = file.buffer.toString('utf-8');
    const chunks = this.splitIntoChunks(text, 1000);

    return {
      text,
      metadata: {
        fileSize: file.size,
        originalName: file.originalname,
        encoding: 'utf-8'
      },
      chunks
    };
  }

  private async processImage(file: Express.Multer.File): Promise<ProcessedContent> {
    // For now, return basic metadata. In future, implement OCR
    return {
      text: `Image file: ${file.originalname}`,
      metadata: {
        fileSize: file.size,
        originalName: file.originalname,
        mimeType: file.mimetype,
        dimensions: null // TODO: Extract image dimensions
      },
      chunks: [`Image file: ${file.originalname}`]
    };
  }

  private async processVideo(file: Express.Multer.File): Promise<ProcessedContent> {
    // Placeholder for video processing
    // TODO: Implement video transcription
    return {
      text: `Video file: ${file.originalname}`,
      metadata: {
        fileSize: file.size,
        originalName: file.originalname,
        mimeType: file.mimetype,
        duration: null // TODO: Extract video duration
      },
      chunks: [`Video file: ${file.originalname}`]
    };
  }

  private async processAudio(file: Express.Multer.File): Promise<ProcessedContent> {
    // Placeholder for audio processing
    // TODO: Implement audio transcription
    return {
      text: `Audio file: ${file.originalname}`,
      metadata: {
        fileSize: file.size,
        originalName: file.originalname,
        mimeType: file.mimetype,
        duration: null // TODO: Extract audio duration
      },
      chunks: [`Audio file: ${file.originalname}`]
    };
  }

  private splitIntoChunks(text: string, chunkSize: number): string[] {
    const chunks: string[] = [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    let currentChunk = '';
    
    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > chunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += (currentChunk ? '. ' : '') + sentence;
      }
    }
    
    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  }

  async saveFile(file: Express.Multer.File): Promise<string> {
    const fileName = `${uuidv4()}-${file.originalname}`;
    const filePath = path.join(this.uploadDir, fileName);
    
    await fs.promises.writeFile(filePath, file.buffer);
    return filePath;
  }
} 
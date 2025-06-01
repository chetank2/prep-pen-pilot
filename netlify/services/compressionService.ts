import zlib from 'zlib';
import { promisify } from 'util';
import { logger } from '../utils/logger';

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

export interface CompressionResult {
  compressedBuffer: Buffer;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  extractedText?: string;
  metadata: {
    compressionType: string;
    quality?: number;
    preservedForAI: boolean;
  };
}

export interface CompressionOptions {
  imageQuality?: number;
  videoQuality?: 'low' | 'medium' | 'high';
  audioQuality?: 'low' | 'medium' | 'high';
  preserveOriginal?: boolean;
}

export class CompressionService {
  
  // Main compression dispatcher
  static async compressFile(
    fileBuffer: Buffer, 
    mimeType: string, 
    fileName: string,
    options: CompressionOptions = {}
  ): Promise<CompressionResult> {
    
    const originalSize = fileBuffer.length;
    logger.info(`Starting compression for ${fileName}`, { originalSize, mimeType });

    let result: CompressionResult;

    try {
      switch (true) {
        case mimeType === 'application/pdf':
          result = await this.compressPDF(fileBuffer, options);
          break;
          
        case mimeType.startsWith('image/'):
          result = await this.compressImage(fileBuffer, mimeType, options);
          break;
          
        case mimeType.startsWith('video/'):
          result = await this.compressVideo(fileBuffer, options);
          break;
          
        case mimeType.startsWith('audio/'):
          result = await this.compressAudio(fileBuffer, options);
          break;
          
        case mimeType.startsWith('text/'):
          result = await this.compressText(fileBuffer, options);
          break;
          
        default:
          result = await this.compressGeneric(fileBuffer, options);
      }

      result.originalSize = originalSize;
      result.compressionRatio = ((originalSize - result.compressedSize) / originalSize) * 100;

      logger.info(`Compression completed for ${fileName}`, {
        originalSize,
        compressedSize: result.compressedSize,
        compressionRatio: result.compressionRatio,
        compressionType: result.metadata.compressionType
      });

      return result;

    } catch (error) {
      logger.error(`Compression failed for ${fileName}:`, error);
      // Fallback to generic compression
      return this.compressGeneric(fileBuffer, options);
    }
  }

  // PDF Compression - Lossless with text extraction
  private static async compressPDF(
    buffer: Buffer, 
    options: CompressionOptions
  ): Promise<CompressionResult> {
    
    // For now, extract text using a simple approach
    // In production, you'd use pdf-parse or similar
    const extractedText = await this.extractTextFromPDF(buffer);
    
    // Compress PDF with zlib (lossless)
    const compressedBuffer = await this.zlibCompress(buffer);
    
    return {
      compressedBuffer,
      originalSize: buffer.length,
      compressedSize: compressedBuffer.length,
      compressionRatio: 0,
      extractedText,
      metadata: {
        compressionType: 'pdf-zlib-lossless',
        preservedForAI: true,
      }
    };
  }

  // Image Compression - Basic implementation
  private static async compressImage(
    buffer: Buffer, 
    mimeType: string, 
    options: CompressionOptions
  ): Promise<CompressionResult> {
    
    // Extract text using OCR (placeholder for now)
    const extractedText = await this.extractTextFromImage(buffer);
    
    // For now, use zlib compression
    // In production, you'd use sharp for image optimization
    const compressedBuffer = await this.zlibCompress(buffer);
    
    return {
      compressedBuffer,
      originalSize: buffer.length,
      compressedSize: compressedBuffer.length,
      compressionRatio: 0,
      extractedText,
      metadata: {
        compressionType: 'image-zlib',
        quality: options.imageQuality || 85,
        preservedForAI: true,
      }
    };
  }

  // Video Compression - Placeholder
  private static async compressVideo(
    buffer: Buffer, 
    options: CompressionOptions
  ): Promise<CompressionResult> {
    
    // For now, use zlib compression
    // In production, you'd use ffmpeg for video compression
    const compressedBuffer = await this.zlibCompress(buffer);
    
    return {
      compressedBuffer,
      originalSize: buffer.length,
      compressedSize: compressedBuffer.length,
      compressionRatio: 0,
      extractedText: '', // Would extract transcript in production
      metadata: {
        compressionType: 'video-zlib',
        preservedForAI: false,
      }
    };
  }

  // Audio Compression - Placeholder
  private static async compressAudio(
    buffer: Buffer, 
    options: CompressionOptions
  ): Promise<CompressionResult> {
    
    // For now, use zlib compression
    // In production, you'd use ffmpeg for audio compression
    const compressedBuffer = await this.zlibCompress(buffer);
    
    return {
      compressedBuffer,
      originalSize: buffer.length,
      compressedSize: compressedBuffer.length,
      compressionRatio: 0,
      extractedText: '', // Would extract transcript in production
      metadata: {
        compressionType: 'audio-zlib',
        preservedForAI: false,
      }
    };
  }

  // Text Compression - Lossless
  private static async compressText(
    buffer: Buffer, 
    options: CompressionOptions
  ): Promise<CompressionResult> {
    
    const text = buffer.toString('utf-8');
    const compressedBuffer = await this.zlibCompress(buffer);
    
    return {
      compressedBuffer,
      originalSize: buffer.length,
      compressedSize: compressedBuffer.length,
      compressionRatio: 0,
      extractedText: text,
      metadata: {
        compressionType: 'text-zlib-lossless',
        preservedForAI: true,
      }
    };
  }

  // Generic Compression - Fallback
  private static async compressGeneric(
    buffer: Buffer, 
    options: CompressionOptions
  ): Promise<CompressionResult> {
    
    const compressedBuffer = await this.zlibCompress(buffer);
    
    return {
      compressedBuffer,
      originalSize: buffer.length,
      compressedSize: compressedBuffer.length,
      compressionRatio: 0,
      metadata: {
        compressionType: 'generic-zlib',
        preservedForAI: false,
      }
    };
  }

  // Utility Methods
  private static async zlibCompress(buffer: Buffer): Promise<Buffer> {
    try {
      return await gzip(buffer, { level: 9 });
    } catch (error) {
      logger.error('Zlib compression failed:', error);
      throw error;
    }
  }

  private static async zlibDecompress(buffer: Buffer): Promise<Buffer> {
    try {
      return await gunzip(buffer);
    } catch (error) {
      logger.error('Zlib decompression failed:', error);
      throw error;
    }
  }

  // Text Extraction Methods (placeholders for now)
  private static async extractTextFromPDF(buffer: Buffer): Promise<string> {
    // Placeholder - in production, use pdf-parse
    try {
      // Simple text extraction attempt
      const text = buffer.toString('utf-8');
      // Look for readable text patterns
      const readableText = text.match(/[a-zA-Z\s]{10,}/g);
      return readableText ? readableText.join(' ').substring(0, 5000) : '';
    } catch (error) {
      logger.warn('PDF text extraction failed:', error);
      return '';
    }
  }

  private static async extractTextFromImage(buffer: Buffer): Promise<string> {
    // Placeholder - in production, use Tesseract.js or Google Vision API
    try {
      // For now, return empty string
      return '';
    } catch (error) {
      logger.warn('Image text extraction failed:', error);
      return '';
    }
  }

  // Decompression method
  static async decompressFile(
    compressedBuffer: Buffer, 
    compressionType: string
  ): Promise<Buffer> {
    
    try {
      switch (compressionType) {
        case 'text-zlib-lossless':
        case 'generic-zlib':
        case 'pdf-zlib-lossless':
        case 'image-zlib':
        case 'video-zlib':
        case 'audio-zlib':
          return this.zlibDecompress(compressedBuffer);
          
        default:
          logger.warn(`Unknown compression type: ${compressionType}, returning as-is`);
          return compressedBuffer;
      }
    } catch (error) {
      logger.error(`Decompression failed for type ${compressionType}:`, error);
      throw error;
    }
  }

  // Utility method to check if file should preserve original
  static shouldPreserveOriginal(mimeType: string, compressionRatio: number): boolean {
    // Preserve original for:
    // 1. High compression ratio files (>70% compression)
    // 2. Critical document types
    // 3. Files that might need original quality
    
    const criticalTypes = [
      'application/pdf', // Important documents
      'image/png',       // Might contain important diagrams
    ];
    
    return compressionRatio > 70 || criticalTypes.includes(mimeType);
  }

  // Get compression stats
  static getCompressionStats(results: CompressionResult[]): {
    totalOriginalSize: number;
    totalCompressedSize: number;
    averageCompressionRatio: number;
    totalSpaceSaved: number;
  } {
    const totalOriginalSize = results.reduce((sum, r) => sum + r.originalSize, 0);
    const totalCompressedSize = results.reduce((sum, r) => sum + r.compressedSize, 0);
    const averageCompressionRatio = results.reduce((sum, r) => sum + r.compressionRatio, 0) / results.length;
    const totalSpaceSaved = totalOriginalSize - totalCompressedSize;

    return {
      totalOriginalSize,
      totalCompressedSize,
      averageCompressionRatio,
      totalSpaceSaved,
    };
  }
} 
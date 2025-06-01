import { SupabaseService } from './supabaseService';
import { CompressionService } from './compressionService';
import { OpenAIService } from './OpenAIService';
import { STORAGE_BUCKETS } from '../config/supabase';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

export interface UploadData {
  categoryId: string;
  title: string;
  description?: string;
  customCategoryType?: string;
  metadata: {
    subject?: string;
    academic_year?: string;
    difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
    tags?: string[];
    source?: string;
    author?: string;
    exam_board?: string;
  };
}

export class EnhancedFileUploadService {
  private static openaiService = new OpenAIService();
  
  static async processFileUpload(
    file: Express.Multer.File,
    uploadData: UploadData,
    userId: string = 'user-123' // Mock user ID for now
  ) {
    const fileId = uuidv4();
    const fileExtension = path.extname(file.originalname);
    const timestamp = Date.now();
    
    try {
      logger.info(`Starting enhanced file upload for ${file.originalname}`, {
        fileId,
        originalSize: file.size,
        mimeType: file.mimetype
      });

      // 1. Compress file and extract text
      const compressionResult = await CompressionService.compressFile(
        file.buffer,
        file.mimetype,
        file.originalname,
        {
          imageQuality: 85,
          videoQuality: 'medium',
          audioQuality: 'medium',
          preserveOriginal: false
        }
      );

      // 2. Determine storage paths
      const compressedPath = `compressed/${uploadData.categoryId}/${fileId}${fileExtension}.gz`;
      const originalPath = `originals/${uploadData.categoryId}/${fileId}${fileExtension}`;
      
      // 3. Store compressed file (primary storage)
      const { path: storedPath, publicUrl } = await SupabaseService.uploadFile(
        STORAGE_BUCKETS.KNOWLEDGE_BASE,
        compressedPath,
        compressionResult.compressedBuffer,
        'application/gzip'
      );

      // 4. Optionally store original for critical files
      let originalStoredPath = null;
      if (this.shouldPreserveOriginal(file.mimetype, compressionResult.compressionRatio)) {
        try {
          const { path } = await SupabaseService.uploadFile(
            STORAGE_BUCKETS.KNOWLEDGE_BASE,
            originalPath,
            file.buffer,
            file.mimetype
          );
          originalStoredPath = path;
          logger.info(`Original file preserved at: ${originalPath}`);
        } catch (error) {
          logger.warn('Failed to store original file, continuing with compressed only:', error);
        }
      }

      // 5. Create database record with compression metadata
      const knowledgeItem = await SupabaseService.createKnowledgeItem({
        id: fileId,
        user_id: userId,
        title: uploadData.title,
        description: uploadData.description,
        category_id: uploadData.categoryId,
        custom_category_type: uploadData.customCategoryType,
        
        // File information
        file_path: storedPath,
        original_file_path: originalStoredPath,
        file_name: file.originalname,
        file_size: file.size,
        compressed_size: compressionResult.compressedSize,
        file_type: fileExtension,
        mime_type: file.mimetype,
        
        // Compression metadata
        compression_metadata: {
          compressionType: compressionResult.metadata.compressionType,
          compressionRatio: compressionResult.compressionRatio,
          originalSize: compressionResult.originalSize,
          compressedSize: compressionResult.compressedSize,
          quality: compressionResult.metadata.quality,
          preservedForAI: compressionResult.metadata.preservedForAI,
        },
        
        // Extracted text for AI
        extracted_text: compressionResult.extractedText,
        
        // Enhanced metadata
        metadata: {
          subject: uploadData.metadata.subject,
          academic_year: uploadData.metadata.academic_year,
          difficulty_level: uploadData.metadata.difficulty_level,
          tags: uploadData.metadata.tags || [],
          source: uploadData.metadata.source,
          author: uploadData.metadata.author,
          exam_board: uploadData.metadata.exam_board,
        },
        
        processing_status: 'processing',
      });

      // 6. Process with AI asynchronously (don't wait for completion)
      this.processWithAI(fileId, compressionResult.extractedText || '', uploadData.title)
        .catch(error => {
          logger.error(`Background AI processing failed for ${fileId}:`, error);
        });

      // 7. Return upload result
      const result = {
        id: fileId,
        ...knowledgeItem,
        file_url: publicUrl,
        compression_stats: {
          originalSize: compressionResult.originalSize,
          compressedSize: compressionResult.compressedSize,
          compressionRatio: compressionResult.compressionRatio,
          spaceSaved: compressionResult.originalSize - compressionResult.compressedSize,
          compressionType: compressionResult.metadata.compressionType,
        }
      };

      logger.info(`Enhanced file upload completed for ${file.originalname}`, {
        fileId,
        compressionRatio: compressionResult.compressionRatio,
        spaceSaved: result.compression_stats.spaceSaved
      });

      return result;

    } catch (error) {
      logger.error('Enhanced file upload failed:', error);
      
      // Cleanup any uploaded files on error
      try {
        await this.cleanupFailedUpload(fileId, uploadData.categoryId);
      } catch (cleanupError) {
        logger.error('Cleanup after failed upload also failed:', cleanupError);
      }
      
      throw error;
    }
  }

  private static shouldPreserveOriginal(mimeType: string, compressionRatio: number): boolean {
    // Preserve original for:
    // 1. High compression ratio files (>70% compression)
    // 2. Critical document types
    // 3. Files that might need original quality
    
    const criticalTypes = [
      'application/pdf', // Important documents
      'image/png',       // Might contain important diagrams
    ];
    
    const shouldPreserve = compressionRatio > 70 || criticalTypes.includes(mimeType);
    
    if (shouldPreserve) {
      logger.info(`Preserving original file due to: ${
        compressionRatio > 70 ? `high compression ratio (${compressionRatio.toFixed(1)}%)` : 'critical file type'
      }`);
    }
    
    return shouldPreserve;
  }

  private static async processWithAI(fileId: string, extractedText: string, title: string) {
    try {
      logger.info(`Starting AI processing for ${fileId}`);

      if (!extractedText || extractedText.length < 10) {
        await SupabaseService.updateKnowledgeItem(fileId, {
          processing_status: 'completed',
          processing_error: 'No text content found for AI processing'
        });
        logger.info(`AI processing skipped for ${fileId} - no text content`);
        return;
      }

      // Generate AI analysis in parallel for better performance
      const [summary, keyPoints, aiAnalysis] = await Promise.allSettled([
        this.openaiService.generateSummary(extractedText),
        this.extractKeyPoints(extractedText), // Use our own method
        this.openaiService.analyzeContent(extractedText),
      ]);

      // Process results and handle any failures gracefully
      const updates: any = {
        processing_status: 'completed',
      };

      if (summary.status === 'fulfilled') {
        updates.summary = summary.value;
      } else {
        logger.warn(`Summary generation failed for ${fileId}:`, summary.reason);
      }

      if (keyPoints.status === 'fulfilled') {
        updates.key_points = keyPoints.value;
      } else {
        logger.warn(`Key points extraction failed for ${fileId}:`, keyPoints.reason);
      }

      if (aiAnalysis.status === 'fulfilled') {
        updates.ai_analysis = aiAnalysis.value;
      } else {
        logger.warn(`AI analysis failed for ${fileId}:`, aiAnalysis.reason);
      }

      // Update database with AI results
      await SupabaseService.updateKnowledgeItem(fileId, updates);

      logger.info(`AI processing completed for ${fileId}`, {
        summaryGenerated: summary.status === 'fulfilled',
        keyPointsExtracted: keyPoints.status === 'fulfilled',
        analysisCompleted: aiAnalysis.status === 'fulfilled',
      });

    } catch (error) {
      logger.error(`AI processing failed for ${fileId}:`, error);
      
      await SupabaseService.updateKnowledgeItem(fileId, {
        processing_status: 'failed',
        processing_error: error instanceof Error ? error.message : 'Unknown AI processing error',
      });
    }
  }

  // Helper method to extract key points from text
  private static async extractKeyPoints(text: string): Promise<string[]> {
    try {
      // Simple key point extraction - split by sentences and take important ones
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
      const keyPoints = sentences
        .slice(0, 10) // Take first 10 sentences as key points
        .map(s => s.trim())
        .filter(s => s.length > 0);
      
      return keyPoints;
    } catch (error) {
      logger.warn('Key points extraction failed:', error);
      return [];
    }
  }

  // Method to retrieve and decompress files when needed
  static async getDecompressedFile(knowledgeItemId: string): Promise<Buffer> {
    try {
      logger.info(`Retrieving and decompressing file for ${knowledgeItemId}`);

      const item = await SupabaseService.getKnowledgeItemById(knowledgeItemId);
      if (!item) {
        throw new Error('Knowledge item not found');
      }

      // Try to get original file first if available
      if (item.original_file_path) {
        try {
          const originalBuffer = await SupabaseService.downloadFile(
            STORAGE_BUCKETS.KNOWLEDGE_BASE,
            item.original_file_path
          );
          logger.info(`Retrieved original file for ${knowledgeItemId}`);
          return originalBuffer;
        } catch (error) {
          logger.warn(`Failed to retrieve original file, falling back to compressed:`, error);
        }
      }

      // Get compressed file from storage
      const compressedBuffer = await SupabaseService.downloadFile(
        STORAGE_BUCKETS.KNOWLEDGE_BASE,
        item.file_path
      );

      // Decompress based on compression type
      const compressionType = item.compression_metadata?.compressionType;
      if (compressionType) {
        const decompressedBuffer = await CompressionService.decompressFile(
          compressedBuffer, 
          compressionType
        );
        logger.info(`Decompressed file for ${knowledgeItemId}`);
        return decompressedBuffer;
      }

      logger.info(`Returned compressed file as-is for ${knowledgeItemId}`);
      return compressedBuffer;

    } catch (error) {
      logger.error(`Failed to retrieve file for ${knowledgeItemId}:`, error);
      throw error;
    }
  }

  // Method to get file URL (for compressed files)
  static getFileUrl(knowledgeItemId: string, item: any): string {
    return SupabaseService.getFileUrl(STORAGE_BUCKETS.KNOWLEDGE_BASE, item.file_path);
  }

  // Cleanup method for failed uploads
  private static async cleanupFailedUpload(fileId: string, categoryId: string): Promise<void> {
    try {
      const compressedPath = `compressed/${categoryId}/${fileId}*`;
      const originalPath = `originals/${categoryId}/${fileId}*`;
      
      // Note: This is a simplified cleanup - in production you'd need to list and delete specific files
      logger.info(`Cleanup initiated for failed upload ${fileId}`);
      
    } catch (error) {
      logger.error(`Cleanup failed for ${fileId}:`, error);
    }
  }

  // Method to get compression statistics
  static async getCompressionStats(userId?: string): Promise<any> {
    try {
      const stats = await SupabaseService.getStorageStats();
      
      return {
        totalOriginalSize: stats.total_original_size || 0,
        totalCompressedSize: stats.total_compressed_size || 0,
        totalSavings: stats.total_savings || 0,
        averageCompressionRatio: stats.average_compression_ratio || 0,
        formattedStats: {
          totalOriginalSize: this.formatBytes(stats.total_original_size || 0),
          totalCompressedSize: this.formatBytes(stats.total_compressed_size || 0),
          totalSavings: this.formatBytes(stats.total_savings || 0),
        }
      };
    } catch (error) {
      logger.error('Failed to get compression stats:', error);
      return {
        totalOriginalSize: 0,
        totalCompressedSize: 0,
        totalSavings: 0,
        averageCompressionRatio: 0,
        formattedStats: {
          totalOriginalSize: '0 Bytes',
          totalCompressedSize: '0 Bytes',
          totalSavings: '0 Bytes',
        }
      };
    }
  }

  private static formatBytes(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  // Method to regenerate AI content for existing items
  static async regenerateAIContent(knowledgeItemId: string): Promise<void> {
    try {
      const item = await SupabaseService.getKnowledgeItemById(knowledgeItemId);
      if (!item) {
        throw new Error('Knowledge item not found');
      }

      if (!item.extracted_text || item.extracted_text.length < 10) {
        throw new Error('No text content available for AI processing');
      }

      await SupabaseService.updateKnowledgeItem(knowledgeItemId, {
        processing_status: 'processing'
      });

      await this.processWithAI(knowledgeItemId, item.extracted_text, item.title);
      
    } catch (error) {
      logger.error(`Failed to regenerate AI content for ${knowledgeItemId}:`, error);
      throw error;
    }
  }

  // Extract text from uploaded file (for chat)
  static async extractTextFromFile(file: Express.Multer.File): Promise<{ extractedText?: string; error?: string }> {
    try {
      logger.info(`Extracting text from ${file.originalname}`, {
        mimeType: file.mimetype,
        size: file.size
      });

      // Use compression service which already has text extraction
      const compressionResult = await CompressionService.compressFile(
        file.buffer,
        file.mimetype,
        file.originalname,
        {
          imageQuality: 85,
          preserveOriginal: false
        }
      );

      return {
        extractedText: compressionResult.extractedText || ''
      };
    } catch (error) {
      logger.error('Text extraction failed:', error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error during text extraction'
      };
    }
  }
} 
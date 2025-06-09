import { supabase } from '../lib/supabase';
import * as pdfjs from 'pdfjs-dist';
import { createWorker } from 'tesseract.js';

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface ProcessedDocument {
  id: string;
  originalName: string;
  type: 'pdf' | 'image';
  content: string;
  metadata: {
    pageCount?: number;
    dimensions?: {
      width: number;
      height: number;
    };
    wordCount: number;
    processedAt: string;
    mimeType: string;
  };
}

export class DocumentProcessor {
  private static readonly STORAGE_BUCKET = 'documents';
  private static readonly PROCESSED_BUCKET = 'processed-content';

  /**
   * Uploads a file to Supabase storage and processes it
   */
  static async processFile(file: File): Promise<ProcessedDocument> {
    try {
      // 1. Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${this.STORAGE_BUCKET}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(this.STORAGE_BUCKET)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Process the file based on its type
      let processedContent: ProcessedDocument;
      if (file.type === 'application/pdf') {
        processedContent = await this.processPDF(file);
      } else if (file.type.startsWith('image/')) {
        processedContent = await this.processImage(file);
      } else {
        throw new Error('Unsupported file type');
      }

      // 3. Store processed content in Supabase
      const { data: contentData, error: contentError } = await supabase
        .from('processed_documents')
        .insert({
          original_name: file.name,
          type: file.type === 'application/pdf' ? 'pdf' : 'image',
          content: processedContent.content,
          metadata: processedContent.metadata,
          storage_path: filePath
        })
        .select()
        .single();

      if (contentError) throw contentError;

      return {
        id: contentData.id,
        originalName: file.name,
        type: file.type === 'application/pdf' ? 'pdf' : 'image',
        content: processedContent.content,
        metadata: processedContent.metadata
      };
    } catch (error) {
      console.error('Error processing file:', error);
      throw error;
    }
  }

  /**
   * Processes a PDF file and extracts its text content
   */
  private static async processPDF(file: File): Promise<ProcessedDocument> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    const pageCount = pdf.numPages;
    let fullText = '';

    for (let i = 1; i <= pageCount; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }

    return {
      id: '',
      originalName: file.name,
      type: 'pdf',
      content: fullText,
      metadata: {
        pageCount,
        wordCount: fullText.split(/\s+/).length,
        processedAt: new Date().toISOString(),
        mimeType: file.type
      }
    };
  }

  /**
   * Processes an image file using OCR
   */
  private static async processImage(file: File): Promise<ProcessedDocument> {
    const worker = await createWorker();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');

    const { data: { text } } = await worker.recognize(file);
    await worker.terminate();

    // Get image dimensions
    const img = new Image();
    const imageUrl = URL.createObjectURL(file);
    await new Promise((resolve) => {
      img.onload = resolve;
      img.src = imageUrl;
    });

    return {
      id: '',
      originalName: file.name,
      type: 'image',
      content: text,
      metadata: {
        dimensions: {
          width: img.width,
          height: img.height
        },
        wordCount: text.split(/\s+/).length,
        processedAt: new Date().toISOString(),
        mimeType: file.type
      }
    };
  }

  /**
   * Retrieves a processed document by ID
   */
  static async getProcessedDocument(id: string): Promise<ProcessedDocument | null> {
    try {
      const { data, error } = await supabase
        .from('processed_documents')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error retrieving processed document:', error);
      return null;
    }
  }
} 
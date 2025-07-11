import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, Eye, ZoomIn, ZoomOut, RotateCw, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { KnowledgeItem } from '../types/knowledgeBase';
import { KnowledgeBaseService } from '../services/knowledgeBaseService';
import { useToast } from '../hooks/use-toast';

interface FileViewerProps {
  fileId?: string;
  onBack?: () => void;
}

export const FileViewer: React.FC<FileViewerProps> = ({ fileId, onBack }) => {
  const [file, setFile] = useState<KnowledgeItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [zoom, setZoom] = useState(100);
  const { toast } = useToast();

  useEffect(() => {
    if (fileId) {
      loadFile(fileId);
    }
  }, [fileId]);

  const loadFile = async (id: string) => {
    try {
      setLoading(true);
      const items = await KnowledgeBaseService.getKnowledgeItems();
      const item = items.find(item => item.id === id);
      
      if (item) {
        setFile(item);
        console.log('FileViewer loaded file:', {
          id: item.id,
          title: item.title,
          file_type: item.file_type,
          file_path: item.file_path,
          has_extracted_text: !!item.extracted_text,
          extracted_text_length: item.extracted_text?.length || 0,
          extracted_text_preview: item.extracted_text ? item.extracted_text.substring(0, 100) + '...' : 'No content',
          processing_status: item.processing_status
        });
      } else {
        console.log('FileViewer: File not found with ID:', id);
        toast({
          title: 'File Not Found',
          description: 'The requested file could not be found.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to load file:', error);
      toast({
        title: 'Error',
        description: 'Failed to load file details.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!file) return;
    
    setDownloading(true);
    try {
      console.log('Starting download from FileViewer for item:', file.id);
      const blob = await KnowledgeBaseService.downloadFile(file.id);
      
      // Create a proper filename with extension
      let fileName = file.file_name || file.title;
      const hasExtension = fileName.includes('.');
      
      if (!hasExtension) {
        // Add appropriate extension based on file type or content type
        const extension = file.file_type === 'text' ? '.txt' : 
                         file.file_type === 'pdf' ? '.pdf' :
                         file.file_type === 'image' ? '.jpg' :
                         file.file_type === 'video' ? '.mp4' :
                         file.file_type === 'audio' ? '.mp3' : '.txt';
        fileName += extension;
      }
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('Download completed successfully from FileViewer for:', fileName);
      toast({
        title: 'Download Complete',
        description: `${fileName} downloaded successfully`,
      });
    } catch (error) {
      console.error('Download failed in FileViewer:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      toast({
        title: 'Download Failed',
        description: `Unable to download file: ${errorMessage}`,
        variant: 'destructive',
      });
    } finally {
      setDownloading(false);
    }
  };

  const zoomIn = () => setZoom(prev => Math.min(prev + 25, 200));
  const zoomOut = () => setZoom(prev => Math.max(prev - 25, 50));

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderFileContent = () => {
    if (!file) return null;

    const contentStyle = {
      transform: `scale(${zoom / 100})`,
      transformOrigin: 'top left',
      width: `${10000 / zoom}%`,
    };

    // Check if we have extracted text content to show
    const hasTextContent = file.extracted_text && file.extracted_text.trim().length > 0;

    // PDF files
    if (file.file_type === 'pdf') {
      if (file.file_path) {
        return (
          <div className="w-full h-full" style={contentStyle}>
            <embed
              src={file.file_path}
              type="application/pdf"
              width="100%"
              height="100%"
              className="border border-slate-200 rounded-lg"
            />
          </div>
        );
      } else if (hasTextContent) {
        return (
          <div 
            className="bg-white p-8 rounded-lg border border-slate-200 max-w-4xl mx-auto"
            style={contentStyle}
          >
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 text-sm">
                📄 Showing extracted text content from PDF file
              </p>
            </div>
            <h2 className="text-xl font-bold mb-4">{file.title}</h2>
            {file.description && (
              <p className="text-slate-600 mb-6">{file.description}</p>
            )}
            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                {file.extracted_text}
              </pre>
            </div>
          </div>
        );
      }
    }

    // Image files
    if (file.file_type === 'image') {
      if (file.file_path) {
        return (
          <div className="flex justify-center items-center h-full">
            <img
              src={file.file_path}
              alt={file.title}
              style={contentStyle}
              className="max-w-full max-h-full object-contain border border-slate-200 rounded-lg shadow-lg"
            />
          </div>
        );
      }
    }

    // Video files
    if (file.file_type === 'video') {
      if (file.file_path) {
        return (
          <div className="flex justify-center items-center h-full">
            <video
              controls
              style={contentStyle}
              className="max-w-full max-h-full border border-slate-200 rounded-lg shadow-lg"
            >
              <source src={file.file_path} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        );
      }
    }

    // Audio files
    if (file.file_type === 'audio') {
      if (file.file_path) {
        return (
          <div className="flex justify-center items-center h-full">
            <div className="bg-white p-8 rounded-lg border border-slate-200 shadow-lg">
              <h3 className="text-lg font-semibold mb-4 text-center">{file.title}</h3>
              <audio controls className="w-full">
                <source src={file.file_path} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            </div>
          </div>
        );
      }
    }

    // Text and other files with extracted content
    if (hasTextContent) {
      return (
        <div 
          className="bg-white p-8 rounded-lg border border-slate-200 max-w-4xl mx-auto"
          style={contentStyle}
        >
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 text-sm">
              📝 Showing processed content from {file.file_type} file
            </p>
          </div>
          <h2 className="text-xl font-bold mb-4">{file.title}</h2>
          {file.description && (
            <p className="text-slate-600 mb-6">{file.description}</p>
          )}
          <div className="prose max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
              {file.extracted_text}
            </pre>
          </div>
        </div>
      );
    }

    // Fallback for files without content
    return (
      <div className="flex justify-center items-center h-full">
        <div className="bg-white p-8 rounded-lg border border-slate-200 shadow-lg text-center max-w-lg">
          <Eye className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Preview Not Available</h3>
          <p className="text-slate-600 mb-4">
            This file type cannot be previewed in the browser.
          </p>
          <div className="text-xs text-slate-500 mb-4 text-left bg-slate-50 p-3 rounded">
            <strong>Debug Information:</strong><br/>
            File type: {file.file_type || 'Unknown'}<br/>
            Has extracted text: {hasTextContent ? 'Yes' : 'No'}<br/>
            Has file path: {file.file_path ? 'Yes' : 'No'}<br/>
            Processing status: {file.processing_status || 'Unknown'}<br/>
            Text length: {file.extracted_text?.length || 0} characters<br/>
            Content preview: {file.content_text ? 'Available' : 'Not available'}<br/>
            {file.extracted_text && (
              <>
                <br/>
                <strong>Text preview (first 200 chars):</strong><br/>
                <span className="text-xs bg-white p-2 rounded border">
                  {file.extracted_text.substring(0, 200)}
                  {file.extracted_text.length > 200 ? '...' : ''}
                </span>
              </>
            )}
          </div>
          <Button onClick={handleDownload} disabled={downloading}>
            {downloading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Download File
          </Button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-slate-600">Loading file...</p>
        </div>
      </div>
    );
  }

  if (!file) {
    return (
      <div className="h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 mb-4">File not found</p>
          {onBack && (
            <Button onClick={onBack} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {onBack && (
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          <div>
            <h1 className="text-lg font-semibold text-slate-900">{file.title}</h1>
            <div className="flex items-center space-x-4 text-sm text-slate-500">
              <span>{file.file_type?.toUpperCase()}</span>
              <span>{formatFileSize(file.file_size)}</span>
              <span>Created {formatDate(file.created_at)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Zoom controls for zoomable content */}
          {(file.file_type === 'pdf' || file.file_type === 'image' || file.extracted_text) && (
            <>
              <Button variant="ghost" size="sm" onClick={zoomOut}>
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm min-w-[3rem] text-center">{zoom}%</span>
              <Button variant="ghost" size="sm" onClick={zoomIn}>
                <ZoomIn className="w-4 h-4" />
              </Button>
              <div className="w-px h-6 bg-slate-200" />
            </>
          )}
          
          <Button onClick={handleDownload} disabled={downloading}>
            {downloading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Download
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {renderFileContent()}
      </div>
    </div>
  );
}; 
import React, { useState, useRef } from 'react';
import { 
  Upload, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Download, 
  Search,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Lightbulb,
  GitBranch,
  Loader2
} from 'lucide-react';
import { apiService } from '../services/api';

interface PDFReaderProps {
  onModuleChange: (module: string) => void;
}

interface PDFDocument {
  id: string;
  filename: string;
  pageCount: number;
  size: number;
  uploadedAt: string;
}

const PDFReader: React.FC<PDFReaderProps> = ({ onModuleChange }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [selectedText, setSelectedText] = useState('');
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [currentPDF, setCurrentPDF] = useState<PDFDocument | null>(null);
  const [uploading, setUploading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Please select a PDF file');
      return;
    }

    setUploading(true);
    try {
      const response = await apiService.uploadPDF(file);
      if (response.success && response.data) {
        setCurrentPDF({
          id: response.data.id,
          filename: response.data.filename,
          pageCount: response.data.pageCount,
          size: response.data.size,
          uploadedAt: response.data.uploadedAt || new Date().toISOString()
        });
        setCurrentPage(1);
      } else {
        alert('Failed to upload PDF: ' + (response.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload PDF');
    } finally {
      setUploading(false);
    }
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      setSelectedText(selection.toString().trim());
      setShowAIPanel(true);
    }
  };

  const handleAIAction = async (action: 'summarize' | 'question' | 'mindmap') => {
    if (!selectedText) return;

    setAiLoading(true);
    setAiResponse('');

    try {
      let response;
      switch (action) {
        case 'summarize':
          response = await apiService.summarizeText(selectedText);
          if (response.success && response.data) {
            setAiResponse(response.data.summary);
          }
          break;
        case 'question':
          // Generate a contextual question based on the selected text
          response = await apiService.askQuestion('Explain this concept in detail', selectedText);
          if (response.success && response.data) {
            setAiResponse(response.data.answer);
          }
          break;
        case 'mindmap':
          response = await apiService.generateMindMap(selectedText);
          if (response.success && response.data) {
            setAiResponse(JSON.stringify(response.data, null, 2));
          }
          break;
      }
    } catch (error) {
      console.error('AI action failed:', error);
      setAiResponse('Failed to process request. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const nextPage = () => {
    if (currentPDF && currentPage < currentPDF.pageCount) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const zoomIn = () => setZoom(Math.min(zoom + 25, 200));
  const zoomOut = () => setZoom(Math.max(zoom - 25, 50));

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Main PDF Viewer */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="bg-white border-b border-slate-200 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              <span>{uploading ? 'Uploading...' : 'Upload PDF'}</span>
            </button>
            
            {currentPDF && (
              <span className="text-sm text-slate-600">
                {currentPDF.filename} ({currentPDF.pageCount} pages)
              </span>
            )}
          </div>

          {currentPDF && (
            <div className="flex items-center space-x-4">
              {/* Page Navigation */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={prevPage}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm">
                  {currentPage} / {currentPDF.pageCount}
                </span>
                <button
                  onClick={nextPage}
                  disabled={currentPage === currentPDF.pageCount}
                  className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={zoomOut}
                  className="p-2 rounded-lg hover:bg-slate-100"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-sm min-w-[3rem] text-center">{zoom}%</span>
                <button
                  onClick={zoomIn}
                  className="p-2 rounded-lg hover:bg-slate-100"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* PDF Content Area */}
        <div className="flex-1 overflow-auto p-8">
          {!currentPDF ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <Upload className="w-16 h-16 mb-4 text-slate-300" />
              <h3 className="text-xl font-medium mb-2">No PDF loaded</h3>
              <p className="text-center mb-6">
                Upload a PDF file to start reading and taking notes
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Choose PDF File
              </button>
            </div>
          ) : (
            <div 
              className="bg-white shadow-lg mx-auto"
              style={{ 
                width: `${zoom}%`,
                minHeight: '800px'
              }}
              onMouseUp={handleTextSelection}
            >
              {/* PDF Content Placeholder */}
              <div className="p-8 border border-slate-200">
                <div className="text-center text-slate-500 py-20">
                  <p className="text-lg mb-4">PDF Content (Page {currentPage})</p>
                  <p className="text-sm">
                    This is where the actual PDF content would be rendered.
                    <br />
                    Select text to use AI features.
                  </p>
                  {selectedText && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-blue-900">Selected Text:</p>
                      <p className="text-sm text-blue-700 mt-1">"{selectedText}"</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Panel */}
      {showAIPanel && selectedText && (
        <div className="w-80 bg-white border-l border-slate-200 flex flex-col">
          <div className="p-4 border-b border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-slate-900">AI Assistant</h3>
              <button
                onClick={() => setShowAIPanel(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ×
              </button>
            </div>
            <p className="text-sm text-slate-600">
              Selected: "{selectedText.substring(0, 50)}..."
            </p>
          </div>

          <div className="p-4 space-y-3">
            <button
              onClick={() => handleAIAction('summarize')}
              disabled={aiLoading}
              className="w-full flex items-center space-x-3 p-3 text-left rounded-lg hover:bg-slate-50 border border-slate-200"
            >
              <Lightbulb className="w-5 h-5 text-yellow-500" />
              <div>
                <div className="font-medium">Summarize</div>
                <div className="text-sm text-slate-600">Get key points</div>
              </div>
            </button>

            <button
              onClick={() => handleAIAction('question')}
              disabled={aiLoading}
              className="w-full flex items-center space-x-3 p-3 text-left rounded-lg hover:bg-slate-50 border border-slate-200"
            >
              <MessageSquare className="w-5 h-5 text-blue-500" />
              <div>
                <div className="font-medium">Explain</div>
                <div className="text-sm text-slate-600">Get detailed explanation</div>
              </div>
            </button>

            <button
              onClick={() => handleAIAction('mindmap')}
              disabled={aiLoading}
              className="w-full flex items-center space-x-3 p-3 text-left rounded-lg hover:bg-slate-50 border border-slate-200"
            >
              <GitBranch className="w-5 h-5 text-purple-500" />
              <div>
                <div className="font-medium">Mind Map</div>
                <div className="text-sm text-slate-600">Create visual map</div>
              </div>
            </button>
          </div>

          {aiLoading && (
            <div className="p-4 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              <span className="ml-2 text-sm text-slate-600">Processing...</span>
            </div>
          )}

          {aiResponse && (
            <div className="flex-1 p-4 overflow-auto">
              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="font-medium text-slate-900 mb-2">AI Response:</h4>
                <div className="text-sm text-slate-700 whitespace-pre-wrap">
                  {aiResponse}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PDFReader;

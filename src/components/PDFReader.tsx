
import React, { useState } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Bookmark, 
  MessageSquare, 
  Lightbulb,
  ChevronLeft,
  ChevronRight,
  Search
} from 'lucide-react';

interface PDFReaderProps {
  onTextSelect: (text: string) => void;
  onShowAI: () => void;
}

const PDFReader: React.FC<PDFReaderProps> = ({ onTextSelect, onShowAI }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [selectedText, setSelectedText] = useState('');

  const totalPages = 120; // Mock total pages

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      const text = selection.toString();
      setSelectedText(text);
      onTextSelect(text);
    }
  };

  const pages = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Thumbnail Sidebar */}
      <div className="w-64 bg-white border-r border-slate-200 p-4 overflow-y-auto">
        <div className="mb-4">
          <h3 className="font-semibold text-slate-900 mb-2">Pages</h3>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search pages..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          {pages.map((page) => (
            <div
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                currentPage === page 
                  ? 'bg-blue-50 border-2 border-blue-200' 
                  : 'bg-slate-50 hover:bg-slate-100 border-2 border-transparent'
              }`}
            >
              <div className="aspect-[3/4] bg-white rounded border border-slate-200 mb-2 flex items-center justify-center text-xs text-slate-500">
                Page {page}
              </div>
              <div className="text-xs text-center text-slate-600">Page {page}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main PDF Viewer */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="bg-white border-b border-slate-200 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <span className="text-sm text-slate-600">
              Page {currentPage} of {totalPages}
            </span>
            
            <button 
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setZoom(Math.max(50, zoom - 25))}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            
            <span className="text-sm text-slate-600 min-w-[4rem] text-center">{zoom}%</span>
            
            <button 
              onClick={() => setZoom(Math.min(200, zoom + 25))}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ZoomIn className="w-5 h-5" />
            </button>

            <div className="w-px h-6 bg-slate-200 mx-2"></div>

            <button className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
              <RotateCw className="w-5 h-5" />
            </button>
            
            <button className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
              <Bookmark className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PDF Content */}
        <div className="flex-1 p-8 overflow-auto">
          <div 
            className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-8 relative"
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
            onMouseUp={handleTextSelection}
          >
            {/* Mock PDF Content */}
            <h1 className="text-2xl font-bold mb-6 text-slate-900">Chapter 5: Constitutional Framework</h1>
            
            <p className="text-slate-700 leading-relaxed mb-4">
              The Constitution of India establishes a federal system of government with a strong center. 
              This framework ensures that power is distributed between the Union and the States while 
              maintaining national unity and integrity.
            </p>
            
            <p className="text-slate-700 leading-relaxed mb-4">
              The federal structure is characterized by a dual polity with the Union at the Centre and 
              the States at the periphery. Each level of government is endowed with sovereign powers 
              to be exercised in the field assigned to them respectively by the Constitution.
            </p>

            <h2 className="text-xl font-semibold mb-4 text-slate-900">Key Features</h2>
            
            <ul className="list-disc list-inside space-y-2 text-slate-700 mb-6">
              <li>Written Constitution with detailed provisions</li>
              <li>Federal system with unitary bias</li>
              <li>Parliamentary form of government</li>
              <li>Fundamental Rights and Directive Principles</li>
              <li>Independent Judiciary</li>
            </ul>

            {/* Selection Actions */}
            {selectedText && (
              <div className="fixed bottom-8 right-8 bg-white rounded-xl shadow-lg border border-slate-200 p-4 flex items-center space-x-3 z-50">
                <button
                  onClick={onShowAI}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Lightbulb className="w-4 h-4" />
                  <span>Summarize</span>
                </button>
                
                <button
                  onClick={onShowAI}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Ask Question</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFReader;

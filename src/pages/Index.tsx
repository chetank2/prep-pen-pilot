import React, { useState } from 'react';
import Dashboard from '../components/Dashboard';
import PDFReader from '../components/PDFReader';
import CanvasNotes from '../components/CanvasNotes';
import MindMap from '../components/MindMap';
import FolderView from '../components/FolderView';
import Settings from '../components/Settings';
import Navigation from '../components/Navigation';
import AISummaryPanel from '../components/AISummaryPanel';
import { KnowledgeBase } from './KnowledgeBase';
import ChatInterface from './ChatInterface';
import { FileViewer } from './FileViewer';

const Index = () => {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  const renderActiveModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <Dashboard onModuleChange={setActiveModule} />;
      case 'chat':
        return <ChatInterface />;
      case 'pdf-reader':
        return <PDFReader onTextSelect={setSelectedText} onShowAI={() => setShowAIPanel(true)} />;
      case 'canvas':
        return <CanvasNotes />;
      case 'mindmap':
        return <MindMap />;
      case 'folders':
        return <FolderView onModuleChange={setActiveModule} />;
      case 'settings':
        return <Settings />;
      case 'knowledge-base':
        return <KnowledgeBase onViewFile={(fileId) => {
          setSelectedFileId(fileId);
          setActiveModule('file-viewer');
        }} />;
      case 'file-viewer':
        return <FileViewer 
          fileId={selectedFileId || undefined} 
          onBack={() => {
            setSelectedFileId(null);
            setActiveModule('knowledge-base');
          }} 
        />;
      default:
        return <Dashboard onModuleChange={setActiveModule} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex">
      {/* Navigation Sidebar */}
      <Navigation activeModule={activeModule} onModuleChange={setActiveModule} />
      
      {/* Main Content */}
      <main className="flex-1 relative overflow-hidden">
        {renderActiveModule()}
        
        {/* AI Summary Panel */}
        <AISummaryPanel 
          isOpen={showAIPanel}
          onClose={() => setShowAIPanel(false)}
          selectedText={selectedText}
        />
      </main>
    </div>
  );
};

export default Index;

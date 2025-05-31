
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from '../components/Dashboard';
import PDFReader from '../components/PDFReader';
import CanvasNotes from '../components/CanvasNotes';
import MindMap from '../components/MindMap';
import FolderView from '../components/FolderView';
import Settings from '../components/Settings';
import Navigation from '../components/Navigation';
import AISummaryPanel from '../components/AISummaryPanel';

const Index = () => {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [selectedText, setSelectedText] = useState('');

  const renderActiveModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <Dashboard onModuleChange={setActiveModule} />;
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

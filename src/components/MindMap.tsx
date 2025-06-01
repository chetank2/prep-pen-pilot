import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Minus, 
  ZoomIn, 
  ZoomOut, 
  Download, 
  Share, 
  Edit3,
  Save,
  PenTool,
  Move,
  Trash2,
  Brain,
  Upload
} from 'lucide-react';
import { KnowledgeBaseService } from '../services/knowledgeBaseService';

interface MindMapNode {
  id: string;
  title: string;
  children: MindMapNode[];
}

interface MindMapData {
  id: string;
  title: string;
  source?: string;
  children: MindMapNode[];
}

const MindMap: React.FC = () => {
  const [zoom, setZoom] = useState(100);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [editingNode, setEditingNode] = useState<string | null>(null);
  const [mode, setMode] = useState<'view' | 'edit' | 'draw'>('view');
  const [mindMapData, setMindMapData] = useState<MindMapData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMindMapData();
  }, []);

  const loadMindMapData = async () => {
    try {
      setLoading(true);
      // In a real implementation, this would load existing mind maps
      // For now, we'll show an empty state
      setMindMapData(null);
    } catch (err) {
      setError('Failed to load mind map data');
      console.error('Error loading mind map:', err);
    } finally {
      setLoading(false);
    }
  };

  const createNewMindMap = async () => {
    const newMindMap: MindMapData = {
      id: `mindmap-${Date.now()}`,
      title: 'New Mind Map',
      children: []
    };
    setMindMapData(newMindMap);
  };

  const renderNode = (node: MindMapNode, level: number = 0, x: number = 400, y: number = 200) => {
    const isRoot = level === 0;
    const isSelected = selectedNode === node.id;
    const isEditing = editingNode === node.id;

    return (
      <g key={node.id}>
        {/* Node */}
        <g transform={`translate(${x}, ${y})`}>
          <rect
            x={-60}
            y={-20}
            width={120}
            height={40}
            rx={isRoot ? 20 : 10}
            fill={isRoot ? '#3B82F6' : isSelected ? '#EF4444' : '#FFFFFF'}
            stroke={isRoot ? '#1D4ED8' : '#E2E8F0'}
            strokeWidth={isSelected ? 3 : 1}
            className="cursor-pointer transition-all duration-200"
            onClick={() => setSelectedNode(node.id)}
          />
          
          {isEditing ? (
            <foreignObject x={-55} y={-10} width={110} height={20}>
              <input
                type="text"
                defaultValue={node.title}
                className="w-full text-center text-sm bg-transparent border-none outline-none"
                onBlur={() => setEditingNode(null)}
                onKeyPress={(e) => e.key === 'Enter' && setEditingNode(null)}
                autoFocus
              />
            </foreignObject>
          ) : (
            <text
              x={0}
              y={5}
              textAnchor="middle"
              className={`text-sm font-medium ${isRoot ? 'fill-white' : 'fill-slate-900'} cursor-pointer`}
              onClick={() => mode === 'edit' && setEditingNode(node.id)}
            >
              {node.title.length > 15 ? `${node.title.substring(0, 15)}...` : node.title}
            </text>
          )}
        </g>

        {/* Child nodes */}
        {node.children?.map((child: MindMapNode, index: number) => {
          const childX = x + (index - (node.children.length - 1) / 2) * 200;
          const childY = y + 120;
          
          return (
            <g key={child.id}>
              {/* Connection line */}
              <line
                x1={x}
                y1={y + 20}
                x2={childX}
                y2={childY - 20}
                stroke="#CBD5E1"
                strokeWidth={2}
              />
              
              {renderNode(child, level + 1, childX, childY)}
            </g>
          );
        })}
      </g>
    );
  };

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center h-full text-center py-20">
      <Brain className="w-20 h-20 text-slate-300 mb-6" />
      <h2 className="text-2xl font-semibold text-slate-900 mb-4">No Mind Map Created</h2>
      <p className="text-slate-600 mb-8 max-w-md">
        Create a mind map to visualize concepts and organize your thoughts. 
        You can build mind maps from your knowledge base content or start from scratch.
      </p>
      <div className="space-y-3">
        <button
          onClick={createNewMindMap}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Create New Mind Map</span>
        </button>
        <p className="text-sm text-slate-500">
          Or generate from your knowledge base content
        </p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Brain className="w-12 h-12 text-blue-600 animate-pulse mx-auto mb-4" />
          <p className="text-slate-600">Loading mind map...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={loadMindMapData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-slate-900">
            {mindMapData ? mindMapData.title : 'Mind Maps'}
          </h1>
          {mindMapData?.source && (
            <div className="text-sm text-slate-500">
              Generated from {mindMapData.source}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {mindMapData && (
            <>
              {/* Mode Toggle */}
              <div className="flex bg-slate-100 rounded-lg p-1">
                <button
                  onClick={() => setMode('view')}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    mode === 'view' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  <Move className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setMode('edit')}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    mode === 'edit' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setMode('draw')}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    mode === 'draw' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  <PenTool className="w-4 h-4" />
                </button>
              </div>

              <div className="w-px h-6 bg-slate-200"></div>

              {/* Zoom Controls */}
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

              <div className="w-px h-6 bg-slate-200"></div>

              <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2">
                <Save className="w-4 h-4" />
                <span>Save</span>
              </button>

              <button className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                <Download className="w-5 h-5" />
              </button>

              <button className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                <Share className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-1">
        {mindMapData ? (
          <>
            {/* Sidebar */}
            <div className="w-64 bg-white border-r border-slate-200 p-4">
              <h3 className="font-semibold text-slate-900 mb-4">Mind Map Tools</h3>
              
              {selectedNode && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <div className="text-sm text-blue-600 font-medium mb-2">Selected Node</div>
                  <div className="text-sm text-slate-900 mb-3">{selectedNode}</div>
                  
                  <div className="space-y-2">
                    <button className="w-full px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2">
                      <Plus className="w-4 h-4" />
                      <span>Add Child</span>
                    </button>
                    
                    <button className="w-full px-3 py-2 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors flex items-center justify-center space-x-2">
                      <Edit3 className="w-4 h-4" />
                      <span>Edit Node</span>
                    </button>
                    
                    <button className="w-full px-3 py-2 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors flex items-center justify-center space-x-2">
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <button 
                  onClick={createNewMindMap}
                  className="w-full px-3 py-2 bg-slate-100 text-slate-700 rounded text-sm hover:bg-slate-200 transition-colors"
                >
                  New Mind Map
                </button>
                
                <button className="w-full px-3 py-2 bg-slate-100 text-slate-700 rounded text-sm hover:bg-slate-200 transition-colors">
                  Auto Layout
                </button>
                
                <button className="w-full px-3 py-2 bg-slate-100 text-slate-700 rounded text-sm hover:bg-slate-200 transition-colors">
                  Reset View
                </button>
              </div>
            </div>

            {/* Mind Map Canvas */}
            <div className="flex-1 overflow-hidden relative">
              <svg 
                className="w-full h-full cursor-move" 
                style={{ transform: `scale(${zoom / 100})` }}
                viewBox="0 0 800 600"
              >
                {renderNode(mindMapData, 0)}
              </svg>
            </div>
          </>
        ) : (
          <div className="flex-1">
            {renderEmptyState()}
          </div>
        )}
      </div>
    </div>
  );
};

export default MindMap;

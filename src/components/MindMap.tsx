
import React, { useState } from 'react';
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
  Trash2
} from 'lucide-react';

const MindMap: React.FC = () => {
  const [zoom, setZoom] = useState(100);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [editingNode, setEditingNode] = useState<string | null>(null);
  const [mode, setMode] = useState<'view' | 'edit' | 'draw'>('view');

  const mindMapData = {
    id: 'root',
    title: 'Constitutional Framework',
    children: [
      {
        id: 'federal',
        title: 'Federal System',
        children: [
          { id: 'union', title: 'Union Government', children: [] },
          { id: 'state', title: 'State Government', children: [] },
          { id: 'distribution', title: 'Power Distribution', children: [] }
        ]
      },
      {
        id: 'rights',
        title: 'Fundamental Rights',
        children: [
          { id: 'equality', title: 'Right to Equality', children: [] },
          { id: 'freedom', title: 'Right to Freedom', children: [] },
          { id: 'life', title: 'Right to Life', children: [] }
        ]
      },
      {
        id: 'judiciary',
        title: 'Judiciary',
        children: [
          { id: 'supreme', title: 'Supreme Court', children: [] },
          { id: 'high', title: 'High Courts', children: [] },
          { id: 'district', title: 'District Courts', children: [] }
        ]
      }
    ]
  };

  const renderNode = (node: any, level: number = 0, x: number = 400, y: number = 200) => {
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
        {node.children?.map((child: any, index: number) => {
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

  return (
    <div className="h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-slate-900">Constitutional Framework Mind Map</h1>
          <div className="text-sm text-slate-500">Auto-generated from Chapter 5</div>
        </div>

        <div className="flex items-center space-x-2">
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
        </div>
      </div>

      <div className="flex flex-1">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-slate-200 p-4">
          <h3 className="font-semibold text-slate-900 mb-4">Mind Map Tools</h3>
          
          {selectedNode && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <div className="text-sm text-blue-600 font-medium mb-2">Selected Node</div>
              <div className="text-sm text-slate-900 mb-3">Constitutional Framework</div>
              
              <div className="space-y-2">
                <button className="w-full px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2">
                  <Plus className="w-4 h-4" />
                  <span>Add Child</span>
                </button>
                
                <button className="w-full px-3 py-2 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors flex items-center justify-center space-x-2">
                  <Edit3 className="w-4 h-4" />
                  <span>Edit Text</span>
                </button>
                
                <button className="w-full px-3 py-2 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors flex items-center justify-center space-x-2">
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <button className="w-full px-3 py-2 bg-purple-500 text-white rounded text-sm hover:bg-purple-600 transition-colors">
              Convert to Canvas
            </button>
            
            <button className="w-full px-3 py-2 bg-orange-500 text-white rounded text-sm hover:bg-orange-600 transition-colors">
              Auto-layout
            </button>
            
            <button className="w-full px-3 py-2 bg-slate-500 text-white rounded text-sm hover:bg-slate-600 transition-colors">
              Reset View
            </button>
          </div>
        </div>

        {/* Mind Map Canvas */}
        <div className="flex-1 overflow-hidden relative">
          <div 
            className="w-full h-full"
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center center' }}
          >
            <svg 
              width="100%" 
              height="100%" 
              viewBox="0 0 800 600"
              className="bg-white"
            >
              {renderNode(mindMapData)}
            </svg>
          </div>

          {/* Canvas overlay for drawing mode */}
          {mode === 'draw' && (
            <canvas 
              className="absolute inset-0 w-full h-full pointer-events-auto"
              style={{ background: 'transparent' }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default MindMap;

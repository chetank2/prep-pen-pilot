
import React, { useState, useRef } from 'react';
import { 
  PenTool, 
  Eraser, 
  Palette, 
  Save, 
  Undo, 
  RotateCw as Redo,
  Download,
  Share,
  Type,
  Circle,
  Square,
  Minus
} from 'lucide-react';

const CanvasNotes: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState('pen');
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [noteTitle, setNoteTitle] = useState('Untitled Note');

  const colors = [
    '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', 
    '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#FFC0CB'
  ];

  const tools = [
    { id: 'pen', icon: PenTool, label: 'Pen' },
    { id: 'eraser', icon: Eraser, label: 'Eraser' },
    { id: 'highlighter', icon: Minus, label: 'Highlighter' },
    { id: 'text', icon: Type, label: 'Text' },
    { id: 'circle', icon: Circle, label: 'Circle' },
    { id: 'rectangle', icon: Square, label: 'Rectangle' },
  ];

  const startDrawing = (e: React.MouseEvent) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = strokeWidth * 3;
    } else if (tool === 'highlighter') {
      ctx.globalCompositeOperation = 'multiply';
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth * 2;
      ctx.globalAlpha = 0.3;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.globalAlpha = 1;
    }

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div className="h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <input
            type="text"
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
            className="text-xl font-semibold bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
          />
          <div className="text-sm text-slate-500">Last saved: 2 minutes ago</div>
        </div>

        <div className="flex items-center space-x-2">
          <button className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
            <Undo className="w-5 h-5" />
          </button>
          <button className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
            <Redo className="w-5 h-5" />
          </button>
          <div className="w-px h-6 bg-slate-200 mx-2"></div>
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
        {/* Toolbar */}
        <div className="w-20 bg-white border-r border-slate-200 p-4 flex flex-col items-center space-y-4">
          {/* Tools */}
          {tools.map((toolItem) => {
            const Icon = toolItem.icon;
            return (
              <button
                key={toolItem.id}
                onClick={() => setTool(toolItem.id)}
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 ${
                  tool === toolItem.id 
                    ? 'bg-blue-500 text-white shadow-lg' 
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                title={toolItem.label}
              >
                <Icon className="w-5 h-5" />
              </button>
            );
          })}

          <div className="w-full h-px bg-slate-200 my-2"></div>

          {/* Colors */}
          <div className="space-y-2">
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => setStrokeColor(color)}
                className={`w-8 h-8 rounded-lg border-2 transition-all duration-200 ${
                  strokeColor === color ? 'border-slate-400 scale-110' : 'border-slate-200'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>

          <div className="w-full h-px bg-slate-200 my-2"></div>

          {/* Stroke Width */}
          <div className="space-y-2">
            {[1, 3, 5, 8].map((width) => (
              <button
                key={width}
                onClick={() => setStrokeWidth(width)}
                className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                  strokeWidth === width ? 'border-blue-500 bg-blue-50' : 'border-slate-200'
                }`}
              >
                <div 
                  className="bg-slate-800 rounded-full"
                  style={{ width: `${width * 2}px`, height: `${width * 2}px` }}
                />
              </button>
            ))}
          </div>

          <div className="flex-1"></div>

          <button
            onClick={clearCanvas}
            className="w-12 h-12 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-colors flex items-center justify-center"
          >
            <span className="text-xs font-bold">CLR</span>
          </button>
        </div>

        {/* Canvas */}
        <div className="flex-1 p-8 overflow-hidden">
          <div className="w-full h-full bg-white rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
            <canvas
              ref={canvasRef}
              width={1200}
              height={800}
              className="w-full h-full cursor-crosshair"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CanvasNotes;

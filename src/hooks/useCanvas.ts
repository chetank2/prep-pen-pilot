import { useRef, useCallback, useEffect, useState } from 'react';

export interface CanvasPoint {
  x: number;
  y: number;
  pressure?: number;
  timestamp: number;
}

export interface CanvasStroke {
  points: CanvasPoint[];
  color: string;
  width: number;
  tool: 'pen' | 'eraser' | 'highlighter';
}

export interface CanvasState {
  strokes: CanvasStroke[];
  currentStroke: CanvasStroke | null;
  isDrawing: boolean;
  tool: 'pen' | 'eraser' | 'highlighter';
  color: string;
  width: number;
}

export const useCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasState, setCanvasState] = useState<CanvasState>({
    strokes: [],
    currentStroke: null,
    isDrawing: false,
    tool: 'pen',
    color: '#000000',
    width: 3,
  });

  const [history, setHistory] = useState<CanvasStroke[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Get canvas context
  const getContext = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext('2d');
  }, []);

  // Convert screen coordinates to canvas coordinates
  const getCanvasCoordinates = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, []);

  // Start drawing
  const startDrawing = useCallback((event: React.PointerEvent | React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Handle different event types
    let clientX: number, clientY: number, pressure = 0.5;

    if ('pointerId' in event) {
      // Pointer event (includes Apple Pencil)
      clientX = event.clientX;
      clientY = event.clientY;
      pressure = event.pressure || 0.5;
    } else if ('touches' in event) {
      // Touch event
      const touch = event.touches[0];
      clientX = touch.clientX;
      clientY = touch.clientY;
      // Try to get pressure from touch force (iOS Safari)
      pressure = (touch as any).force || 0.5;
    } else {
      // Mouse event
      clientX = event.clientX;
      clientY = event.clientY;
    }

    const { x, y } = getCanvasCoordinates(clientX, clientY);

    const newStroke: CanvasStroke = {
      points: [{ x, y, pressure, timestamp: Date.now() }],
      color: canvasState.color,
      width: canvasState.width,
      tool: canvasState.tool,
    };

    setCanvasState(prev => ({
      ...prev,
      isDrawing: true,
      currentStroke: newStroke,
    }));

    // Prevent default to avoid scrolling on touch devices
    event.preventDefault();
  }, [canvasState.color, canvasState.width, canvasState.tool, getCanvasCoordinates]);

  // Continue drawing
  const continueDrawing = useCallback((event: React.PointerEvent | React.MouseEvent | React.TouchEvent) => {
    if (!canvasState.isDrawing || !canvasState.currentStroke) return;

    let clientX: number, clientY: number, pressure = 0.5;

    if ('pointerId' in event) {
      clientX = event.clientX;
      clientY = event.clientY;
      pressure = event.pressure || 0.5;
    } else if ('touches' in event) {
      const touch = event.touches[0];
      clientX = touch.clientX;
      clientY = touch.clientY;
      pressure = (touch as any).force || 0.5;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }

    const { x, y } = getCanvasCoordinates(clientX, clientY);

    setCanvasState(prev => ({
      ...prev,
      currentStroke: prev.currentStroke ? {
        ...prev.currentStroke,
        points: [...prev.currentStroke.points, { x, y, pressure, timestamp: Date.now() }],
      } : null,
    }));

    event.preventDefault();
  }, [canvasState.isDrawing, canvasState.currentStroke, getCanvasCoordinates]);

  // Stop drawing
  const stopDrawing = useCallback(() => {
    if (!canvasState.isDrawing || !canvasState.currentStroke) return;

    const newStrokes = [...canvasState.strokes, canvasState.currentStroke];
    
    setCanvasState(prev => ({
      ...prev,
      isDrawing: false,
      currentStroke: null,
      strokes: newStrokes,
    }));

    // Add to history for undo/redo
    setHistory(prev => [...prev.slice(0, historyIndex + 1), newStrokes]);
    setHistoryIndex(prev => prev + 1);
  }, [canvasState.isDrawing, canvasState.currentStroke, canvasState.strokes, historyIndex]);

  // Draw stroke on canvas
  const drawStroke = useCallback((ctx: CanvasRenderingContext2D, stroke: CanvasStroke) => {
    if (stroke.points.length === 0) return;

    ctx.save();

    // Set stroke properties
    ctx.strokeStyle = stroke.color;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Handle different tools
    if (stroke.tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = stroke.width * 2;
    } else if (stroke.tool === 'highlighter') {
      ctx.globalCompositeOperation = 'multiply';
      ctx.globalAlpha = 0.3;
      ctx.lineWidth = stroke.width * 1.5;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.lineWidth = stroke.width;
    }

    // Draw the stroke with pressure sensitivity
    ctx.beginPath();
    
    for (let i = 0; i < stroke.points.length; i++) {
      const point = stroke.points[i];
      
      if (i === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        // Use pressure to vary line width if available
        if (point.pressure !== undefined && stroke.tool === 'pen') {
          ctx.lineWidth = stroke.width * (0.5 + point.pressure * 0.5);
        }
        ctx.lineTo(point.x, point.y);
      }
    }
    
    ctx.stroke();
    ctx.restore();
  }, []);

  // Redraw entire canvas
  const redrawCanvas = useCallback(() => {
    const ctx = getContext();
    if (!ctx || !canvasRef.current) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    // Draw all strokes
    canvasState.strokes.forEach(stroke => drawStroke(ctx, stroke));

    // Draw current stroke if drawing
    if (canvasState.currentStroke) {
      drawStroke(ctx, canvasState.currentStroke);
    }
  }, [canvasState.strokes, canvasState.currentStroke, getContext, drawStroke]);

  // Undo last stroke
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setCanvasState(prev => ({
        ...prev,
        strokes: history[newIndex] || [],
      }));
    }
  }, [history, historyIndex]);

  // Redo last undone stroke
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setCanvasState(prev => ({
        ...prev,
        strokes: history[newIndex] || [],
      }));
    }
  }, [history, historyIndex]);

  // Clear canvas
  const clearCanvas = useCallback(() => {
    setCanvasState(prev => ({
      ...prev,
      strokes: [],
      currentStroke: null,
    }));
    
    setHistory(prev => [...prev, []]);
    setHistoryIndex(prev => prev + 1);
  }, []);

  // Set tool
  const setTool = useCallback((tool: 'pen' | 'eraser' | 'highlighter') => {
    setCanvasState(prev => ({ ...prev, tool }));
  }, []);

  // Set color
  const setColor = useCallback((color: string) => {
    setCanvasState(prev => ({ ...prev, color }));
  }, []);

  // Set width
  const setWidth = useCallback((width: number) => {
    setCanvasState(prev => ({ ...prev, width }));
  }, []);

  // Export canvas as image
  const exportAsImage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.toDataURL('image/png');
  }, []);

  // Load strokes from data
  const loadStrokes = useCallback((strokes: CanvasStroke[]) => {
    setCanvasState(prev => ({ ...prev, strokes }));
    setHistory(prev => [...prev, strokes]);
    setHistoryIndex(prev => prev + 1);
  }, []);

  // Redraw canvas when state changes
  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Initialize canvas size
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      }
      
      redrawCanvas();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [redrawCanvas]);

  return {
    canvasRef,
    canvasState,
    startDrawing,
    continueDrawing,
    stopDrawing,
    undo,
    redo,
    clearCanvas,
    setTool,
    setColor,
    setWidth,
    exportAsImage,
    loadStrokes,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
  };
}; 
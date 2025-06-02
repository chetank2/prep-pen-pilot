import React, { useState, useEffect } from 'react';
import { 
  FolderOpen, 
  FileText, 
  PenTool, 
  GitBranch, 
  Plus, 
  Search,
  Filter,
  MoreVertical,
  Star,
  Clock,
  Loader2,
  Upload,
  Brain
} from 'lucide-react';
import { KnowledgeBaseService } from '../services/knowledgeBaseService';

interface FolderViewProps {
  onModuleChange: (module: string) => void;
}

interface Item {
  id: string;
  type: 'pdf' | 'note' | 'mindmap' | 'knowledge';
  title: string;
  folder: string;
  modified: string;
  starred: boolean;
  size: string;
}

interface Folder {
  id: string;
  name: string;
  count: number;
  color: string;
}

const FolderView: React.FC<FolderViewProps> = ({ onModuleChange }) => {
  const [activeFolder, setActiveFolder] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [folders, setFolders] = useState<Folder[]>([
    { id: 'all', name: 'All Items', count: 0, color: 'bg-slate-400' },
    { id: 'recent', name: 'Recent', count: 0, color: 'bg-blue-400' },
    { id: 'starred', name: 'Starred', count: 0, color: 'bg-yellow-400' },
    { id: 'pdfs', name: 'PDFs', count: 0, color: 'bg-red-400' },
    { id: 'notes', name: 'Notes', count: 0, color: 'bg-green-400' },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      
      // Load from Knowledge Base
      const knowledgeItems = await KnowledgeBaseService.getKnowledgeItems();

      // Convert knowledge items to folder items
      const folderItems: Item[] = knowledgeItems.map((item) => ({
        id: item.id,
        type: 'knowledge' as const,
        title: item.title,
        folder: 'all',
        modified: formatRelativeTime(item.created_at),
        starred: false, // Add starring functionality later
        size: formatFileSize(item.file_size || 0)
      }));

      setItems(folderItems);

      // Update folder counts
      const updatedFolders = folders.map(folder => {
        if (folder.id === 'all') {
          return { ...folder, count: folderItems.length };
        } else if (folder.id === 'recent') {
          // Recent items (last 7 days)
          const recentCount = folderItems.filter(item => {
            const itemDate = new Date(item.modified);
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            return itemDate > weekAgo;
          }).length;
          return { ...folder, count: recentCount };
        } else if (folder.id === 'starred') {
          const starredCount = folderItems.filter(item => item.starred).length;
          return { ...folder, count: starredCount };
        } else if (folder.id === 'pdfs') {
          const pdfCount = knowledgeItems.filter(item => item.file_type === 'pdf').length;
          return { ...folder, count: pdfCount };
        } else if (folder.id === 'notes') {
          const notesCount = knowledgeItems.filter(item => 
            item.file_type === 'text' || item.file_name?.endsWith('.md')
          ).length;
          return { ...folder, count: notesCount };
        }
        return folder;
      });
      setFolders(updatedFolders);

    } catch (error) {
      console.error('Failed to load items:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'pdf': return FileText;
      case 'note': return PenTool;
      case 'mindmap': return GitBranch;
      case 'knowledge': return Brain;
      default: return FileText;
    }
  };

  const getItemColor = (type: string) => {
    switch (type) {
      case 'pdf': return 'text-red-500 bg-red-50';
      case 'note': return 'text-blue-500 bg-blue-50';
      case 'mindmap': return 'text-purple-500 bg-purple-50';
      case 'knowledge': return 'text-green-500 bg-green-50';
      default: return 'text-slate-500 bg-slate-50';
    }
  };

  const filteredItems = items.filter(item => {
    const matchesFolder = activeFolder === 'all' || item.folder === activeFolder;
    const matchesSearch = item.title && item.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFolder && matchesSearch;
  });

  if (loading) {
    return (
      <div className="h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-slate-600">Loading your files...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-slate-200 p-4">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Folders</h2>
          
          <button className="w-full p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2 mb-4">
            <Plus className="w-4 h-4" />
            <span>New Folder</span>
          </button>
        </div>

        <div className="space-y-1">
          {folders.map((folder) => (
            <button
              key={folder.id}
              onClick={() => setActiveFolder(folder.id)}
              className={`w-full p-3 rounded-lg text-left transition-colors flex items-center justify-between ${
                activeFolder === folder.id 
                  ? 'bg-blue-50 text-blue-700 border-blue-200' 
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${folder.color}`}></div>
                <span className="font-medium">{folder.name}</span>
              </div>
              <span className="text-sm text-slate-500">{folder.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-slate-900">
              {folders.find(f => f.id === activeFolder)?.name || 'All Items'}
            </h1>
            
            <div className="flex items-center space-x-2">
              <div className="flex bg-slate-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  List
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search files and notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <button className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-auto">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <FolderOpen className="w-16 h-16 mb-4 text-slate-300" />
              <h3 className="text-xl font-medium mb-2">No items found</h3>
              <p className="text-center mb-6">
                {searchQuery ? 'No items match your search.' : 'Start by uploading a PDF or creating a note.'}
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => onModuleChange('pdf-reader')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Upload PDF
                </button>
                <button
                  onClick={() => onModuleChange('canvas')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Create Note
                </button>
              </div>
            </div>
          ) : (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-4 gap-4">
                {filteredItems.map((item) => {
                  const Icon = getItemIcon(item.type);
                  const colorClass = getItemColor(item.type);
                  
                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-all duration-200 cursor-pointer group"
                      onClick={() => {
                        if (item.type === 'pdf') onModuleChange('pdf-reader');
                        else if (item.type === 'note') onModuleChange('canvas');
                        else if (item.type === 'mindmap') onModuleChange('mindmap');
                        else if (item.type === 'knowledge') onModuleChange('knowledge');
                      }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClass}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          {item.starred && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                          <button className="p-1 text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <h3 className="font-medium text-slate-900 mb-2 line-clamp-2">{item.title}</h3>
                      
                      <div className="flex items-center justify-between text-sm text-slate-500">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{item.modified}</span>
                        </div>
                        <span>{item.size}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="border-b border-slate-200 p-4 bg-slate-50">
                  <div className="grid grid-cols-12 gap-4 text-sm font-medium text-slate-600">
                    <div className="col-span-6">Name</div>
                    <div className="col-span-2">Type</div>
                    <div className="col-span-2">Modified</div>
                    <div className="col-span-1">Size</div>
                    <div className="col-span-1"></div>
                  </div>
                </div>
                
                <div className="divide-y divide-slate-200">
                  {filteredItems.map((item) => {
                    const Icon = getItemIcon(item.type);
                    const colorClass = getItemColor(item.type);
                    
                    return (
                      <div
                        key={item.id}
                        className="p-4 hover:bg-slate-50 transition-colors cursor-pointer group"
                        onClick={() => {
                          if (item.type === 'pdf') onModuleChange('pdf-reader');
                          else if (item.type === 'note') onModuleChange('canvas');
                          else if (item.type === 'mindmap') onModuleChange('mindmap');
                          else if (item.type === 'knowledge') onModuleChange('knowledge');
                        }}
                      >
                        <div className="grid grid-cols-12 gap-4 items-center">
                          <div className="col-span-6 flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClass}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-slate-900">{item.title}</span>
                              {item.starred && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                            </div>
                          </div>
                          
                          <div className="col-span-2">
                            <span className="text-sm text-slate-600 capitalize">{item.type}</span>
                          </div>
                          
                          <div className="col-span-2">
                            <span className="text-sm text-slate-600">{item.modified}</span>
                          </div>
                          
                          <div className="col-span-1">
                            <span className="text-sm text-slate-600">{item.size}</span>
                          </div>
                          
                          <div className="col-span-1 flex justify-end">
                            <button className="p-1 text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default FolderView;

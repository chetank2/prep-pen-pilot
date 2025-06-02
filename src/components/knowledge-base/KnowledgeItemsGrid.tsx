import React from 'react';
import { BookOpen, Upload, FileText, Eye, Download, Calendar, HardDrive } from 'lucide-react';
import { KnowledgeItemCard } from './KnowledgeItemCard';
import { KnowledgeItem } from '../../types/knowledgeBase';
import { Skeleton } from '../ui/skeleton';
import { Button } from '../ui/button';

interface KnowledgeItemsGridProps {
  items: KnowledgeItem[];
  loading: boolean;
  viewMode?: 'grid' | 'list';
  onItemUpdate: () => void;
}

export const KnowledgeItemsGrid: React.FC<KnowledgeItemsGridProps> = ({
  items,
  loading,
  viewMode = 'grid',
  onItemUpdate,
}) => {
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
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

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'pdf': return FileText;
      case 'image': return FileText;
      default: return FileText;
    }
  };

  if (loading) {
    return (
      <div className={viewMode === 'grid' ? 
        "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" : 
        "space-y-4"
      }>
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className={viewMode === 'grid' ? 
            "bg-white rounded-2xl shadow-sm border border-slate-200 p-6" :
            "bg-white rounded-xl border border-slate-200 p-4"
          }>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-4 w-3/4" />
                {viewMode === 'grid' && <Skeleton className="h-4 w-1/2" />}
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-3 w-1/4" />
              </div>
              {viewMode === 'grid' && (
                <div className="flex space-x-2 pt-2">
                  <Skeleton className="h-9 flex-1 rounded-lg" />
                  <Skeleton className="h-9 flex-1 rounded-lg" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12">
        <div className="text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No content yet</h3>
          <p className="text-slate-600 mb-6">Upload your first study material to get started with AI-powered learning</p>
          <div className="flex items-center justify-center space-x-2 text-sm text-slate-500">
            <Upload className="w-4 h-4" />
            <span>Click "Add Content" to begin</span>
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* List Header */}
        <div className="bg-slate-50 border-b border-slate-200 p-4">
          <div className="grid grid-cols-12 gap-4 text-sm font-medium text-slate-600">
            <div className="col-span-5">Name</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-2">Size</div>
            <div className="col-span-2">Modified</div>
            <div className="col-span-1">Actions</div>
          </div>
        </div>
        
        {/* List Items */}
        <div className="divide-y divide-slate-200">
          {items.map((item) => {
            const IconComponent = getFileIcon(item.file_type);
            return (
              <div key={item.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-5 flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      item.file_type === 'pdf' ? 'bg-red-100 text-red-600' :
                      item.file_type === 'image' ? 'bg-blue-100 text-blue-600' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900 truncate">{item.title}</h3>
                      {item.description && (
                        <p className="text-sm text-slate-600 truncate">{item.description}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="col-span-2">
                    <span className="text-sm text-slate-600 capitalize">{item.file_type}</span>
                  </div>
                  
                  <div className="col-span-2">
                    <span className="text-sm text-slate-600">{formatFileSize(item.file_size)}</span>
                  </div>
                  
                  <div className="col-span-2">
                    <span className="text-sm text-slate-600">{formatRelativeTime(item.created_at)}</span>
                  </div>
                  
                  <div className="col-span-1 flex space-x-1">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Grid view (default)
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {items.map((item) => (
        <KnowledgeItemCard
          key={item.id}
          item={item}
          onUpdate={onItemUpdate}
        />
      ))}
    </div>
  );
}; 
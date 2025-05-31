import React from 'react';
import { BookOpen, Upload } from 'lucide-react';
import { KnowledgeItemCard } from './KnowledgeItemCard';
import { KnowledgeItem } from '../../types/knowledgeBase';
import { Skeleton } from '../ui/skeleton';

interface KnowledgeItemsGridProps {
  items: KnowledgeItem[];
  loading: boolean;
  onItemUpdate: () => void;
}

export const KnowledgeItemsGrid: React.FC<KnowledgeItemsGridProps> = ({
  items,
  loading,
  onItemUpdate,
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-3 w-1/4" />
              </div>
              <div className="flex space-x-2 pt-2">
                <Skeleton className="h-9 flex-1 rounded-lg" />
                <Skeleton className="h-9 flex-1 rounded-lg" />
              </div>
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
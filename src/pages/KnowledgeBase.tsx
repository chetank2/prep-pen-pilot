import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Database, BookOpen, Brain, FileText, Grid, List } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { CategorySidebar } from '../components/knowledge-base/CategorySidebar';
import { KnowledgeItemsGrid } from '../components/knowledge-base/KnowledgeItemsGrid';
import { FileUploadDialog } from '../components/knowledge-base/FileUploadDialog';
import { KnowledgeCategory, KnowledgeItem, UploadData } from '../types/knowledgeBase';
import { KnowledgeBaseService } from '../services/knowledgeBaseService';
import { useToast } from '../hooks/use-toast';
import { KnowledgeBaseChat } from '../components/knowledge-base/KnowledgeBaseChat';
import { KnowledgeBaseItem } from '../components/knowledge-base/KnowledgeBaseItem';
import { CategoryManagement } from '../components/knowledge-base/CategoryManagement';
import { SearchFilters } from '../types/knowledgeBase';
import { 
  Upload, 
  MessageCircle,
  FolderOpen,
  Settings
} from 'lucide-react';

interface KnowledgeBaseProps {
  onViewFile?: (fileId: string) => void;
}

export const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({ onViewFile }) => {
  const [categories, setCategories] = useState<KnowledgeCategory[]>([]);
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadKnowledgeItems();
  }, [selectedCategory]);

  const loadCategories = async () => {
    try {
      const categoriesData = await KnowledgeBaseService.getCategories();
      setCategories(categoriesData);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load categories',
        variant: 'destructive',
      });
    }
  };

  const loadKnowledgeItems = async () => {
    try {
      setLoading(true);
      const items = await KnowledgeBaseService.getKnowledgeItems({
        categoryId: selectedCategory || undefined
      });
      setKnowledgeItems(items);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load knowledge items',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (
    file: File,
    categoryId: string,
    title: string,
    description?: string
  ) => {
    try {
      const uploadData: UploadData = {
        categoryId,
        title,
        description,
        metadata: {},
      };

      const newItem = await KnowledgeBaseService.uploadFile(file, uploadData);

      // Refresh the entire list to make sure we have the latest data
      await loadKnowledgeItems();
      
      setShowUploadDialog(false);
      
      toast({
        title: 'Success',
        description: `File "${title}" uploaded successfully`,
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload file. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const filteredItems = knowledgeItems.filter(item => {
    if (!item) return false;
    
    const searchLower = searchQuery.toLowerCase();
    const titleMatch = item.title?.toLowerCase().includes(searchLower) || false;
    const descriptionMatch = item.description?.toLowerCase().includes(searchLower) || false;
    
    return titleMatch || descriptionMatch;
  });

  // Calculate stats like the main dashboard
  const stats = [
    { 
      label: 'Total Items', 
      value: knowledgeItems.length.toString(), 
      icon: FileText, 
      color: 'text-blue-500' 
    },
    { 
      label: 'Categories', 
      value: categories.length.toString(), 
      icon: Database, 
      color: 'text-green-500' 
    },
    { 
      label: 'Processed', 
      value: knowledgeItems.filter(item => item.processing_status === 'completed').length.toString(), 
      icon: Brain, 
      color: 'text-purple-500' 
    },
    { 
      label: 'Ready to Study', 
      value: knowledgeItems.filter(item => item.processing_status === 'completed').length.toString(), 
      icon: BookOpen, 
      color: 'text-orange-500' 
    },
  ];

  if (loading && knowledgeItems.length === 0) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-slate-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-slate-200 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header - matching Dashboard style */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Knowledge Base</h1>
            <p className="text-slate-600">AI-powered study materials and content organization</p>
          </div>
          <Button 
            onClick={() => setShowUploadDialog(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Content
          </Button>
        </div>
      </div>

      {/* Stats Grid - matching Dashboard style */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <Icon className={`w-8 h-8 ${stat.color}`} />
              </div>
              <div className="text-2xl font-bold text-slate-900 mb-1">{stat.value}</div>
              <div className="text-sm text-slate-600">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search knowledge base..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="h-8 px-3"
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-8 px-3"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
          
          <Button variant="outline" className="border-slate-200">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <CategorySidebar
              categories={categories}
              selectedCategory={selectedCategory}
              onCategorySelect={setSelectedCategory}
              itemCounts={knowledgeItems.reduce((acc, item) => {
                acc[item.category_id] = (acc[item.category_id] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)}
            />
          </div>
        </div>

        {/* Content Grid */}
        <div className="lg:col-span-3">
          <KnowledgeItemsGrid
            items={filteredItems}
            loading={loading}
            viewMode={viewMode}
            onItemUpdate={loadKnowledgeItems}
            onViewFile={onViewFile}
          />
        </div>
      </div>

      <FileUploadDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        categories={categories}
        onUpload={handleFileUpload}
      />
    </div>
  );
}; 
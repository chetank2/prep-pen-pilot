import React from 'react';
import { 
  Book, 
  FileText, 
  List, 
  Newspaper, 
  Video, 
  Headphones, 
  Image, 
  Edit,
  FolderOpen,
  BookOpen,
  HelpCircle
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { KnowledgeCategory } from '../../types/knowledgeBase';

interface CategorySidebarProps {
  categories: KnowledgeCategory[];
  selectedCategory: string | null;
  onCategorySelect: (categoryId: string | null) => void;
  itemCounts: Record<string, number>;
}

const iconMap = {
  book: Book,
  'book-open': BookOpen,
  'file-text': FileText,
  list: List,
  'help-circle': HelpCircle,
  edit: Edit,
  video: Video,
  image: Image,
  newspaper: Newspaper,
  headphones: Headphones,
};

export const CategorySidebar: React.FC<CategorySidebarProps> = ({
  categories,
  selectedCategory,
  onCategorySelect,
  itemCounts,
}) => {
  return (
    <div className="space-y-2">
      <h3 className="text-xl font-semibold text-slate-900 mb-6">Categories</h3>
      
      <Button
        variant={selectedCategory === null ? 'default' : 'ghost'}
        className={`w-full justify-start h-12 px-4 ${
          selectedCategory === null 
            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`}
        onClick={() => onCategorySelect(null)}
      >
        <FolderOpen className="w-5 h-5 mr-3" />
        <span className="flex-1 text-left">All Items</span>
        <Badge 
          variant="secondary" 
          className={`ml-2 ${
            selectedCategory === null 
              ? 'bg-blue-500 text-white border-blue-400' 
              : 'bg-slate-200 text-slate-700'
          }`}
        >
          {Object.values(itemCounts).reduce((sum, count) => sum + count, 0)}
        </Badge>
      </Button>

      <div className="space-y-1">
        {categories.map((category) => {
          const IconComponent = iconMap[category.icon as keyof typeof iconMap] || FileText;
          const count = itemCounts[category.id] || 0;
          const isSelected = selectedCategory === category.id;

          return (
            <Button
              key={category.id}
              variant="ghost"
              className={`w-full justify-start h-12 px-4 transition-all duration-200 ${
                isSelected
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
              onClick={() => onCategorySelect(category.id)}
            >
              <IconComponent className="w-5 h-5 mr-3" />
              <span className="flex-1 text-left">{category.name}</span>
              {count > 0 && (
                <Badge 
                  variant="secondary" 
                  className={`ml-2 ${
                    isSelected 
                      ? 'bg-blue-500 text-white border-blue-400' 
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {count}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
}; 
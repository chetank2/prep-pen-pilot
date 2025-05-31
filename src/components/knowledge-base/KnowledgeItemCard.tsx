import React, { useState } from 'react';
import { 
  FileText, 
  Video, 
  Headphones, 
  Image, 
  File,
  MoreVertical,
  Brain,
  BookOpen,
  Loader2,
  Calendar,
  HardDrive
} from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from '../ui/dropdown-menu';
import { KnowledgeItem } from '../../types/knowledgeBase';
import { knowledgeBaseAPI } from '../../services/knowledgeBaseApi';
import { useToast } from '../../hooks/use-toast';

interface KnowledgeItemCardProps {
  item: KnowledgeItem;
  onUpdate: () => void;
}

const fileTypeIcons = {
  pdf: FileText,
  video: Video,
  audio: Headphones,
  image: Image,
  text: File,
  url: File,
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  processing: 'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  failed: 'bg-red-100 text-red-800 border-red-200',
};

const statusLabels = {
  pending: 'Pending',
  processing: 'Processing',
  completed: 'Ready',
  failed: 'Failed',
};

export const KnowledgeItemCard: React.FC<KnowledgeItemCardProps> = ({
  item,
  onUpdate,
}) => {
  const [isGeneratingMindmap, setIsGeneratingMindmap] = useState(false);
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);
  const { toast } = useToast();

  const IconComponent = fileTypeIcons[item.file_type] || File;

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

  const handleGenerateMindmap = async () => {
    if (item.processing_status !== 'completed') {
      toast({
        title: 'Content not ready',
        description: 'Please wait for the content to be processed first.',
        variant: 'destructive',
      });
      return;
    }

    setIsGeneratingMindmap(true);
    try {
      await knowledgeBaseAPI.generateMindmap(item.id, item.title);
      toast({
        title: 'Success',
        description: 'Mindmap generated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate mindmap',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingMindmap(false);
    }
  };

  const handleGenerateNotes = async () => {
    if (item.processing_status !== 'completed') {
      toast({
        title: 'Content not ready',
        description: 'Please wait for the content to be processed first.',
        variant: 'destructive',
      });
      return;
    }

    setIsGeneratingNotes(true);
    try {
      await knowledgeBaseAPI.generateNotes(item.id, item.title);
      toast({
        title: 'Success',
        description: 'Notes generated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate notes',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingNotes(false);
    }
  };

  return (
    <Card className="h-full flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200 group">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              item.file_type === 'pdf' ? 'bg-red-100 text-red-600' :
              item.file_type === 'video' ? 'bg-purple-100 text-purple-600' :
              item.file_type === 'audio' ? 'bg-green-100 text-green-600' :
              item.file_type === 'image' ? 'bg-blue-100 text-blue-600' :
              'bg-slate-100 text-slate-600'
            }`}>
              <IconComponent className="w-6 h-6" />
            </div>
            <Badge 
              className={`text-xs font-medium ${statusColors[item.processing_status]}`}
              variant="outline"
            >
              {statusLabels[item.processing_status]}
            </Badge>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleGenerateMindmap} disabled={isGeneratingMindmap}>
                {isGeneratingMindmap ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Brain className="w-4 h-4 mr-2" />
                )}
                Generate Mindmap
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleGenerateNotes} disabled={isGeneratingNotes}>
                {isGeneratingNotes ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <BookOpen className="w-4 h-4 mr-2" />
                )}
                Generate Notes
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="flex-1 px-6">
        <h3 className="font-semibold text-lg text-slate-900 mb-2 line-clamp-2">{item.title}</h3>
        {item.description && (
          <p className="text-slate-600 text-sm mb-4 line-clamp-3">
            {item.description}
          </p>
        )}
        
        <div className="space-y-2">
          <div className="flex items-center text-xs text-slate-500">
            <Calendar className="w-3 h-3 mr-1" />
            <span>{formatRelativeTime(item.created_at)}</span>
          </div>
          {item.file_size && (
            <div className="flex items-center text-xs text-slate-500">
              <HardDrive className="w-3 h-3 mr-1" />
              <span>{formatFileSize(item.file_size)}</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-4 px-6 pb-6">
        <div className="flex space-x-2 w-full">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-slate-200 hover:bg-slate-50"
            onClick={handleGenerateMindmap}
            disabled={item.processing_status !== 'completed' || isGeneratingMindmap}
          >
            {isGeneratingMindmap ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Brain className="w-4 h-4 mr-2" />
            )}
            Mindmap
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-slate-200 hover:bg-slate-50"
            onClick={handleGenerateNotes}
            disabled={item.processing_status !== 'completed' || isGeneratingNotes}
          >
            {isGeneratingNotes ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <BookOpen className="w-4 h-4 mr-2" />
            )}
            Notes
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}; 

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { FileText, Download, Eye, Edit, Trash2 } from 'lucide-react';
import { KnowledgeItem } from '../../types/knowledgeBase';

interface KnowledgeBaseItemProps {
  item: KnowledgeItem;
  onDownload?: (item: KnowledgeItem) => void;
  onView?: (item: KnowledgeItem) => void;
  onEdit?: (item: KnowledgeItem) => void;
  onDelete?: (item: KnowledgeItem) => void;
}

export const KnowledgeBaseItem: React.FC<KnowledgeBaseItemProps> = ({
  item,
  onDownload,
  onView,
  onEdit,
  onDelete
}) => {
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Processed</Badge>;
      case 'processing':
        return <Badge className="bg-yellow-100 text-yellow-800">Processing</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Pending</Badge>;
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg line-clamp-2">{item.title}</CardTitle>
          <FileText className="w-5 h-5 text-gray-500 flex-shrink-0 ml-2" />
        </div>
        {item.description && (
          <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {getStatusBadge(item.processing_status)}
            <Badge variant="outline">{item.file_type?.toUpperCase()}</Badge>
            {item.metadata?.tags?.slice(0, 2).map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
          
          <div className="text-sm text-gray-500">
            <p>{formatFileSize(item.file_size)}</p>
            <p>{new Date(item.created_at).toLocaleDateString()}</p>
          </div>

          <div className="flex gap-1">
            {onDownload && (
              <Button size="sm" variant="outline" onClick={() => onDownload(item)}>
                <Download className="w-3 h-3" />
              </Button>
            )}
            {onView && (
              <Button size="sm" variant="outline" onClick={() => onView(item)}>
                <Eye className="w-3 h-3" />
              </Button>
            )}
            {onEdit && (
              <Button size="sm" variant="outline" onClick={() => onEdit(item)}>
                <Edit className="w-3 h-3" />
              </Button>
            )}
            {onDelete && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => onDelete(item)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

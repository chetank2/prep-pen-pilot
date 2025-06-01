import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, 
  X, 
  File, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Plus,
  Tag,
  BookOpen,
  FileText,
  Video,
  Image,
  Music,
  Archive
} from 'lucide-react';
import { KnowledgeBaseService } from '@/services/knowledgeBaseService';
import { KnowledgeCategory, UploadData } from '@/types/knowledgeBase';
import { toast } from 'sonner';

interface EnhancedFileUploadDialogProps {
  trigger?: React.ReactNode;
  onUploadComplete?: (item: any) => void;
}

const DIFFICULTY_LEVELS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

const FILE_TYPE_ICONS = {
  'application/pdf': FileText,
  'image/': Image,
  'video/': Video,
  'audio/': Music,
  'text/': FileText,
  'default': File,
};

export function EnhancedFileUploadDialog({ trigger, onUploadComplete }: EnhancedFileUploadDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [categories, setCategories] = useState<KnowledgeCategory[]>([]);
  const [showNewCategory, setShowNewCategory] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categoryId: '',
    customCategoryType: '',
    subject: '',
    academic_year: '',
    difficulty_level: '',
    tags: [] as string[],
    source: '',
    author: '',
    exam_board: '',
  });

  // New category form
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    icon: 'folder',
    color: '#3B82F6',
  });

  const [currentTag, setCurrentTag] = useState('');
  const [compressionPreview, setCompressionPreview] = useState<{
    estimatedCompression: number;
    estimatedSavings: string;
  } | null>(null);

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const categoriesData = await KnowledgeBaseService.getCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to load categories:', error);
      toast.error('Failed to load categories');
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setUploadedFile(file);
      setFormData(prev => ({
        ...prev,
        title: prev.title || file.name.replace(/\.[^/.]+$/, ''),
      }));

      // Estimate compression
      estimateCompression(file);
    }
  }, []);

  const estimateCompression = (file: File) => {
    // Simple compression estimation based on file type
    let estimatedRatio = 0.3; // Default 30% compression
    
    if (file.type.startsWith('text/') || file.type === 'application/pdf') {
      estimatedRatio = 0.7; // Text compresses well
    } else if (file.type.startsWith('image/')) {
      estimatedRatio = 0.2; // Images already compressed
    } else if (file.type.startsWith('video/') || file.type.startsWith('audio/')) {
      estimatedRatio = 0.1; // Media files already compressed
    }

    const estimatedSavings = (file.size * estimatedRatio);
    setCompressionPreview({
      estimatedCompression: estimatedRatio * 100,
      estimatedSavings: formatBytes(estimatedSavings),
    });
  };

  const formatBytes = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    maxSize: 100 * 1024 * 1024, // 100MB
  });

  const handleAddTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()],
      }));
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };

  const handleCreateCategory = async () => {
    try {
      const category = await KnowledgeBaseService.createCategory(newCategory);
      setCategories(prev => [...prev, category]);
      setFormData(prev => ({ ...prev, categoryId: category.id }));
      setShowNewCategory(false);
      setNewCategory({ name: '', description: '', icon: 'folder', color: '#3B82F6' });
      toast.success('Category created successfully');
    } catch (error) {
      console.error('Failed to create category:', error);
      toast.error('Failed to create category');
    }
  };

  const handleUpload = async () => {
    if (!uploadedFile || !formData.categoryId || !formData.title.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const uploadData: UploadData = {
        categoryId: formData.categoryId,
        title: formData.title,
        description: formData.description,
        customCategoryType: formData.customCategoryType,
        metadata: {
          subject: formData.subject,
          academic_year: formData.academic_year,
          difficulty_level: formData.difficulty_level as any,
          tags: formData.tags,
          source: formData.source,
          author: formData.author,
          exam_board: formData.exam_board,
        },
      };

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const result = await KnowledgeBaseService.uploadFile(uploadedFile, uploadData);

      clearInterval(progressInterval);
      setUploadProgress(100);

      toast.success(
        `File uploaded successfully! Saved ${result.compression_stats?.spaceSaved ? formatBytes(result.compression_stats.spaceSaved) : '0 Bytes'} with ${result.compression_stats?.compressionRatio?.toFixed(1) || 0}% compression`
      );

      onUploadComplete?.(result);
      handleClose();
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setUploadedFile(null);
    setFormData({
      title: '',
      description: '',
      categoryId: '',
      customCategoryType: '',
      subject: '',
      academic_year: '',
      difficulty_level: '',
      tags: [],
      source: '',
      author: '',
      exam_board: '',
    });
    setCompressionPreview(null);
    setUploadProgress(0);
  };

  const getFileIcon = (file: File) => {
    const mimeType = file.type;
    for (const [type, Icon] of Object.entries(FILE_TYPE_ICONS)) {
      if (type !== 'default' && mimeType.startsWith(type)) {
        return Icon;
      }
    }
    return FILE_TYPE_ICONS.default;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Upload className="w-4 h-4 mr-2" />
            Upload File
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Enhanced File Upload</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Drop Zone */}
          {!uploadedFile && (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              {isDragActive ? (
                <p className="text-blue-600">Drop the file here...</p>
              ) : (
                <div>
                  <p className="text-lg font-medium mb-2">Drag & drop a file here, or click to select</p>
                  <p className="text-sm text-gray-500">
                    Supports PDF, images, videos, audio, and text files (max 100MB)
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Uploaded File Preview */}
          {uploadedFile && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {React.createElement(getFileIcon(uploadedFile), { className: "w-5 h-5" })}
                  {uploadedFile.name}
                </CardTitle>
                <CardDescription>
                  {formatBytes(uploadedFile.size)} • {uploadedFile.type}
                </CardDescription>
              </CardHeader>
              {compressionPreview && (
                <CardContent>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-green-700">
                      <Archive className="w-4 h-4" />
                      <span className="font-medium">Compression Preview</span>
                    </div>
                    <p className="text-sm text-green-600 mt-1">
                      Estimated {compressionPreview.estimatedCompression.toFixed(1)}% compression 
                      • Save ~{compressionPreview.estimatedSavings}
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          {/* Upload Form */}
          {uploadedFile && (
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="metadata">Metadata</TabsTrigger>
                <TabsTrigger value="category">Category</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter file title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customType">Custom Type</Label>
                    <Input
                      id="customType"
                      value={formData.customCategoryType}
                      onChange={(e) => setFormData(prev => ({ ...prev, customCategoryType: e.target.value }))}
                      placeholder="e.g., Research Paper, Lecture Notes"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the content"
                    rows={3}
                  />
                </div>
              </TabsContent>

              <TabsContent value="metadata" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="e.g., Mathematics, Physics"
                    />
                  </div>
                  <div>
                    <Label htmlFor="academicYear">Academic Year</Label>
                    <Input
                      id="academicYear"
                      value={formData.academic_year}
                      onChange={(e) => setFormData(prev => ({ ...prev, academic_year: e.target.value }))}
                      placeholder="e.g., 2024, Grade 12"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="difficulty">Difficulty Level</Label>
                    <Select
                      value={formData.difficulty_level}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty_level: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        {DIFFICULTY_LEVELS.map(level => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="examBoard">Exam Board</Label>
                    <Input
                      id="examBoard"
                      value={formData.exam_board}
                      onChange={(e) => setFormData(prev => ({ ...prev, exam_board: e.target.value }))}
                      placeholder="e.g., CBSE, ICSE, IB"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="source">Source</Label>
                    <Input
                      id="source"
                      value={formData.source}
                      onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
                      placeholder="e.g., Textbook, Online Course"
                    />
                  </div>
                  <div>
                    <Label htmlFor="author">Author</Label>
                    <Input
                      id="author"
                      value={formData.author}
                      onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                      placeholder="Author or creator name"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="tags">Tags</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      id="tags"
                      value={currentTag}
                      onChange={(e) => setCurrentTag(e.target.value)}
                      placeholder="Add a tag"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                    />
                    <Button type="button" onClick={handleAddTag} size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        {tag}
                        <X
                          className="w-3 h-3 cursor-pointer"
                          onClick={() => handleRemoveTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="category" className="space-y-4">
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.categoryId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                            {category.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="border-t pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowNewCategory(!showNewCategory)}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Category
                  </Button>

                  {showNewCategory && (
                    <Card className="mt-4">
                      <CardHeader>
                        <CardTitle className="text-lg">New Category</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="categoryName">Name</Label>
                            <Input
                              id="categoryName"
                              value={newCategory.name}
                              onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="Category name"
                            />
                          </div>
                          <div>
                            <Label htmlFor="categoryColor">Color</Label>
                            <Input
                              id="categoryColor"
                              type="color"
                              value={newCategory.color}
                              onChange={(e) => setNewCategory(prev => ({ ...prev, color: e.target.value }))}
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="categoryDescription">Description</Label>
                          <Textarea
                            id="categoryDescription"
                            value={newCategory.description}
                            onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Category description"
                            rows={2}
                          />
                        </div>
                        <Button onClick={handleCreateCategory} className="w-full">
                          Create Category
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="font-medium">Uploading and processing...</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
                <p className="text-sm text-gray-500 mt-2">
                  Compressing file and extracting content for AI analysis
                </p>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose} disabled={isUploading}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={!uploadedFile || !formData.categoryId || !formData.title.trim() || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload File
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 
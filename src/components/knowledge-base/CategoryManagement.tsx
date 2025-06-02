
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Plus, Edit, Trash2, Folder } from 'lucide-react';
import { KnowledgeCategory, CreateCategoryRequest } from '../../types/knowledgeBase';

interface CategoryManagementProps {
  categories: KnowledgeCategory[];
  onCreateCategory?: (categoryData: CreateCategoryRequest) => void;
  onUpdateCategory?: (id: string, categoryData: Partial<CreateCategoryRequest>) => void;
  onDeleteCategory?: (id: string) => void;
}

export const CategoryManagement: React.FC<CategoryManagementProps> = ({
  categories,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<KnowledgeCategory | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: 'folder',
    color: '#3B82F6'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingCategory) {
      onUpdateCategory?.(editingCategory.id, formData);
    } else {
      onCreateCategory?.(formData);
    }
    
    setIsDialogOpen(false);
    setEditingCategory(null);
    setFormData({ name: '', description: '', icon: 'folder', color: '#3B82F6' });
  };

  const handleEdit = (category: KnowledgeCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
      icon: category.icon,
      color: category.color
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (categoryId: string) => {
    if (confirm('Are you sure you want to delete this category?')) {
      onDeleteCategory?.(categoryId);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Category Management</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingCategory ? 'Edit Category' : 'Create New Category'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Category name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Category description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Color</label>
                  <Input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit">
                    {editingCategory ? 'Update' : 'Create'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-2">
          {categories.map((category) => (
            <div 
              key={category.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex items-center gap-3">
                <Folder 
                  className="w-5 h-5" 
                  style={{ color: category.color }}
                />
                <div>
                  <h4 className="font-medium">{category.name}</h4>
                  <p className="text-sm text-gray-500">{category.description}</p>
                </div>
                {category.is_default && (
                  <Badge variant="outline">Default</Badge>
                )}
                {category.is_custom && (
                  <Badge variant="secondary">Custom</Badge>
                )}
              </div>
              
              <div className="flex gap-1">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleEdit(category)}
                >
                  <Edit className="w-3 h-3" />
                </Button>
                {!category.is_default && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleDelete(category.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

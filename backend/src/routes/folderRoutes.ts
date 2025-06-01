import express from 'express';
import { SupabaseService } from '../services/supabaseService';
import { logger } from '../utils/logger';

const router = express.Router();

// Get user's folders
router.get('/', async (req, res) => {
  try {
    const userId = req.query.userId as string || '550e8400-e29b-41d4-a716-446655440000';
    
    const folders = await SupabaseService.getFolders(userId);

    res.json({
      success: true,
      data: folders,
    });
  } catch (error) {
    logger.error('Failed to fetch folders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch folders',
    });
  }
});

// Create new folder
router.post('/', async (req, res) => {
  try {
    const { name, description, color, icon, position } = req.body;
    const userId = req.query.userId as string || '550e8400-e29b-41d4-a716-446655440000';

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Folder name is required',
      });
    }

    const folderData = {
      user_id: userId,
      name,
      description: description || '',
      color: color || '#3B82F6',
      icon: icon || 'folder',
      position: position || 0,
    };

    const folder = await SupabaseService.createFolder(folderData);

    res.json({
      success: true,
      data: folder,
    });
  } catch (error) {
    logger.error('Failed to create folder:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create folder',
    });
  }
});

// Update folder
router.put('/:folderId', async (req, res) => {
  try {
    const { folderId } = req.params;
    const { name, description, color, icon, position } = req.body;

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (color !== undefined) updates.color = color;
    if (icon !== undefined) updates.icon = icon;
    if (position !== undefined) updates.position = position;

    const folder = await SupabaseService.updateFolder(folderId, updates);

    res.json({
      success: true,
      data: folder,
    });
  } catch (error) {
    logger.error('Failed to update folder:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update folder',
    });
  }
});

// Delete folder
router.delete('/:folderId', async (req, res) => {
  try {
    const { folderId } = req.params;

    await SupabaseService.deleteFolder(folderId);

    res.json({
      success: true,
      message: 'Folder deleted successfully',
    });
  } catch (error) {
    logger.error('Failed to delete folder:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete folder',
    });
  }
});

// Get folder contents
router.get('/:folderId/contents', async (req, res) => {
  try {
    const { folderId } = req.params;
    const contentType = req.query.contentType as string;

    let contents = await SupabaseService.getFolderContents(folderId);

    // Filter by content type if specified
    if (contentType) {
      contents = contents.filter(item => item.content_type === contentType);
    }

    res.json({
      success: true,
      data: contents,
    });
  } catch (error) {
    logger.error('Failed to fetch folder contents:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch folder contents',
    });
  }
});

// Add content to folder
router.post('/:folderId/contents', async (req, res) => {
  try {
    const { folderId } = req.params;
    const { contentId, contentType, position } = req.body;

    if (!contentId || !contentType) {
      return res.status(400).json({
        success: false,
        message: 'Content ID and content type are required',
      });
    }

    const validContentTypes = ['knowledge_item', 'generated_content', 'chat_session'];
    if (!validContentTypes.includes(contentType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid content type',
      });
    }

    const folderContent = await SupabaseService.addToFolder(folderId, contentId, contentType);

    res.json({
      success: true,
      data: folderContent,
    });
  } catch (error) {
    logger.error('Failed to add content to folder:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add content to folder',
    });
  }
});

// Remove content from folder
router.delete('/:folderId/contents', async (req, res) => {
  try {
    const { folderId } = req.params;
    const { contentId, contentType } = req.body;

    if (!contentId || !contentType) {
      return res.status(400).json({
        success: false,
        message: 'Content ID and content type are required',
      });
    }

    await SupabaseService.removeFromFolder(folderId, contentId, contentType);

    res.json({
      success: true,
      message: 'Content removed from folder successfully',
    });
  } catch (error) {
    logger.error('Failed to remove content from folder:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove content from folder',
    });
  }
});

// Get folder statistics
router.get('/:folderId/stats', async (req, res) => {
  try {
    const { folderId } = req.params;

    const contents = await SupabaseService.getFolderContents(folderId);
    
    const stats = {
      total_items: contents.length,
      knowledge_items: contents.filter(item => item.content_type === 'knowledge_item').length,
      generated_content: contents.filter(item => item.content_type === 'generated_content').length,
      chat_sessions: contents.filter(item => item.content_type === 'chat_session').length,
      content_types: [...new Set(contents.map(item => item.content_type))],
      last_updated: contents.length > 0 ? Math.max(...contents.map(item => new Date(item.added_at).getTime())) : null,
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Failed to get folder stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get folder statistics',
    });
  }
});

export default router; 
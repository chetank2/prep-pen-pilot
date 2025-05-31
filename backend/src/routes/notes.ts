import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

const router = express.Router();

// Save canvas note
router.post('/canvas', async (req, res) => {
  try {
    const { title, imageData, tags = [], folderId = null } = req.body;

    if (!title || !imageData) {
      return res.status(400).json({ error: 'Title and image data are required' });
    }

    const noteId = uuidv4();
    
    // In a real implementation, save to database
    const note = {
      id: noteId,
      type: 'canvas',
      title,
      imageData,
      tags,
      folderId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    logger.info(`Canvas note saved: ${title}`, { noteId });

    return res.json({
      success: true,
      data: note
    });
  } catch (error) {
    logger.error('Failed to save canvas note:', error);
    return res.status(500).json({ error: 'Failed to save canvas note' });
  }
});

// Save mind map
router.post('/mindmap', async (req, res) => {
  try {
    const { title, data, tags = [], folderId = null } = req.body;

    if (!title || !data) {
      return res.status(400).json({ error: 'Title and mind map data are required' });
    }

    const mapId = uuidv4();
    
    const mindMap = {
      id: mapId,
      type: 'mindmap',
      title,
      data,
      tags,
      folderId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    logger.info(`Mind map saved: ${title}`, { mapId });

    return res.json({
      success: true,
      data: mindMap
    });
  } catch (error) {
    logger.error('Failed to save mind map:', error);
    return res.status(500).json({ error: 'Failed to save mind map' });
  }
});

// Get all notes
router.get('/', async (req, res) => {
  try {
    const { type, folderId, tags } = req.query;

    // Mock data for now - in real implementation, fetch from database
    const mockNotes = [
      {
        id: '1',
        type: 'canvas',
        title: 'Constitutional Amendments',
        tags: ['GS2', 'Polity'],
        folderId: 'gs2',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      },
      {
        id: '2',
        type: 'mindmap',
        title: 'Fundamental Rights Overview',
        tags: ['GS2', 'Rights'],
        folderId: 'gs2',
        createdAt: '2024-01-14T15:30:00Z',
        updatedAt: '2024-01-14T15:30:00Z'
      }
    ];

    let filteredNotes = mockNotes;

    if (type) {
      filteredNotes = filteredNotes.filter(note => note.type === type);
    }

    if (folderId) {
      filteredNotes = filteredNotes.filter(note => note.folderId === folderId);
    }

    return res.json({
      success: true,
      data: filteredNotes
    });
  } catch (error) {
    logger.error('Failed to get notes:', error);
    return res.status(500).json({ error: 'Failed to get notes' });
  }
});

// Get specific note
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Mock data - in real implementation, fetch from database
    const mockNote = {
      id,
      type: 'canvas',
      title: 'Sample Note',
      imageData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
      tags: ['GS1'],
      folderId: 'gs1',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z'
    };

    return res.json({
      success: true,
      data: mockNote
    });
  } catch (error) {
    logger.error('Failed to get note:', error);
    return res.status(500).json({ error: 'Failed to get note' });
  }
});

// Update note
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, imageData, data, tags, folderId } = req.body;

    // In real implementation, update in database
    const updatedNote = {
      id,
      title,
      imageData,
      data,
      tags,
      folderId,
      updatedAt: new Date().toISOString()
    };

    logger.info(`Note updated: ${id}`);

    return res.json({
      success: true,
      data: updatedNote
    });
  } catch (error) {
    logger.error('Failed to update note:', error);
    return res.status(500).json({ error: 'Failed to update note' });
  }
});

// Delete note
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // In real implementation, delete from database
    logger.info(`Note deleted: ${id}`);

    return res.json({
      success: true,
      message: 'Note deleted successfully'
    });
  } catch (error) {
    logger.error('Failed to delete note:', error);
    return res.status(500).json({ error: 'Failed to delete note' });
  }
});

export default router; 
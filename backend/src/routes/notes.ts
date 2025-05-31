import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

const router = express.Router();

// In-memory storage for notes (replace with database in production)
interface Note {
  id: string;
  type: 'canvas' | 'mindmap';
  title: string;
  imageData?: string;
  data?: any;
  tags: string[];
  folderId: string | null;
  createdAt: string;
  updatedAt: string;
}

const notesStorage: Note[] = [];

// Save canvas note
router.post('/canvas', async (req, res) => {
  try {
    const { title, imageData, tags = [], folderId = null } = req.body;

    if (!title || !imageData) {
      return res.status(400).json({ error: 'Title and image data are required' });
    }

    const noteId = uuidv4();
    
    const note: Note = {
      id: noteId,
      type: 'canvas',
      title,
      imageData,
      tags,
      folderId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    notesStorage.push(note);

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
    
    const mindMap: Note = {
      id: mapId,
      type: 'mindmap',
      title,
      data,
      tags,
      folderId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    notesStorage.push(mindMap);

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

    let filteredNotes = [...notesStorage];

    if (type) {
      filteredNotes = filteredNotes.filter(note => note.type === type);
    }

    if (folderId) {
      filteredNotes = filteredNotes.filter(note => note.folderId === folderId);
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      filteredNotes = filteredNotes.filter(note => 
        tagArray.some(tag => note.tags.includes(tag as string))
      );
    }

    // Sort by creation date (newest first)
    filteredNotes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

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

    const note = notesStorage.find(n => n.id === id);

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    return res.json({
      success: true,
      data: note
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

    const noteIndex = notesStorage.findIndex(n => n.id === id);

    if (noteIndex === -1) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Update the note
    const updatedNote = {
      ...notesStorage[noteIndex],
      ...(title && { title }),
      ...(imageData && { imageData }),
      ...(data && { data }),
      ...(tags && { tags }),
      ...(folderId !== undefined && { folderId }),
      updatedAt: new Date().toISOString()
    };

    notesStorage[noteIndex] = updatedNote;

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

    const noteIndex = notesStorage.findIndex(n => n.id === id);

    if (noteIndex === -1) {
      return res.status(404).json({ error: 'Note not found' });
    }

    notesStorage.splice(noteIndex, 1);

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
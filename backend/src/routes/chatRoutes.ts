import express from 'express';
import multer from 'multer';
import { SupabaseService } from '../services/supabaseService';
import { OpenAIService } from '../services/OpenAIService';
import { EnhancedFileUploadService } from '../services/enhancedFileUploadService';
import { logger } from '../utils/logger';
import { supabase } from '../config/supabase';
import Tesseract from 'tesseract.js';

const router = express.Router();
const openaiService = new OpenAIService();

// Configure multer for chat file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
  fileFilter: (req, file, cb) => {
    // Allow images and documents in chat
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain', 'text/markdown',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not supported in chat`));
    }
  }
});

// Get or create chat session
router.post('/sessions', async (req, res) => {
  try {
    const { title, folder_id, context_type = 'general', context_data = {} } = req.body;
    const userId = req.query.userId as string || '550e8400-e29b-41d4-a716-446655440000';

    const session = await SupabaseService.createChatSession({
      user_id: userId,
      title: title || 'New Chat',
      folder_id,
      context_type,
      context_data,
    });

    res.json({
      success: true,
      data: session,
    });
  } catch (error) {
    logger.error('Failed to create chat session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create chat session',
    });
  }
});

// Get chat sessions for a user
router.get('/sessions', async (req, res) => {
  try {
    const userId = req.query.userId as string;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID is required' 
      });
    }

    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    res.json({ 
      success: true, 
      data: data || [] 
    });
  } catch (error: any) {
    console.error('Error fetching chat sessions:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch chat sessions' 
    });
  }
});

// Get messages for a chat session
router.get('/sessions/:sessionId/messages', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.query.userId as string;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID is required' 
      });
    }

    const messages = await SupabaseService.getChatMessages(sessionId);

    res.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    logger.error('Failed to fetch chat messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chat messages',
    });
  }
});

// Send message with optional file uploads
router.post('/sessions/:sessionId/messages', upload.array('files', 5), async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { content } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required',
      });
    }

    if (!content && (!files || files.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Message content or files are required',
      });
    }

    // Process uploaded files if any
    let attachments: any[] = [];
    let extractedTexts: string[] = [];

    if (files && files.length > 0) {
      logger.info(`Processing ${files.length} files in chat message`);
      
      for (const file of files) {
        try {
          // For images, use OCR; for documents, extract text
          let extractedText = '';
          
          if (file.mimetype.startsWith('image/')) {
            // Perform OCR on images to extract text
            try {
              const { data } = await Tesseract.recognize(file.buffer, 'eng');
              extractedText = data.text || '';
            } catch (err) {
              logger.warn(`OCR failed for ${file.originalname}:`, err);
            }
          } else if (file.mimetype === 'application/pdf') {
            // Extract text from PDF
            const result = await EnhancedFileUploadService.extractTextFromFile(file);
            extractedText = result.extractedText || '';
          } else if (file.mimetype.includes('text/')) {
            extractedText = file.buffer.toString('utf-8');
          }

          attachments.push({
            id: `attach-${Date.now()}-${Math.random()}`,
            name: file.originalname,
            type: file.mimetype,
            size: file.size,
            processing_status: 'completed'
          });

          if (extractedText) {
            extractedTexts.push(`File: ${file.originalname}\nContent: ${extractedText.substring(0, 2000)}`);
          }
        } catch (error) {
          logger.warn(`Failed to process file ${file.originalname}:`, error);
          attachments.push({
            id: `attach-${Date.now()}-${Math.random()}`,
            name: file.originalname,
            type: file.mimetype,
            size: file.size,
            processing_status: 'failed'
          });
        }
      }
    }

    // Combine user message with extracted text from files
    const fullContent = [content, ...extractedTexts].filter(Boolean).join('\n\n');

    // Save user message
    const userMessage = await SupabaseService.createChatMessage({
      session_id: sessionId,
      role: 'user',
      content: fullContent,
      attachments,
    });

    // Get session context
    const session = await SupabaseService.getChatSession(sessionId);
    const recentMessages = await SupabaseService.getChatMessages(sessionId, 10);

    // Generate AI response with context
    const aiResponse = await generateContextualAIResponse(
      fullContent,
      session,
      recentMessages.slice(0, -1) // Exclude the message we just added
    );

    // Save assistant message
    const assistantMessage = await SupabaseService.createChatMessage({
      session_id: sessionId,
      role: 'assistant',
      content: aiResponse.content,
      context_used: aiResponse.context_used,
    });

    // Update session title if it's the first exchange
    if (recentMessages.length <= 1) {
      const title = generateSessionTitle(fullContent);
      await SupabaseService.updateChatSession(sessionId, { title });
    }

    res.json({
      success: true,
      data: {
        user_message: userMessage,
        assistant_message: assistantMessage,
        suggestions: aiResponse.suggestions,
      },
    });
  } catch (error) {
    logger.error('Failed to send chat message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
    });
  }
});

// Generate specific content (mindmap, notes, etc.)
router.post('/generate', async (req, res) => {
  try {
    const { 
      type, 
      content, 
      context, 
      user_query, 
      options = {} 
    } = req.body;

    if (!type || !content || !user_query) {
      return res.status(400).json({
        success: false,
        message: 'Type, content, and user_query are required',
      });
    }

    let generatedContent;
    let contentData;

    switch (type) {
      case 'mindmap':
        generatedContent = await openaiService.generateMindmap(content, options.subject || 'Topic');
        contentData = {
          type: 'mindmap',
          mermaidSyntax: generatedContent,
          subject: options.subject,
        };
        break;

      case 'notes':
        generatedContent = await openaiService.generateNotes(content, options.subject || 'Topic');
        contentData = {
          type: 'notes',
          content: generatedContent,
          format: options.format || 'outline',
        };
        break;

      case 'summary':
        generatedContent = await openaiService.generateSummary(content);
        contentData = {
          type: 'summary',
          content: generatedContent,
          depth: options.depth || 'brief',
        };
        break;

      case 'chart':
        generatedContent = await generateChart(content, user_query, options);
        contentData = {
          type: 'chart',
          chartData: generatedContent,
          chartType: options.chartType || 'flowchart',
        };
        break;

      case 'analysis':
        generatedContent = await openaiService.analyzeContent(content);
        contentData = {
          type: 'analysis',
          analysis: generatedContent,
          style: options.style || 'academic',
        };
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid generation type',
        });
    }

    res.json({
      success: true,
      data: {
        content_type: type,
        content_data: contentData,
        generated_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Content generation failed:', error);
    res.status(500).json({
      success: false,
      message: 'Content generation failed',
    });
  }
});

// Save generated content to folder
router.post('/save-content', async (req, res) => {
  try {
    const {
      content,
      content_type,
      title,
      folder_id,
      tags = [],
      source_message_id,
      knowledge_item_id
    } = req.body;

    if (!content || !content_type || !title || !folder_id) {
      return res.status(400).json({
        success: false,
        message: 'Content, content_type, title, and folder_id are required',
      });
    }

    // Create generated content record
    const generatedContent = await SupabaseService.createGeneratedContent({
      knowledge_item_id,
      chat_message_id: source_message_id,
      folder_id,
      content_type,
      title,
      user_title: title,
      content_data: typeof content === 'string' ? { content } : content,
      tags,
    });

    // Add to folder contents
    await SupabaseService.addToFolder(folder_id, generatedContent.id, 'generated_content');

    res.json({
      success: true,
      data: generatedContent,
    });
  } catch (error) {
    logger.error('Failed to save content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save content',
    });
  }
});

// Helper functions
async function generateContextualAIResponse(
  userMessage: string,
  session: any,
  recentMessages: any[]
): Promise<{
  content: string;
  context_used: any;
  suggestions?: string[];
}> {
  try {
    let contextText = '';
    let knowledgeItems: any[] = [];

    // Get folder context if session is folder-specific
    if (session.context_type === 'folder' && session.folder_id) {
      const folderContents = await SupabaseService.getFolderContents(session.folder_id);
      knowledgeItems = folderContents.filter(item => item.content_type === 'knowledge_item');
      
      // Use top 3 items for context
      contextText = knowledgeItems.slice(0, 3)
        .map(item => `Title: ${item.title}\nContent: ${item.extracted_text?.substring(0, 1000) || item.description || ''}`)
        .join('\n\n');
    } else {
      // General context - search for relevant items
      const searchTerms = extractKeywords(userMessage);
      if (searchTerms.length > 0) {
        knowledgeItems = await SupabaseService.searchKnowledgeItems(
          session.user_id,
          searchTerms.join(' '),
          {}
        );
        
        contextText = knowledgeItems.slice(0, 2)
          .map(item => `Title: ${item.title}\nContent: ${item.extracted_text?.substring(0, 800) || item.description || ''}`)
          .join('\n\n');
      }
    }

    // Build conversation context
    const conversationContext = recentMessages
      .slice(-4)
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    // Generate response
    const systemPrompt = buildSystemPrompt(contextText, conversationContext, session.context_type);
    const response = await openaiService.generateResponse(userMessage, systemPrompt);

    // Generate suggestions based on context
    const suggestions = generateSuggestions(userMessage, session.context_type, knowledgeItems.length > 0);

    return {
      content: response,
      context_used: {
        knowledge_items: knowledgeItems.length,
        context_length: contextText.length,
        session_type: session.context_type,
        folder_id: session.folder_id,
      },
      suggestions,
    };
  } catch (error) {
    logger.error('AI response generation failed:', error);
    return {
      content: "I'm sorry, I'm having trouble processing your request right now. Please try again in a moment.",
      context_used: { error: true },
    };
  }
}

function buildSystemPrompt(contextText: string, conversationContext: string, sessionType: string): string {
  const basePrompt = `You are an AI educational assistant helping students with their learning materials. You are knowledgeable, encouraging, and provide clear explanations.`;
  
  let contextPrompt = '';
  if (contextText) {
    contextPrompt = `\n\nRelevant content from user's knowledge base:\n${contextText}`;
  }
  
  let conversationPrompt = '';
  if (conversationContext) {
    conversationPrompt = `\n\nRecent conversation:\n${conversationContext}`;
  }

  const sessionPrompt = sessionType === 'folder' 
    ? '\n\nYou are currently in a folder-specific context. Focus on the materials in this folder when relevant.'
    : '\n\nYou have access to the user\'s entire knowledge base. Reference relevant materials when helpful.';

  const guidelines = `\n\nGuidelines:
- Be helpful, educational, and encouraging
- Reference the user's uploaded content when relevant
- Provide clear explanations and examples
- Suggest study strategies and learning techniques
- If asked to generate content (mindmaps, notes, summaries), explain what you can create
- Keep responses concise but informative
- Use bullet points and formatting for clarity`;

  return basePrompt + contextPrompt + conversationPrompt + sessionPrompt + guidelines;
}

function generateSuggestions(userMessage: string, sessionType: string, hasKnowledge: boolean): string[] {
  const suggestions = [];
  
  if (hasKnowledge) {
    suggestions.push("Generate a mind map from this content");
    suggestions.push("Create study notes");
    suggestions.push("Summarize key points");
  }
  
  suggestions.push("Explain this concept in simple terms");
  suggestions.push("Create practice questions");
  
  if (sessionType === 'folder') {
    suggestions.push("Analyze all content in this folder");
  }
  
  return suggestions.slice(0, 3);
}

function extractKeywords(text: string): string[] {
  // Simple keyword extraction
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3);
  
  // Remove common words
  const stopWords = ['this', 'that', 'with', 'have', 'will', 'from', 'they', 'been', 'have', 'their', 'what', 'when', 'where', 'how'];
  return words.filter(word => !stopWords.includes(word)).slice(0, 5);
}

function generateSessionTitle(content: string): string {
  const words = content.split(' ').slice(0, 6).join(' ');
  return words.length > 50 ? words.substring(0, 47) + '...' : words;
}

async function generateChart(content: string, userQuery: string, options: any): Promise<any> {
  // Placeholder for chart generation
  // This would integrate with chart libraries to create various visualizations
  return {
    type: options.chartType || 'flowchart',
    data: {
      nodes: [
        { id: 'start', label: 'Start', type: 'start' },
        { id: 'process', label: 'Process', type: 'process' },
        { id: 'end', label: 'End', type: 'end' }
      ],
      edges: [
        { from: 'start', to: 'process' },
        { from: 'process', to: 'end' }
      ]
    },
    title: 'Generated Chart'
  };
}

export default router; 
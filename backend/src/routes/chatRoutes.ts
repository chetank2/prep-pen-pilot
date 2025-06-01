import express from 'express';
import { SupabaseService } from '../services/supabaseService';
import { OpenAIService } from '../services/OpenAIService';
import { logger } from '../utils/logger';

const router = express.Router();
const openaiService = new OpenAIService();

// Get chat conversations
router.get('/conversations', async (req, res) => {
  try {
    const { data, error } = await SupabaseService.supabase
      .from('chat_conversations')
      .select('*')
      .eq('user_id', 'user-123') // Mock user ID
      .order('updated_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    logger.error('Failed to fetch conversations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversations',
    });
  }
});

// Create new conversation
router.post('/conversations', async (req, res) => {
  try {
    const { title } = req.body;
    const conversation = await SupabaseService.createChatConversation('user-123', title);

    res.json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    logger.error('Failed to create conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create conversation',
    });
  }
});

// Get messages for a conversation
router.get('/conversations/:id/messages', async (req, res) => {
  try {
    const messages = await SupabaseService.getChatMessages(req.params.id);

    res.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    logger.error('Failed to fetch messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages',
    });
  }
});

// Send message and get AI response
router.post('/message', async (req, res) => {
  try {
    const { conversationId, content } = req.body;

    if (!conversationId || !content) {
      return res.status(400).json({
        success: false,
        message: 'Conversation ID and content are required',
      });
    }

    // Save user message
    const userMessage = await SupabaseService.createChatMessage({
      conversation_id: conversationId,
      role: 'user',
      content: content.trim(),
    });

    // Get conversation context (recent messages)
    const recentMessages = await SupabaseService.getChatMessages(conversationId);
    const contextMessages = recentMessages.slice(-10); // Last 10 messages for context

    // Get relevant knowledge items (simple keyword search for now)
    const keywords = extractKeywords(content);
    let relevantItems: any[] = [];
    let contextText = '';

    if (keywords.length > 0) {
      try {
        relevantItems = await SupabaseService.searchKnowledgeItems(
          'user-123',
          keywords.join(' '),
          {}
        );
        
        // Use top 3 most relevant items for context
        const topItems = relevantItems.slice(0, 3);
        contextText = topItems
          .map(item => `Title: ${item.title}\nContent: ${item.extracted_text?.substring(0, 500) || item.description || ''}`)
          .join('\n\n');
      } catch (error) {
        logger.warn('Failed to search for relevant items:', error);
      }
    }

    // Generate AI response
    const aiResponse = await generateAIResponse(content, contextText, contextMessages);

    // Save assistant message
    const assistantMessage = await SupabaseService.createChatMessage({
      conversation_id: conversationId,
      role: 'assistant',
      content: aiResponse,
      referenced_items: relevantItems.slice(0, 3).map(item => item.id),
      context_used: {
        knowledge_items: relevantItems.length,
        context_length: contextText.length,
      },
    });

    // Update conversation timestamp
    await SupabaseService.supabase
      .from('chat_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    res.json({
      success: true,
      data: {
        userMessage,
        assistantMessage,
      },
    });
  } catch (error) {
    logger.error('Failed to process message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process message',
    });
  }
});

// Generate AI content (mindmap, notes, summary)
router.post('/generate/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { knowledgeItemId, subject, customPrompt } = req.body;

    if (!knowledgeItemId) {
      return res.status(400).json({
        success: false,
        message: 'Knowledge item ID is required',
      });
    }

    // Get knowledge item
    const item = await SupabaseService.getKnowledgeItemById(knowledgeItemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Knowledge item not found',
      });
    }

    let generatedContent;
    let contentData;

    switch (type) {
      case 'mindmap':
        generatedContent = await openaiService.generateMindmap(
          item.extracted_text || item.description || '',
          subject || item.metadata?.subject
        );
        contentData = {
          type: 'mindmap',
          data: generatedContent,
        };
        break;

      case 'notes':
        generatedContent = await openaiService.generateNotes(
          item.extracted_text || item.description || '',
          subject || item.metadata?.subject
        );
        contentData = {
          type: 'notes',
          data: generatedContent,
        };
        break;

      case 'summary':
        generatedContent = await openaiService.generateSummary(
          item.extracted_text || item.description || ''
        );
        contentData = {
          type: 'summary',
          data: generatedContent,
        };
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid generation type',
        });
    }

    // Save generated content
    const savedContent = await SupabaseService.createUserContent({
      knowledge_item_id: knowledgeItemId,
      content_type: type as any,
      title: `Generated ${type} for ${item.title}`,
      content_data: contentData,
      prompt_used: customPrompt || `Generate ${type} for educational content`,
    });

    res.json({
      success: true,
      data: savedContent,
    });
  } catch (error) {
    logger.error(`Failed to generate ${req.params.type}:`, error);
    res.status(500).json({
      success: false,
      message: `Failed to generate ${req.params.type}`,
    });
  }
});

// Helper functions
function extractKeywords(text: string): string[] {
  // Simple keyword extraction - remove common words and get meaningful terms
  const commonWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'could', 'should', 'may', 'might', 'can', 'what', 'how', 'when', 'where',
    'why', 'who', 'which', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it',
    'we', 'they', 'me', 'him', 'her', 'us', 'them'
  ]);

  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !commonWords.has(word))
    .slice(0, 10); // Top 10 keywords
}

async function generateAIResponse(
  userMessage: string,
  contextText: string,
  recentMessages: any[]
): Promise<string> {
  try {
    // Build conversation context
    const conversationContext = recentMessages
      .slice(-6) // Last 6 messages for context
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    // Create system prompt
    const systemPrompt = `You are an AI educational assistant helping students with their uploaded learning materials. 

Context from user's knowledge base:
${contextText}

Recent conversation:
${conversationContext}

Guidelines:
- Be helpful, educational, and encouraging
- Reference the user's uploaded content when relevant
- Provide clear explanations and examples
- Suggest study strategies and learning techniques
- If asked to generate content (mindmaps, notes, summaries), explain what you can create
- Keep responses concise but informative`;

    const response = await openaiService.generateResponse(userMessage, systemPrompt);
    return response;
  } catch (error) {
    logger.error('AI response generation failed:', error);
    return "I'm sorry, I'm having trouble processing your request right now. Please try again in a moment.";
  }
}

export default router; 
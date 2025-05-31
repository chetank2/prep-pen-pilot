import express from 'express';
import OpenAI from 'openai';
import { logger } from '../utils/logger';

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Summarize selected text
router.post('/summarize', async (req, res) => {
  try {
    const { text, context = '' } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required for summarization' });
    }

    if (text.length > 8000) {
      return res.status(400).json({ error: 'Text too long. Maximum 8000 characters allowed.' });
    }

    const prompt = `You are an expert UPSC preparation assistant. Summarize the following text in a concise, structured format suitable for UPSC exam preparation. Focus on key concepts, important facts, and exam-relevant information.

Context: ${context}

Text to summarize:
${text}

Please provide:
1. Key points (bullet format)
2. Important concepts/terms
3. Exam relevance
4. Memory aids if applicable`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert UPSC preparation assistant. Provide concise, structured summaries focused on exam preparation."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.3,
    });

    const summary = completion.choices[0]?.message?.content || '';

    logger.info('Text summarized successfully', { textLength: text.length });

    return res.json({
      success: true,
      data: {
        summary,
        originalLength: text.length,
        summaryLength: summary.length
      }
    });
  } catch (error) {
    logger.error('Summarization failed:', error);
    return res.status(500).json({ error: 'Failed to summarize text' });
  }
});

// Generate mind map from text
router.post('/mindmap', async (req, res) => {
  try {
    const { text, topic = '' } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required for mind map generation' });
    }

    const prompt = `Create a hierarchical mind map structure from the following text about ${topic}. 
Return the response as a JSON object with nested structure suitable for UPSC preparation.

Text: ${text}

Format the response as:
{
  "title": "Main Topic",
  "children": [
    {
      "title": "Subtopic 1",
      "children": [
        { "title": "Detail 1" },
        { "title": "Detail 2" }
      ]
    }
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert at creating structured mind maps for UPSC preparation. Always respond with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1500,
      temperature: 0.2,
    });

    const mindMapText = completion.choices[0]?.message?.content || '{}';
    
    try {
      const mindMap = JSON.parse(mindMapText);
      
      logger.info('Mind map generated successfully', { topic });

      return res.json({
        success: true,
        data: mindMap
      });
    } catch (parseError) {
      logger.error('Failed to parse mind map JSON:', parseError);
      return res.status(500).json({ error: 'Failed to generate valid mind map structure' });
    }
  } catch (error) {
    logger.error('Mind map generation failed:', error);
    return res.status(500).json({ error: 'Failed to generate mind map' });
  }
});

// Answer questions about the content
router.post('/question', async (req, res) => {
  try {
    const { question, context = '' } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const prompt = `You are an expert UPSC preparation assistant. Answer the following question based on the provided context. 
Provide a comprehensive answer suitable for UPSC exam preparation, including relevant examples and exam tips where applicable.

Context: ${context}

Question: ${question}

Please provide:
1. Direct answer
2. Explanation with examples
3. UPSC exam relevance
4. Related topics to study`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert UPSC preparation assistant. Provide comprehensive, exam-focused answers."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1200,
      temperature: 0.3,
    });

    const answer = completion.choices[0]?.message?.content || '';

    logger.info('Question answered successfully', { questionLength: question.length });

    return res.json({
      success: true,
      data: {
        question,
        answer,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Question answering failed:', error);
    return res.status(500).json({ error: 'Failed to answer question' });
  }
});

export default router; 
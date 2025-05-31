import OpenAI from 'openai';
import { logger } from '../utils/logger';

export class OpenAIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateEmbeddings(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text,
      });

      if (!response.data || !response.data[0] || !response.data[0].embedding) {
        throw new Error('Invalid embedding response');
      }

      return response.data[0].embedding;
    } catch (error) {
      logger.error('Error generating embeddings:', error);
      throw new Error('Failed to generate embeddings');
    }
  }

  async generateMindmap(content: string, subject: string): Promise<string> {
    try {
      const prompt = `
        Create a comprehensive mindmap in Mermaid syntax for the subject "${subject}" 
        based on the following content: 

        ${content}
        
        Requirements:
        - Use Mermaid mindmap syntax (start with "mindmap" and use proper indentation)
        - Include main topics and subtopics (maximum 4 levels deep)
        - Make it educational and easy to understand
        - Focus on key concepts and relationships
        - Use clear, concise labels
        - Ensure proper Mermaid syntax formatting
        
        Example format:
        mindmap
          root((${subject}))
            Topic 1
              Subtopic 1.1
                Detail 1.1.1
              Subtopic 1.2
            Topic 2
              Subtopic 2.1
              Subtopic 2.2
        
        Return only the Mermaid syntax, no additional text.
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1500,
        temperature: 0.7,
      });

      if (!response.choices || !response.choices[0] || !response.choices[0].message) {
        throw new Error('Invalid mindmap response');
      }

      return response.choices[0].message.content || '';
    } catch (error) {
      logger.error('Error generating mindmap:', error);
      throw new Error('Failed to generate mindmap');
    }
  }

  async generateNotes(content: string, subject?: string): Promise<string> {
    try {
      const prompt = `
        Generate comprehensive study notes from the following content${subject ? ` about ${subject}` : ''}:

        ${content}

        Requirements:
        - Create well-structured notes with clear headings and subheadings
        - Use bullet points and numbered lists where appropriate
        - Include key concepts, definitions, and important facts
        - Add summary points at the end
        - Use markdown formatting
        - Make it suitable for studying and revision
        - Keep it concise but comprehensive

        Format the notes in markdown with proper headings (##, ###, etc.).
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000,
        temperature: 0.5,
      });

      if (!response.choices || !response.choices[0] || !response.choices[0].message) {
        throw new Error('Invalid notes response');
      }

      return response.choices[0].message.content || '';
    } catch (error) {
      logger.error('Error generating notes:', error);
      throw new Error('Failed to generate notes');
    }
  }

  async generateSummary(content: string): Promise<string> {
    try {
      const prompt = `
        Create a concise summary of the following content:

        ${content}

        Requirements:
        - Keep it under 200 words
        - Include the main points and key takeaways
        - Use clear, simple language
        - Structure it with bullet points if needed
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
        temperature: 0.5,
      });

      if (!response.choices || !response.choices[0] || !response.choices[0].message) {
        throw new Error('Invalid summary response');
      }

      return response.choices[0].message.content || '';
    } catch (error) {
      logger.error('Error generating summary:', error);
      throw new Error('Failed to generate summary');
    }
  }

  async analyzeContent(content: string): Promise<any> {
    try {
      const prompt = `
        Analyze the following content and provide:
        1. Main topics (up to 5)
        2. Difficulty level (beginner/intermediate/advanced)
        3. Key terms (up to 10)
        4. Suggested categories for organization

        Content: ${content}

        Return the analysis in JSON format:
        {
          "topics": ["topic1", "topic2"],
          "difficulty": "beginner|intermediate|advanced",
          "keyTerms": ["term1", "term2"],
          "suggestedCategories": ["category1", "category2"]
        }
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.3,
      });

      if (!response.choices || !response.choices[0] || !response.choices[0].message) {
        throw new Error('Invalid analysis response');
      }

      const content_response = response.choices[0].message.content || '{}';
      return JSON.parse(content_response);
    } catch (error) {
      logger.error('Error analyzing content:', error);
      return {
        topics: [],
        difficulty: 'intermediate',
        keyTerms: [],
        suggestedCategories: []
      };
    }
  }
} 
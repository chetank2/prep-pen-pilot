import { OpenAI } from 'openai';
import { Anthropic } from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../utils/logger';
import axios from 'axios';
import UPSCSyllabusValidationService from './UPSCSyllabusValidationService';

export interface LLMProvider {
  id: string;
  name: string;
  displayName: string;
  isFree: boolean;
  isActive: boolean;
  strengths: string[];
  config: Record<string, any>;
}

export interface GenerationRequest {
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  type?: 'summary' | 'analysis' | 'chart' | 'notes' | 'mindmap' | 'enhanced';
  content?: string;
  subject?: string;
  userPreferences?: {
    style: 'brief' | 'comprehensive' | 'detailed';
    includeCharts: boolean;
    highlightPreviousYear: boolean;
    summaryLength?: '100' | '500' | '1000' | 'full';
  };
}

export interface LLMResponse {
  text: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export class MultiLLMService {
  private static instance: MultiLLMService;
  private providers: Map<string, LLMProvider> = new Map();
  private openai: OpenAI;
  private anthropic: Anthropic;
  private gemini: GoogleGenerativeAI;
  private currentModel: string;
  private syllabusValidator: UPSCSyllabusValidationService;

  private constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
    this.gemini = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');
    this.currentModel = 'gpt-4';
    
    this.initializeProviders();
    this.syllabusValidator = new UPSCSyllabusValidationService();
  }

  public static getInstance(): MultiLLMService {
    if (!MultiLLMService.instance) {
      MultiLLMService.instance = new MultiLLMService();
    }
    return MultiLLMService.instance;
  }

  public getCurrentModel(): string {
    return this.currentModel;
  }

  public setCurrentModel(model: string): void {
    this.currentModel = model;
  }

  private initializeProviders(): void {
    // OpenAI GPT-4
    this.providers.set('openai', {
      id: 'openai',
      name: 'openai',
      displayName: 'OpenAI GPT-4',
      isFree: false,
      isActive: !!process.env.OPENAI_API_KEY,
      strengths: ['analysis', 'summarization', 'comprehensive_answers'],
      config: { temperature: 0.7, max_tokens: 2000 }
    });

    // OpenAI GPT-3.5
    this.providers.set('openai-3.5', {
      id: 'openai-3.5',
      name: 'openai-3.5',
      displayName: 'OpenAI GPT-3.5 Turbo',
      isFree: false,
      isActive: !!process.env.OPENAI_API_KEY,
      strengths: ['quick_summaries', 'chart_generation'],
      config: { temperature: 0.5, max_tokens: 1500 }
    });

    // Anthropic Claude
    this.providers.set('anthropic', {
      id: 'anthropic',
      name: 'anthropic',
      displayName: 'Anthropic Claude',
      isFree: false,
      isActive: !!process.env.ANTHROPIC_API_KEY,
      strengths: ['detailed_analysis', 'reasoning', 'structured_content'],
      config: { temperature: 0.6, max_tokens: 2000 }
    });

    // Google Gemini
    this.providers.set('google', {
      id: 'google',
      name: 'google',
      displayName: 'Google Gemini',
      isFree: false,
      isActive: !!process.env.GOOGLE_API_KEY,
      strengths: ['chart_generation', 'visual_analysis', 'multi_modal'],
      config: { temperature: 0.7, max_tokens: 1500 }
    });

    // Hugging Face (Free)
    this.providers.set('huggingface', {
      id: 'huggingface',
      name: 'huggingface',
      displayName: 'Hugging Face (Free)',
      isFree: true,
      isActive: true,
      strengths: ['basic_summaries', 'simple_analysis'],
      config: { temperature: 0.8, max_tokens: 1000 }
    });
  }

  public async generateContent(request: GenerationRequest): Promise<LLMResponse> {
    try {
      const model = request.model || this.currentModel;

      if (model.startsWith('gpt')) {
        return await this.generateWithOpenAI(request);
      } else if (model.startsWith('claude')) {
        return await this.generateWithAnthropic(request);
      } else if (model.startsWith('gemini')) {
        return await this.generateWithGemini(request);
      } else {
        throw new Error(`Unsupported model: ${model}`);
      }
    } catch (error) {
      logger.error('Error generating content:', error);
      throw error;
    }
  }

  private async generateWithOpenAI(request: GenerationRequest): Promise<LLMResponse> {
    const response = await this.openai.chat.completions.create({
      model: request.model || 'gpt-4',
      messages: [{ role: 'user', content: request.prompt }],
      temperature: request.temperature || 0.7,
      max_tokens: request.maxTokens || 2000
    });

    const usage = response.usage ? {
      promptTokens: response.usage.prompt_tokens,
      completionTokens: response.usage.completion_tokens,
      totalTokens: response.usage.total_tokens
    } : undefined;

    return {
      text: response.choices[0]?.message?.content || '',
      model: response.model,
      usage
    };
  }

  private async generateWithAnthropic(request: GenerationRequest): Promise<LLMResponse> {
    const response = await this.anthropic.messages.create({
      model: request.model || 'claude-3-opus-20240229',
      messages: [{ role: 'user', content: request.prompt }],
      temperature: request.temperature || 0.7,
      max_tokens: request.maxTokens || 2000
    });

    const content = response.content[0];
    if (!content || 'text' in content === false) {
      throw new Error('Invalid response from Anthropic API');
    }

    return {
      text: content.text,
      model: response.model,
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens
      }
    };
  }

  private async generateWithGemini(request: GenerationRequest): Promise<LLMResponse> {
    const model = this.gemini.getGenerativeModel({ model: request.model || 'gemini-pro' });
    const result = await model.generateContent(request.prompt);
    const response = await result.response;

    return {
      text: response.text(),
      model: request.model || 'gemini-pro'
    };
  }

  private selectBestProvider(type: string): string {
    const activeProviders = Array.from(this.providers.values()).filter(p => p.isActive);
    
    // Select based on task type and provider strengths
    switch (type) {
      case 'analysis':
        return activeProviders.find(p => p.strengths.includes('detailed_analysis'))?.name || 
               activeProviders.find(p => p.strengths.includes('analysis'))?.name || 
               'openai';
      
      case 'chart':
        return activeProviders.find(p => p.strengths.includes('chart_generation'))?.name || 
               'google';
      
      case 'summary':
        return activeProviders.find(p => p.strengths.includes('summarization'))?.name || 
               activeProviders.find(p => p.strengths.includes('quick_summaries'))?.name || 
               'openai-3.5';
      
      default:
        return activeProviders.find(p => !p.isFree)?.name || 'huggingface';
    }
  }

  private getFallbackProvider(failedProvider: string): string | null {
    const activeProviders = Array.from(this.providers.values())
      .filter(p => p.isActive && p.name !== failedProvider);
    
    // Prefer non-free providers for fallback
    const nonFreeProvider = activeProviders.find(p => !p.isFree);
    if (nonFreeProvider) return nonFreeProvider.name;
    
    // Fall back to free provider if necessary
    const freeProvider = activeProviders.find(p => p.isFree);
    return freeProvider?.name || null;
  }

  private buildUPSCPrompt(request: GenerationRequest): string {
    const { type, content, subject, userPreferences } = request;
    
    // Get syllabus topics for the subject to ensure alignment
    const syllabusTopics = subject ? this.syllabusValidator.getSyllabusTopics(subject) : [];
    
    let basePrompt = `You are an expert UPSC preparation assistant. The UPSC syllabus is your LIGHTHOUSE - all content must be validated against it.

${syllabusTopics.length > 0 ? `
OFFICIAL UPSC SYLLABUS TOPICS for ${subject}:
${syllabusTopics.slice(0, 15).map((topic, i) => `${i + 1}. ${topic}`).join('\n')}
` : ''}`;
    
    switch (type) {
      case 'summary':
        const summaryLength = userPreferences?.summaryLength || 'full';
        let lengthInstructions = '';
        
        switch (summaryLength) {
          case '100':
            lengthInstructions = `
- Keep summary extremely concise (approximately 100-150 words / 8-10 lines)
- Focus only on the most critical points for last-week revision
- Use bullet points for quick scanning
- Highlight only the most exam-relevant facts
- Perfect for quick revision before exam day`;
            break;
          case '500':
            lengthInstructions = `
- Medium-length summary (approximately 500-750 words / 40-50 lines)
- Include important details but maintain readability
- Suitable for 1-month before exam preparation
- Cover key concepts with sufficient detail for understanding
- Include important dates, names, and statistics`;
            break;
          case '1000':
            lengthInstructions = `
- Detailed summary (approximately 1000-1500 words / 80-100 lines)
- Comprehensive coverage suitable for 2-3 months before exam
- Include background context and detailed explanations
- Cover all important aspects with examples
- Provide comprehensive understanding of the topic`;
            break;
          default: // 'full'
            lengthInstructions = `
- Complete comprehensive summary (no strict word limit)
- Full coverage for early preparation stage
- Include all relevant details, context, and examples
- Provide thorough understanding suitable for initial learning
- Include related topics and cross-connections`;
        }

        basePrompt += `Create a ${summaryLength === 'full' ? 'comprehensive' : `${summaryLength}-line`} summary of the following UPSC study material${subject ? ` about ${subject}` : ''}:

Content: ${content}

Requirements:
${lengthInstructions}
- Focus on UPSC exam relevance and syllabus alignment
- Include key facts, dates, and concepts
- Highlight important points likely to be asked in exams
- Use clear structure with headings and subheadings
- ${userPreferences?.style === 'brief' ? 'Use concise language' : 'Provide detailed coverage'}
- ${userPreferences?.highlightPreviousYear ? 'Mark topics frequently asked in previous years with [★]' : ''}
- Mark syllabus-aligned content with [SYLLABUS: Topic Name]
- Mark out-of-syllabus but important content with [OUT-OF-SYLLABUS: Reason for importance]
- End with "Key Takeaways" section for quick reference

Format: Well-structured markdown with clear headings and bullet points.`;
        break;

      case 'analysis':
        basePrompt += `Provide a detailed analysis of this UPSC study material${subject ? ` about ${subject}` : ''}:

Content: ${content}

Analysis Requirements:
- **Syllabus Validation**: Check alignment with official UPSC syllabus topics
- Subject-wise breakdown and importance
- Connection to other UPSC topics
- Exam strategy and approach
- Key points for mains vs prelims
- Memory techniques and mnemonics
- Previous year question patterns
- Current affairs connections
- Mark syllabus-aligned points with [SYLLABUS: Topic]
- Mark out-of-syllabus content with [OUT-OF-SYLLABUS: Important for current affairs/advanced understanding]

Format: Structured analysis with clear sections including syllabus alignment assessment.`;
        break;

      case 'chart':
        basePrompt += `Create a visual chart/diagram in Mermaid syntax for this UPSC content${subject ? ` about ${subject}` : ''}:

Content: ${content}

Requirements:
- Use appropriate Mermaid chart type (flowchart, mindmap, timeline, etc.)
- Include hierarchical structure showing syllabus alignment
- Show relationships between concepts
- Keep it exam-focused and clear
- Maximum 4 levels deep for readability
- Prioritize syllabus-aligned content in the chart

Return only the Mermaid syntax.`;
        break;

      case 'notes':
        basePrompt += `Generate comprehensive study notes from this UPSC material${subject ? ` about ${subject}` : ''}:

Content: ${content}

Notes Requirements:
- Clear headings and subheadings
- Bullet points and numbered lists
- Key terms and definitions
- Important dates and facts
- Exam tips and strategies
- Quick revision points
- ${userPreferences?.style === 'detailed' ? 'Include detailed explanations' : 'Focus on key points'}

Format: Well-structured markdown notes.`;
        break;

      case 'mindmap':
        basePrompt += `Create a mindmap in Mermaid syntax for this UPSC content${subject ? ` about ${subject}` : ''}:

Content: ${content}

Requirements:
- Start with "mindmap" syntax
- Central topic as root
- Maximum 4 levels deep
- Include all important subtopics
- Focus on exam-relevant connections
- Use clear, concise labels

Return only the Mermaid mindmap syntax.`;
        break;

      default:
        basePrompt += `Process this UPSC study material${subject ? ` about ${subject}` : ''}:\n\n${content}`;
    }

    return basePrompt;
  }

  private buildSimplePrompt(request: GenerationRequest): string {
    return `Summarize this UPSC study content in simple terms: ${request.content?.substring(0, 500) || ''}`;
  }

  private generateBasicSummary(content: string): string {
    // Simple text processing fallback
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const keyWords = ['important', 'key', 'main', 'significant', 'critical'];
    
    const importantSentences = sentences.filter(sentence => 
      keyWords.some(word => sentence.toLowerCase().includes(word))
    ).slice(0, 3);

    if (importantSentences.length > 0) {
      return `**Key Points:**\n\n${importantSentences.map(s => `• ${s.trim()}`).join('\n')}`;
    }

    return `**Summary:**\n\n${sentences.slice(0, 3).map(s => `• ${s.trim()}`).join('\n')}`;
  }

  private calculateOpenAICost(tokens: number, model: string): number {
    const rates = {
      'gpt-4': { input: 0.03, output: 0.06 }, // per 1K tokens
      'gpt-3.5-turbo': { input: 0.0015, output: 0.002 }
    };
    
    const rate = rates[model as keyof typeof rates] || rates['gpt-3.5-turbo'];
    return (tokens / 1000) * (rate.input + rate.output) / 2; // Average estimate
  }

  // Parallel generation with multiple providers for comparison
  async generateWithMultipleProviders(request: GenerationRequest, providers: string[]): Promise<LLMResponse[]> {
    const promises = providers.map(async (provider) => {
      try {
        return await this.generateContent(request, provider);
      } catch (error) {
        logger.error(`Provider ${provider} failed:`, error);
        return null;
      }
    });

    const results = await Promise.allSettled(promises);
    return results
      .filter((result): result is PromiseFulfilledResult<LLMResponse> => 
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value);
  }

  // Get available providers
  getAvailableProviders(): LLMProvider[] {
    return Array.from(this.providers.values()).filter(p => p.isActive);
  }

  // Get free providers
  getFreeProviders(): LLMProvider[] {
    return Array.from(this.providers.values()).filter(p => p.isActive && p.isFree);
  }

  // Update provider configuration
  updateProviderConfig(providerId: string, config: Record<string, any>): void {
    const provider = this.providers.get(providerId);
    if (provider) {
      provider.config = { ...provider.config, ...config };
    }
  }

  // Check provider health
  async checkProviderHealth(providerId: string): Promise<boolean> {
    try {
      const testRequest: GenerationRequest = {
        prompt: 'Test',
        type: 'summary',
        content: 'This is a test content for health check.',
        userPreferences: { style: 'brief', includeCharts: false, highlightPreviousYear: false }
      };
      
      await this.generateContent(testRequest, providerId);
      return true;
    } catch (error) {
      logger.error(`Provider ${providerId} health check failed:`, error);
      return false;
    }
  }

  /**
   * Enhanced content generation with automatic syllabus validation
   */
  async generateSyllabusValidatedContent(
    request: GenerationRequest,
    preferredProvider?: string
  ): Promise<LLMResponse & { syllabusValidation?: any }> {
    try {
      // Generate content first
      const response = await this.generateContent(request, preferredProvider);
      
      // If subject is provided, validate against syllabus
      if (request.subject) {
        const validation = await this.syllabusValidator.validateContentAgainstSyllabus(
          response.text,
          request.subject,
          'Prelims' // Default to Prelims, can be made configurable
        );
        
        return {
          ...response,
          syllabusValidation: validation
        };
      }
      
      return response;
    } catch (error) {
      logger.error('Error in syllabus-validated content generation:', error);
      throw error;
    }
  }
} 
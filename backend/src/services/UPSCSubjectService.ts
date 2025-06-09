import { supabase } from '../lib/supabase';
import { UPSCSubject, UPSCChapter, UPSCSummary, UPSCSubjectWithDetails } from '../schemas/upscSchema';
import { MultiLLMService, GenerationRequest } from './MultiLLMService';
import { logger } from '../utils/logger';

export class UPSCSubjectService {
  private static instance: UPSCSubjectService;
  private llmService: MultiLLMService;

  private constructor() {
    this.llmService = MultiLLMService.getInstance();
  }

  public static getInstance(): UPSCSubjectService {
    if (!UPSCSubjectService.instance) {
      UPSCSubjectService.instance = new UPSCSubjectService();
    }
    return UPSCSubjectService.instance;
  }

  public async getSubjects(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('upsc_subjects')
        .select('*')
        .order('name');

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error fetching UPSC subjects:', error);
      throw error;
    }
  }

  public async getSubjectWithDetails(subjectId: string): Promise<any> {
    try {
      const { data: subject, error: subjectError } = await supabase
        .from('upsc_subjects')
        .select('*')
        .eq('id', subjectId)
        .single();

      if (subjectError) throw subjectError;

      const { data: chapters, error: chaptersError } = await supabase
        .from('upsc_chapters')
        .select('*')
        .eq('subjectId', subjectId)
        .order('name');

      if (chaptersError) throw chaptersError;

      const { data: summaries, error: summariesError } = await supabase
        .from('upsc_summaries')
        .select('*')
        .eq('subjectId', subjectId)
        .order('createdAt', { ascending: false });

      if (summariesError) throw summariesError;

      return {
        ...subject,
        chapters,
        summaries
      };
    } catch (error) {
      logger.error('Error fetching subject details:', error);
      throw error;
    }
  }

  public async generateSummary(
    subjectId: string,
    chapterId: string,
    type: string,
    content: string
  ): Promise<any> {
    try {
      const prompt = this.getPromptForSummaryType(type, content);
      const request: GenerationRequest = {
        prompt,
        type: type as any,
        content,
        userPreferences: {
          style: 'comprehensive',
          includeCharts: type === 'CHARTS',
          highlightPreviousYear: type === 'PREVIOUS_YEAR_ANALYSIS',
          summaryLength: this.getSummaryLength(type)
        }
      };

      const response = await this.llmService.generateContent(request);

      const { data, error } = await supabase
        .from('upsc_summaries')
        .insert({
          subjectId,
          chapterId,
          type,
          content: response.text,
          metadata: {
            wordCount: response.text.split(' ').length,
            keyPoints: this.extractKeyPoints(response.text),
            references: this.extractReferences(response.text),
            lastEditedBy: 'system',
            llmModel: response.model,
            confidence: 0.8
          }
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error generating summary:', error);
      throw error;
    }
  }

  private getPromptForSummaryType(type: string, content: string): string {
    const prompts = {
      FULL_SUMMARY: `Create a comprehensive summary of the following UPSC Mains content. Include all key concepts, examples, and relevant data points:\n\n${content}`,
      THOUSAND_LINES: `Create a detailed 1000-line summary of the following UPSC Mains content. Focus on important concepts and their interconnections:\n\n${content}`,
      FIVE_HUNDRED_LINES: `Create a concise 500-line summary of the following UPSC Mains content. Highlight key points and their significance:\n\n${content}`,
      HUNDRED_LINES: `Create a brief 100-line summary of the following UPSC Mains content. Focus on the most critical points:\n\n${content}`,
      ANALYSIS: `Analyze the following UPSC Mains content. Include historical context, current relevance, and future implications:\n\n${content}`,
      CHARTS: `Create a structured analysis of the following UPSC Mains content, suitable for visual representation in charts and diagrams:\n\n${content}`,
      PREVIOUS_YEAR_ANALYSIS: `Analyze the following UPSC Mains content in the context of previous year questions. Identify patterns and trends:\n\n${content}`,
      EXPECTED_QUESTIONS: `Based on the following UPSC Mains content, generate potential questions that might appear in the examination:\n\n${content}`,
      OUT_OF_SYLLABUS: `Analyze the following UPSC Mains content for topics that might be outside the syllabus but relevant for comprehensive understanding:\n\n${content}`
    };

    return prompts[type as keyof typeof prompts] || prompts.FULL_SUMMARY;
  }

  private getSummaryLength(type: string): '100' | '500' | '1000' | 'full' {
    switch (type) {
      case 'HUNDRED_LINES':
        return '100';
      case 'FIVE_HUNDRED_LINES':
        return '500';
      case 'THOUSAND_LINES':
        return '1000';
      default:
        return 'full';
    }
  }

  private extractKeyPoints(content: string): string[] {
    return content.split('\n').filter(line => line.trim().startsWith('-'));
  }

  private extractReferences(content: string): string[] {
    const referenceRegex = /\[(.*?)\]/g;
    const matches = content.match(referenceRegex) || [];
    return matches.map(ref => ref.slice(1, -1));
  }

  public async updateSummary(
    summaryId: string,
    updates: Partial<any>
  ): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('upsc_summaries')
        .update(updates)
        .eq('id', summaryId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error updating summary:', error);
      throw error;
    }
  }

  public async deleteSummary(summaryId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('upsc_summaries')
        .delete()
        .eq('id', summaryId);

      if (error) throw error;
    } catch (error) {
      logger.error('Error deleting summary:', error);
      throw error;
    }
  }
} 
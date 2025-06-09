import { logger } from '../utils/logger';
import { MultiLLMService, GenerationRequest } from './MultiLLMService';

interface SyllabusValidationResult {
  isWithinSyllabus: boolean;
  syllabusAlignment: number; // 0-1 score
  relevantTopics: string[];
  outOfSyllabusContent: OutOfSyllabusContent[];
  recommendations: string[];
  confidence: number;
}

interface OutOfSyllabusContent {
  content: string;
  reason: string;
  importance: 'high' | 'medium' | 'low';
  category: 'current_affairs' | 'advanced_topic' | 'different_exam' | 'supplementary';
  suggestion: string;
}

interface UPSCSyllabusMap {
  [subject: string]: {
    [paper: string]: string[];
  };
}

export class UPSCSyllabusValidationService {
  private multiLLMService: MultiLLMService;
  
  // Comprehensive UPSC Syllabus Map - our lighthouse
  private readonly upscSyllabus: UPSCSyllabusMap = {
    'History': {
      'Prelims': [
        'Ancient India - Indus Valley Civilization',
        'Ancient India - Vedic Period, Buddhism, Jainism',
        'Ancient India - Mauryan Empire, Gupta Period',
        'Medieval India - Delhi Sultanate',
        'Medieval India - Mughal Empire, Regional Kingdoms',
        'Modern India - British East India Company',
        'Modern India - Freedom Struggle, Nationalist Movement',
        'Modern India - Constitutional Development'
      ],
      'Mains': [
        'Indian culture - Salient features of Art Forms, Literature and Architecture',
        'Modern Indian history - Freedom struggle, Social and religious reform movements',
        'Post-independence consolidation and reorganization'
      ]
    },
    'Geography': {
      'Prelims': [
        'Physical Geography - Geomorphology, Climatology, Oceanography',
        'Indian Geography - Physical features, Climate, Natural vegetation',
        'Economic Geography - Transport, Trade, Agriculture',
        'World Geography - Important geographical phenomena'
      ],
      'Mains': [
        'Salient features of world\'s physical geography',
        'Distribution of key natural resources',
        'Location of primary, secondary, and tertiary sector industries',
        'Important Geophysical phenomena, Natural hazards and disasters'
      ]
    },
    'Polity': {
      'Prelims': [
        'Indian Constitution - Historical background, Making of Constitution',
        'Salient features of Indian Constitution',
        'Fundamental Rights and Duties, Directive Principles',
        'Constitutional Bodies - Election Commission, CAG, UPSC, etc.',
        'Parliament and State Legislatures',
        'Executive and Judiciary',
        'Federalism, Centre-State relations',
        'Amendment of Constitution',
        'Significant provisions of important Acts'
      ],
      'Mains': [
        'Indian Constitution - Salient features, Amendments, Acts and Bills',
        'Functions and responsibilities of Union and States',
        'Issues and challenges pertaining to federal structure',
        'Powers, functions of Constitutional Bodies',
        'Government policies and interventions',
        'Development processes and development industry',
        'Role of civil services in democracy'
      ]
    },
    'Economics': {
      'Prelims': [
        'Economic Growth and Development',
        'National Income and related aggregates',
        'Budgeting and Public Finance',
        'Money and Banking',
        'Inflation and related concepts',
        'Economic Reforms since 1991',
        'International Trade and Balance of Payments',
        'Economic Survey and Union Budget'
      ],
      'Mains': [
        'Indian Economy and planning, Mobilization of resources',
        'Major crops cropping patterns, Public Distribution System',
        'Issues related to direct and indirect farm subsidies',
        'Food processing and related industries',
        'Land reforms in India',
        'Effects of liberalization on economy',
        'Industrial policy and growth',
        'Infrastructure: Energy, Ports, Roads, Airports, Railways'
      ]
    },
    'Science & Technology': {
      'Prelims': [
        'Science and Technology developments and applications',
        'General Science covering Physics, Chemistry, Biology',
        'Space Technology, Computers, Robotics, Nano-technology',
        'Biotechnology, Intellectual Property Rights',
        'Environmental Science and Climate Change'
      ],
      'Mains': [
        'Science and Technology - developments and applications to everyday life',
        'Achievements of Indians in science & technology',
        'Indigenization of technology and developing new technology',
        'Awareness in fields of IT, Space, Computers, robotics, nano-technology, bio-technology'
      ]
    },
    'Environment': {
      'Prelims': [
        'Environmental Ecology, Bio-diversity and Climate Change',
        'Conservation of Environment',
        'Environmental pollution and degradation',
        'Environmental impact assessment'
      ],
      'Mains': [
        'Conservation, environmental pollution and degradation',
        'Environmental impact assessment',
        'Climate change and its implications',
        'Disaster and disaster management'
      ]
    },
    'Current Affairs': {
      'Prelims': [
        'Current events of national and international importance',
        'Sports, Awards, Personalities',
        'Books and Authors',
        'Important days and events'
      ],
      'Mains': [
        'Important aspects of governance, transparency and accountability',
        'Important International institutions, agencies and fora',
        'Bilateral, regional and global groupings and agreements',
        'Effect of policies and politics of developed and developing countries'
      ]
    }
  };

  constructor() {
    this.multiLLMService = new MultiLLMService();
  }

  /**
   * Main validation method - our lighthouse function
   */
  async validateContentAgainstSyllabus(
    content: string, 
    subject: string,
    paperType: 'Prelims' | 'Mains' = 'Prelims'
  ): Promise<SyllabusValidationResult> {
    try {
      logger.info(`Validating content against UPSC ${paperType} syllabus for ${subject}`);

      // Get syllabus topics for the subject and paper
      const syllabusTopics = this.upscSyllabus[subject]?.[paperType] || [];
      
      if (syllabusTopics.length === 0) {
        logger.warn(`No syllabus topics found for ${subject} - ${paperType}`);
        return this.createGenericValidationResult(content);
      }

      // Use LLM to analyze content against syllabus
      const validationPrompt = this.buildSyllabusValidationPrompt(content, subject, paperType, syllabusTopics);
      
      const request: GenerationRequest = {
        prompt: validationPrompt,
        type: 'analysis',
        content: content,
        subject: subject,
        context: {
          syllabus_topics: syllabusTopics,
          paper_type: paperType,
          validation_mode: true
        }
      };

      // Use Claude for detailed analysis (best for reasoning)
      const response = await this.multiLLMService.generateContent(request, 'anthropic');
      
      // Parse the structured response
      const validationResult = this.parseValidationResponse(response.content, syllabusTopics);
      
      logger.info(`Syllabus validation completed. Alignment: ${validationResult.syllabusAlignment}`);
      return validationResult;

    } catch (error) {
      logger.error('Error in syllabus validation:', error);
      return this.createErrorValidationResult(content);
    }
  }

  private buildSyllabusValidationPrompt(
    content: string, 
    subject: string, 
    paperType: string, 
    syllabusTopics: string[]
  ): string {
    return `You are a UPSC expert examining content for syllabus alignment. The UPSC syllabus is our LIGHTHOUSE - any deviation must be carefully analyzed.

SUBJECT: ${subject}
PAPER TYPE: ${paperType}
OFFICIAL SYLLABUS TOPICS:
${syllabusTopics.map((topic, index) => `${index + 1}. ${topic}`).join('\n')}

CONTENT TO VALIDATE:
${content.substring(0, 2000)}

ANALYZE THE CONTENT AND PROVIDE A STRUCTURED RESPONSE:

1. SYLLABUS ALIGNMENT SCORE (0-100):
[Provide a score where 100 = perfectly aligned, 0 = completely off-syllabus]

2. WITHIN SYLLABUS CONTENT:
[List all parts that align with official syllabus topics]

3. OUT-OF-SYLLABUS CONTENT (Critical Analysis):
[For each out-of-syllabus item, provide:]
- Content: [specific text/concept]
- Reason: [why it's out of syllabus]
- Importance: HIGH/MEDIUM/LOW
- Category: CURRENT_AFFAIRS/ADVANCED_TOPIC/DIFFERENT_EXAM/SUPPLEMENTARY
- Suggestion: [how to handle this content]

4. RELEVANT SYLLABUS TOPICS:
[List which official topics this content relates to]

5. RECOMMENDATIONS:
[Actionable advice for UPSC aspirants]

6. CONFIDENCE LEVEL (0-100):
[Your confidence in this analysis]

Remember: 
- UPSC syllabus is comprehensive but finite
- Current affairs that relate to syllabus topics are IMPORTANT
- Advanced topics beyond syllabus may still be valuable for understanding
- Mark high-importance out-of-syllabus content that could appear in exam trends
- Consider previous year question patterns`;
  }

  private parseValidationResponse(response: string, syllabusTopics: string[]): SyllabusValidationResult {
    try {
      // Extract structured information from LLM response
      const alignmentMatch = response.match(/ALIGNMENT SCORE.*?(\d+)/i);
      const syllabusAlignment = alignmentMatch && alignmentMatch[1] ? parseInt(alignmentMatch[1]) / 100 : 0.5;

      const confidenceMatch = response.match(/CONFIDENCE.*?(\d+)/i);
      const confidence = confidenceMatch && confidenceMatch[1] ? parseInt(confidenceMatch[1]) / 100 : 0.7;

      // Extract out-of-syllabus content
      const outOfSyllabusContent = this.extractOutOfSyllabusContent(response);

      // Extract recommendations
      const recommendationsMatch = response.match(/RECOMMENDATIONS:(.*?)(?=\d+\.|$)/is);
      const recommendations = recommendationsMatch && recommendationsMatch[1]
        ? recommendationsMatch[1].split('\n').filter(r => r.trim().length > 0).map(r => r.trim())
        : [];

      // Extract relevant topics
      const relevantTopicsMatch = response.match(/RELEVANT SYLLABUS TOPICS:(.*?)(?=\d+\.|$)/is);
      const relevantTopics = relevantTopicsMatch && relevantTopicsMatch[1]
        ? relevantTopicsMatch[1].split('\n').filter(t => t.trim().length > 0).map(t => t.trim().replace(/^-\s*/, ''))
        : [];

      return {
        isWithinSyllabus: syllabusAlignment >= 0.7,
        syllabusAlignment,
        relevantTopics,
        outOfSyllabusContent,
        recommendations,
        confidence
      };

    } catch (error) {
      logger.error('Error parsing validation response:', error);
      return this.createErrorValidationResult('');
    }
  }

  private extractOutOfSyllabusContent(response: string): OutOfSyllabusContent[] {
    const outOfSyllabusItems: OutOfSyllabusContent[] = [];
    
    // Look for out-of-syllabus section
    const sectionMatch = response.match(/OUT-OF-SYLLABUS CONTENT.*?:(.*?)(?=\d+\.|$)/is);
    if (!sectionMatch || !sectionMatch[1]) return outOfSyllabusItems;

    const section = sectionMatch[1];
    const items = section.split(/[-•]\s*Content:/);

    for (const item of items) {
      if (item.trim().length === 0) continue;

      const contentMatch = item.match(/^(.*?)(?=Reason:|$)/s);
      const reasonMatch = item.match(/Reason:\s*(.*?)(?=Importance:|$)/s);
      const importanceMatch = item.match(/Importance:\s*(HIGH|MEDIUM|LOW)/i);
      const categoryMatch = item.match(/Category:\s*(CURRENT_AFFAIRS|ADVANCED_TOPIC|DIFFERENT_EXAM|SUPPLEMENTARY)/i);
      const suggestionMatch = item.match(/Suggestion:\s*(.*?)(?=[-•]|$)/s);

      if (contentMatch && contentMatch[1] && reasonMatch && reasonMatch[1]) {
        outOfSyllabusItems.push({
          content: contentMatch[1].trim(),
          reason: reasonMatch[1].trim(),
          importance: (importanceMatch?.[1]?.toLowerCase() as 'high' | 'medium' | 'low') || 'medium',
          category: (categoryMatch?.[1]?.toLowerCase() as any) || 'supplementary',
          suggestion: suggestionMatch?.[1]?.trim() || 'Consider for additional knowledge'
        });
      }
    }

    return outOfSyllabusItems;
  }

  private createGenericValidationResult(content: string): SyllabusValidationResult {
    return {
      isWithinSyllabus: true,
      syllabusAlignment: 0.5,
      relevantTopics: ['General Topic'],
      outOfSyllabusContent: [],
      recommendations: ['Review content against specific syllabus topics'],
      confidence: 0.3
    };
  }

  private createErrorValidationResult(content: string): SyllabusValidationResult {
    return {
      isWithinSyllabus: true,
      syllabusAlignment: 0.5,
      relevantTopics: [],
      outOfSyllabusContent: [],
      recommendations: ['Manual review recommended due to validation error'],
      confidence: 0.1
    };
  }

  /**
   * Get all syllabus topics for a subject
   */
  getSyllabusTopics(subject: string, paperType?: 'Prelims' | 'Mains'): string[] {
    if (paperType) {
      return this.upscSyllabus[subject]?.[paperType] || [];
    }
    
    // Return both Prelims and Mains topics
    const prelims = this.upscSyllabus[subject]?.['Prelims'] || [];
    const mains = this.upscSyllabus[subject]?.['Mains'] || [];
    return [...prelims, ...mains];
  }

  /**
   * Check if a topic exists in UPSC syllabus
   */
  isTopicInSyllabus(topic: string, subject?: string): boolean {
    if (subject) {
      const topics = this.getSyllabusTopics(subject);
      return topics.some(syllabusItem => 
        syllabusItem.toLowerCase().includes(topic.toLowerCase()) ||
        topic.toLowerCase().includes(syllabusItem.toLowerCase())
      );
    }

    // Search across all subjects
    for (const subjectKey of Object.keys(this.upscSyllabus)) {
      if (this.isTopicInSyllabus(topic, subjectKey)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get subjects available in syllabus
   */
  getAvailableSubjects(): string[] {
    return Object.keys(this.upscSyllabus);
  }

  /**
   * Enhanced content generation with syllabus validation
   */
  async generateSyllabusAlignedContent(
    originalContent: string,
    subject: string,
    contentType: 'summary' | 'analysis' | 'notes',
    paperType: 'Prelims' | 'Mains' = 'Prelims'
  ): Promise<{
    content: string;
    validation: SyllabusValidationResult;
    syllabusHighlights: string[];
  }> {
    // First validate the content
    const validation = await this.validateContentAgainstSyllabus(originalContent, subject, paperType);
    
    // Get syllabus topics for highlighting
    const syllabusTopics = this.getSyllabusTopics(subject, paperType);
    
    // Generate enhanced content with syllabus awareness
    const enhancedPrompt = `Create a ${contentType} for UPSC ${paperType} preparation with strict syllabus alignment.

OFFICIAL SYLLABUS TOPICS for ${subject}:
${syllabusTopics.map((topic, i) => `${i + 1}. ${topic}`).join('\n')}

ORIGINAL CONTENT:
${originalContent}

REQUIREMENTS:
1. Focus primarily on syllabus-aligned content
2. Clearly mark out-of-syllabus content as [OUT-OF-SYLLABUS: Important for current affairs/advanced understanding]
3. Highlight syllabus connections with [SYLLABUS: Topic Name]
4. Prioritize high-yield topics for UPSC
5. Include exam-relevant examples and case studies

VALIDATION INSIGHTS:
- Syllabus Alignment: ${(validation.syllabusAlignment * 100).toFixed(0)}%
- Out-of-syllabus items: ${validation.outOfSyllabusContent.length}
- Key recommendations: ${validation.recommendations.join(', ')}

Generate the ${contentType} with clear syllabus mapping.`;

    const request: GenerationRequest = {
      prompt: enhancedPrompt,
      type: contentType === 'summary' ? 'summary' : 'analysis',
      content: originalContent,
      subject: subject,
      context: {
        syllabus_validation: validation,
        paper_type: paperType
      }
    };

    const response = await this.multiLLMService.generateContent(request, 'openai');
    
    // Extract syllabus highlights
    const syllabusHighlights = this.extractSyllabusHighlights(response.content);
    
    return {
      content: response.content,
      validation,
      syllabusHighlights
    };
  }

  private extractSyllabusHighlights(content: string): string[] {
    const highlights: string[] = [];
    const matches = content.match(/\[SYLLABUS:\s*([^\]]+)\]/g);
    
    if (matches) {
      for (const match of matches) {
        const topic = match.replace(/\[SYLLABUS:\s*([^\]]+)\]/, '$1').trim();
        if (!highlights.includes(topic)) {
          highlights.push(topic);
        }
      }
    }
    
    return highlights;
  }
}

export default UPSCSyllabusValidationService; 
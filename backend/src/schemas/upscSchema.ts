import { z } from 'zod';

export const UPSCSubject = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  syllabus: z.string(),
  weightage: z.number(),
  lastUpdated: z.date(),
  chapters: z.array(z.string()),
  isActive: z.boolean().default(true)
});

export const UPSCChapter = z.object({
  id: z.string(),
  subjectId: z.string(),
  name: z.string(),
  description: z.string(),
  topics: z.array(z.string()),
  previousYearQuestions: z.array(z.object({
    year: z.number(),
    question: z.string(),
    marks: z.number(),
    analysis: z.string()
  })),
  expectedQuestions: z.array(z.object({
    question: z.string(),
    probability: z.number(),
    reasoning: z.string()
  })),
  outOfSyllabusTopics: z.array(z.object({
    topic: z.string(),
    relevance: z.string(),
    potentialQuestions: z.array(z.string())
  }))
});

export const SummaryType = z.enum([
  'FULL_SUMMARY',
  'THOUSAND_LINES',
  'FIVE_HUNDRED_LINES',
  'HUNDRED_LINES',
  'ANALYSIS',
  'CHARTS',
  'PREVIOUS_YEAR_ANALYSIS',
  'EXPECTED_QUESTIONS',
  'OUT_OF_SYLLABUS'
]);

export const UPSCSummary = z.object({
  id: z.string(),
  subjectId: z.string(),
  chapterId: z.string(),
  type: SummaryType,
  content: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  version: z.number(),
  metadata: z.object({
    wordCount: z.number(),
    keyPoints: z.array(z.string()),
    references: z.array(z.string()),
    lastEditedBy: z.string(),
    llmModel: z.string(),
    confidence: z.number()
  })
});

export const UPSCSubjectWithDetails = UPSCSubject.extend({
  chapters: z.array(UPSCChapter),
  summaries: z.array(UPSCSummary)
});

export type UPSCSubjectType = z.infer<typeof UPSCSubject>;
export type UPSCChapterType = z.infer<typeof UPSCChapter>;
export type UPSCSummaryType = z.infer<typeof UPSCSummary>;
export type SummaryTypeType = z.infer<typeof SummaryType>;
export type UPSCSubjectWithDetailsType = z.infer<typeof UPSCSubjectWithDetails>; 
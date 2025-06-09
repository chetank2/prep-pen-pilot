import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Grid, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { supabase } from '../lib/supabase';

interface UPSCSubject {
  id: string;
  name: string;
  description: string;
  syllabus: string;
  weightage: number;
  lastUpdated: string;
  chapters: string[];
  isActive: boolean;
}

interface UPSCChapter {
  id: string;
  subjectId: string;
  name: string;
  description: string;
  topics: string[];
  previousYearQuestions: Array<{
    year: number;
    question: string;
    marks: number;
    analysis: string;
  }>;
  expectedQuestions: Array<{
    question: string;
    probability: number;
    reasoning: string;
  }>;
  outOfSyllabusTopics: Array<{
    topic: string;
    relevance: string;
    potentialQuestions: string[];
  }>;
}

interface UPSCSummary {
  id: string;
  subjectId: string;
  chapterId: string;
  type: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  metadata: {
    wordCount: number;
    keyPoints: string[];
    references: string[];
    lastEditedBy: string;
    llmModel: string;
    confidence: number;
  };
}

const summaryTypes = [
  'FULL_SUMMARY',
  'THOUSAND_LINES',
  'FIVE_HUNDRED_LINES',
  'HUNDRED_LINES',
  'ANALYSIS',
  'CHARTS',
  'PREVIOUS_YEAR_ANALYSIS',
  'EXPECTED_QUESTIONS',
  'OUT_OF_SYLLABUS'
];

export const UPSCSubjects: React.FC = () => {
  const [subjects, setSubjects] = useState<UPSCSubject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<UPSCSubject | null>(null);
  const [chapters, setChapters] = useState<UPSCChapter[]>([]);
  const [summaries, setSummaries] = useState<UPSCSummary[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState<UPSCChapter | null>(null);
  const [summaryType, setSummaryType] = useState('');
  const [summaryContent, setSummaryContent] = useState('');

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from('upsc_subjects')
        .select('*')
        .order('name');

      if (error) throw error;
      setSubjects(data);
    } catch (error) {
      console.error('Error loading subjects:', error);
    }
  };

  const handleSubjectClick = async (subject: UPSCSubject) => {
    setSelectedSubject(subject);
    try {
      const { data: chaptersData, error: chaptersError } = await supabase
        .from('upsc_chapters')
        .select('*')
        .eq('subjectId', subject.id)
        .order('name');

      if (chaptersError) throw chaptersError;
      setChapters(chaptersData);

      const { data: summariesData, error: summariesError } = await supabase
        .from('upsc_summaries')
        .select('*')
        .eq('subjectId', subject.id)
        .order('createdAt', { ascending: false });

      if (summariesError) throw summariesError;
      setSummaries(summariesData);
    } catch (error) {
      console.error('Error loading subject details:', error);
    }
  };

  const handleGenerateSummary = async () => {
    if (!selectedSubject || !selectedChapter || !summaryType || !summaryContent) return;

    try {
      const { data, error } = await supabase
        .from('upsc_summaries')
        .insert({
          subjectId: selectedSubject.id,
          chapterId: selectedChapter.id,
          type: summaryType,
          content: summaryContent,
          metadata: {
            wordCount: summaryContent.split(' ').length,
            keyPoints: [],
            references: [],
            lastEditedBy: 'user',
            llmModel: 'manual',
            confidence: 1
          }
        })
        .select()
        .single();

      if (error) throw error;

      setSummaries([...summaries, data]);
      setOpenDialog(false);
      setSummaryContent('');
      setSummaryType('');
    } catch (error) {
      console.error('Error generating summary:', error);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <Typography variant="h4" gutterBottom>
        UPSC Mains Subjects
      </Typography>

      <Grid container spacing={3}>
        {subjects.map((subject) => (
          <Grid item xs={12} sm={6} md={4} key={subject.id}>
            <Card
              onClick={() => handleSubjectClick(subject)}
              style={{ cursor: 'pointer' }}
            >
              <CardContent>
                <Typography variant="h6">{subject.name}</Typography>
                <Typography color="textSecondary">{subject.description}</Typography>
                <Typography variant="body2">
                  Weightage: {subject.weightage}%
                </Typography>
                <Typography variant="body2">
                  Last Updated: {new Date(subject.lastUpdated).toLocaleDateString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {selectedSubject && (
        <div style={{ marginTop: '20px' }}>
          <Typography variant="h5" gutterBottom>
            {selectedSubject.name} - Chapters
          </Typography>

          <Grid container spacing={3}>
            {chapters.map((chapter) => (
              <Grid item xs={12} sm={6} md={4} key={chapter.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">{chapter.name}</Typography>
                    <Typography color="textSecondary">
                      {chapter.description}
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => {
                        setSelectedChapter(chapter);
                        setOpenDialog(true);
                      }}
                      style={{ marginTop: '10px' }}
                    >
                      Generate Summary
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Typography variant="h5" style={{ marginTop: '20px' }} gutterBottom>
            Summaries
          </Typography>

          <Grid container spacing={3}>
            {summaries.map((summary) => (
              <Grid item xs={12} key={summary.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">
                      {summary.type.replace(/_/g, ' ')}
                    </Typography>
                    <Typography variant="body1">{summary.content}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      Generated by: {summary.metadata.llmModel}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Word Count: {summary.metadata.wordCount}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </div>
      )}

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Generate Summary</DialogTitle>
        <DialogContent>
          <FormControl fullWidth style={{ marginTop: '10px' }}>
            <InputLabel>Summary Type</InputLabel>
            <Select
              value={summaryType}
              onChange={(e) => setSummaryType(e.target.value)}
            >
              {summaryTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type.replace(/_/g, ' ')}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Content"
            value={summaryContent}
            onChange={(e) => setSummaryContent(e.target.value)}
            style={{ marginTop: '10px' }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handleGenerateSummary}
            color="primary"
            variant="contained"
          >
            Generate
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}; 
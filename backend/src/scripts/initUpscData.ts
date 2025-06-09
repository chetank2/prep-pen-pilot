import { supabase } from '../lib/supabase';

const upscSubjects = [
  {
    name: 'General Studies Paper I',
    description: 'Indian Heritage and Culture, History and Geography of the World and Society',
    syllabus: 'Indian culture, Modern Indian history, World history, Indian society, Geography',
    weightage: 250,
    isActive: true,
    chapters: [
      {
        name: 'Indian Heritage and Culture',
        description: 'Art, architecture, literature, and cultural heritage of India',
        topics: [
          'Indian Art Forms',
          'Architecture',
          'Literature',
          'Cultural Heritage',
          'Performing Arts'
        ]
      },
      {
        name: 'Modern Indian History',
        description: 'Significant events, personalities, and issues from the middle of the eighteenth century',
        topics: [
          'Freedom Struggle',
          'Social Reform Movements',
          'Post-independence Consolidation',
          'World Wars and their Impact'
        ]
      },
      {
        name: 'World History',
        description: 'Events from the 18th century to the present',
        topics: [
          'Industrial Revolution',
          'World Wars',
          'Decolonization',
          'Cold War',
          'Globalization'
        ]
      }
    ]
  },
  {
    name: 'General Studies Paper II',
    description: 'Governance, Constitution, Polity, Social Justice and International Relations',
    syllabus: 'Indian Constitution, Governance, Social Justice, International Relations',
    weightage: 250,
    isActive: true,
    chapters: [
      {
        name: 'Indian Constitution',
        description: 'Historical underpinnings, evolution, features, amendments, significant provisions',
        topics: [
          'Constitutional Development',
          'Fundamental Rights',
          'Directive Principles',
          'Parliamentary System',
          'Federal Structure'
        ]
      },
      {
        name: 'Governance',
        description: 'Structure, organization and functioning of the Executive and Judiciary',
        topics: [
          'Executive',
          'Judiciary',
          'Local Government',
          'Pressure Groups',
          'E-Governance'
        ]
      },
      {
        name: 'Social Justice',
        description: 'Welfare schemes, mechanisms, laws, institutions and bodies',
        topics: [
          'Welfare Schemes',
          'Social Security',
          'Health and Education',
          'Poverty and Development',
          'Social Empowerment'
        ]
      }
    ]
  },
  {
    name: 'General Studies Paper III',
    description: 'Technology, Economic Development, Bio-diversity, Environment, Security and Disaster Management',
    syllabus: 'Indian Economy, Science and Technology, Environment, Security',
    weightage: 250,
    isActive: true,
    chapters: [
      {
        name: 'Indian Economy',
        description: 'Economic development, planning, mobilization of resources, growth, development and employment',
        topics: [
          'Economic Planning',
          'Agriculture',
          'Industry',
          'Infrastructure',
          'Financial Markets'
        ]
      },
      {
        name: 'Science and Technology',
        description: 'Developments and their applications and effects in everyday life',
        topics: [
          'IT and Communication',
          'Space Technology',
          'Biotechnology',
          'Nanotechnology',
          'Robotics'
        ]
      },
      {
        name: 'Environment',
        description: 'Conservation, environmental pollution and degradation, environmental impact assessment',
        topics: [
          'Biodiversity',
          'Climate Change',
          'Pollution',
          'Conservation',
          'Environmental Laws'
        ]
      }
    ]
  },
  {
    name: 'General Studies Paper IV',
    description: 'Ethics, Integrity and Aptitude',
    syllabus: 'Ethics, Integrity, Aptitude, Emotional Intelligence',
    weightage: 250,
    isActive: true,
    chapters: [
      {
        name: 'Ethics and Human Interface',
        description: 'Essence, determinants and consequences of Ethics in human actions',
        topics: [
          'Essence of Ethics',
          'Determinants of Ethics',
          'Consequences of Ethics',
          'Human Values',
          'Ethical Dilemmas'
        ]
      },
      {
        name: 'Attitude',
        description: 'Content, structure, function, its influence and relation with thought and behavior',
        topics: [
          'Attitude Formation',
          'Social Influence',
          'Persuasion',
          'Prejudice',
          'Discrimination'
        ]
      },
      {
        name: 'Aptitude and Foundational Values',
        description: 'Civil Service values, integrity, impartiality, non-partisanship, objectivity',
        topics: [
          'Civil Service Values',
          'Integrity',
          'Impartiality',
          'Objectivity',
          'Dedication'
        ]
      }
    ]
  }
];

async function initializeUpscData() {
  try {
    // Insert subjects
    for (const subject of upscSubjects) {
      const { data: subjectData, error: subjectError } = await supabase
        .from('upsc_subjects')
        .insert({
          name: subject.name,
          description: subject.description,
          syllabus: subject.syllabus,
          weightage: subject.weightage,
          isActive: subject.isActive,
          lastUpdated: new Date().toISOString()
        })
        .select()
        .single();

      if (subjectError) throw subjectError;

      // Insert chapters for each subject
      for (const chapter of subject.chapters) {
        const { error: chapterError } = await supabase
          .from('upsc_chapters')
          .insert({
            subjectId: subjectData.id,
            name: chapter.name,
            description: chapter.description,
            topics: chapter.topics,
            previousYearQuestions: [],
            expectedQuestions: [],
            outOfSyllabusTopics: []
          });

        if (chapterError) throw chapterError;
      }
    }

    console.log('UPSC data initialized successfully');
  } catch (error) {
    console.error('Error initializing UPSC data:', error);
  }
}

initializeUpscData(); 
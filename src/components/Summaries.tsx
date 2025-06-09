import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  Calendar,
  Brain,
  BookOpen,
  TrendingUp,
  Clock,
  Star,
  Download,
  Edit,
  RefreshCw,
  ArrowRight,
  ChevronDown,
  Eye,
  Zap
} from 'lucide-react';
import { KnowledgeBaseService } from '../services/knowledgeBaseService';
import { supabase } from '../lib/supabase';

interface Summary {
  id: string;
  title: string;
  content: string;
  summary_type: 'auto' | 'manual' | 'enhanced' | 'internet_updated';
  knowledge_item_id: string;
  upsc_topic?: string;
  generated_by_llm?: string;
  is_user_edited: boolean;
  contains_latest_info: boolean;
  generation_quality_score?: number;
  created_at: string;
  word_count?: number;
  key_points?: string[];
  internet_sources?: any[];
}

interface SummaryLength {
  type: '100' | '500' | '1000' | 'full';
  label: string;
  description: string;
  icon: any;
  estimatedWords: string;
}

const Summaries: React.FC = () => {
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [filteredSummaries, setFilteredSummaries] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedLength, setSelectedLength] = useState<SummaryLength['type']>('full');
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const summaryLengths: SummaryLength[] = [
    {
      type: '100',
      label: '100 Lines',
      description: 'Quick revision - Last week prep',
      icon: Zap,
      estimatedWords: '~150 words'
    },
    {
      type: '500', 
      label: '500 Lines',
      description: 'Medium prep - 1 month before exam',
      icon: TrendingUp,
      estimatedWords: '~750 words'
    },
    {
      type: '1000',
      label: '1000 Lines', 
      description: 'Detailed prep - 2-3 months before',
      icon: BookOpen,
      estimatedWords: '~1500 words'
    },
    {
      type: 'full',
      label: 'Full Summary',
      description: 'Complete understanding - Early prep',
      icon: Brain,
      estimatedWords: 'Complete'
    }
  ];

  const summaryTypes = [
    { value: 'all', label: 'All Summaries' },
    { value: 'auto', label: 'AI Generated' },
    { value: 'enhanced', label: 'Enhanced' },
    { value: 'internet_updated', label: 'Updated' },
    { value: 'manual', label: 'Manual' }
  ];

  useEffect(() => {
    loadSummaries();
  }, []);

  useEffect(() => {
    filterSummaries();
  }, [summaries, searchTerm, selectedType, selectedLength]);

  const loadSummaries = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('upsc_generated_summaries')
        .select(`
          *,
          knowledge_items (
            title,
            upsc_topic
          )
        `)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      if (data) {
        const formattedSummaries = data.map(summary => ({
          ...summary,
          title: summary.knowledge_items?.title || summary.title,
          upsc_topic: summary.knowledge_items?.upsc_topic || summary.upsc_topic
        }));
        setSummaries(formattedSummaries);
      }
    } catch (error) {
      console.error('Failed to load summaries:', error);
      setError('Failed to load summaries. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const filterSummaries = () => {
    let filtered = summaries;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(summary =>
        summary.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        summary.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        summary.upsc_topic?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(summary => summary.summary_type === selectedType);
    }

    setFilteredSummaries(filtered);
  };

  const truncateContent = (content: string, type: SummaryLength['type']): string => {
    const sentences = content.split('. ');
    
    switch (type) {
      case '100':
        return sentences.slice(0, 5).join('. ') + (sentences.length > 5 ? '...' : '');
      case '500':
        return sentences.slice(0, 15).join('. ') + (sentences.length > 15 ? '...' : '');
      case '1000':
        return sentences.slice(0, 30).join('. ') + (sentences.length > 30 ? '...' : '');
      default:
        return content;
    }
  };

  const getEstimatedReadTime = (wordCount: number = 0): string => {
    const wordsPerMinute = 200;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return `${minutes} min read`;
  };

  const getSummaryIcon = (type: string) => {
    switch (type) {
      case 'auto': return <Brain className="w-4 h-4 text-blue-500" />;
      case 'enhanced': return <Star className="w-4 h-4 text-yellow-500" />;
      case 'internet_updated': return <RefreshCw className="w-4 h-4 text-green-500" />;
      case 'manual': return <Edit className="w-4 h-4 text-purple-500" />;
      default: return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-1/3"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-slate-200 rounded-xl"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-slate-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={loadSummaries}
            className="mt-2 text-sm text-red-600 hover:text-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">UPSC Summaries</h1>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-gray-50"
        >
          <Filter className="w-4 h-4" />
          Filters
          <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="mb-8 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Summary Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full p-2 rounded-md border"
              >
                {summaryTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Summary Length</label>
              <select
                value={selectedLength}
                onChange={(e) => setSelectedLength(e.target.value as SummaryLength['type'])}
                className="w-full p-2 rounded-md border"
              >
                {summaryLengths.map(length => (
                  <option key={length.type} value={length.type}>
                    {length.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search summaries by title, content, or UPSC topic..."
          className="w-full pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Summary Length Options */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {summaryLengths.map(length => (
          <button
            key={length.type}
            onClick={() => setSelectedLength(length.type)}
            className={`p-4 rounded-xl border transition-all ${
              selectedLength === length.type
                ? 'border-blue-500 bg-blue-50'
                : 'hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <length.icon className="w-5 h-5 text-blue-500" />
              <h3 className="font-medium">{length.label}</h3>
            </div>
            <p className="text-sm text-gray-600">{length.description}</p>
            <p className="text-xs text-gray-500 mt-2">{length.estimatedWords}</p>
          </button>
        ))}
      </div>

      {/* Summaries List */}
      <div className="space-y-6">
        {filteredSummaries.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No summaries found</p>
          </div>
        ) : (
          filteredSummaries.map(summary => (
            <div
              key={summary.id}
              className="p-6 rounded-xl border hover:border-gray-300 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold mb-2">{summary.title}</h2>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      {getSummaryIcon(summary.summary_type)}
                      {summary.summary_type.charAt(0).toUpperCase() + summary.summary_type.slice(1)}
                    </span>
                    {summary.upsc_topic && (
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        {summary.upsc_topic}
                      </span>
                    )}
                    {summary.word_count && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {getEstimatedReadTime(summary.word_count)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-gray-100 rounded-lg">
                    <Download className="w-5 h-5 text-gray-500" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg">
                    <Edit className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="prose max-w-none mb-4">
                {truncateContent(summary.content, selectedLength)}
              </div>

              {summary.key_points && summary.key_points.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-2">Key Points:</h3>
                  <ul className="list-disc list-inside text-sm text-gray-600">
                    {summary.key_points.map((point, index) => (
                      <li key={index}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(summary.created_at).toLocaleDateString()}
                  </span>
                  {summary.contains_latest_info && (
                    <span className="flex items-center gap-1 text-green-600">
                      <RefreshCw className="w-4 h-4" />
                      Up to date
                    </span>
                  )}
                </div>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
                  Read More
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Summaries; 
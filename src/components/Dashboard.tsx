import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Clock, 
  BookOpen, 
  PenTool, 
  GitBranch, 
  Upload,
  ArrowRight,
  Calendar,
  CheckCircle,
  Database,
  MessageCircle,
  FileText,
  Brain
} from 'lucide-react';
import { KnowledgeBaseService } from '../services/knowledgeBaseService';

interface DashboardProps {
  onModuleChange: (module: string) => void;
}

interface RecentItem {
  id: string;
  type: 'pdf' | 'note' | 'mindmap' | 'knowledge';
  title: string;
  date: string;
  progress?: number;
}

interface Stats {
  topicsCovered: number;
  notesCreated: number;
  hoursStudied: number;
  mindMaps: number;
}

const Dashboard: React.FC<DashboardProps> = ({ onModuleChange }) => {
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [stats, setStats] = useState<Stats>({
    topicsCovered: 0,
    notesCreated: 0,
    hoursStudied: 0,
    mindMaps: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load from Knowledge Base instead of old API endpoints
      const knowledgeItems = await KnowledgeBaseService.getKnowledgeItems();

      // Convert knowledge items to recent items
      const recentKnowledgeItems: RecentItem[] = knowledgeItems.slice(0, 3).map((item) => ({
        id: item.id,
        type: 'knowledge' as const,
        title: item.title,
        date: formatRelativeTime(item.created_at),
        progress: item.processing_status === 'completed' ? 100 : 
                 item.processing_status === 'processing' ? 50 : 0
      }));

      setRecentItems(recentKnowledgeItems);

      // Calculate stats from knowledge base
      const completedItems = knowledgeItems.filter(item => item.processing_status === 'completed');
      const pdfItems = knowledgeItems.filter(item => item.file_type === 'pdf');
      const textItems = knowledgeItems.filter(item => item.file_type === 'text');
      
      setStats({
        topicsCovered: completedItems.length * 8, // Estimate topics per item
        notesCreated: textItems.length,
        hoursStudied: Math.floor(knowledgeItems.length * 1.5), // Estimate study time
        mindMaps: Math.floor(completedItems.length * 0.3) // Estimate mind maps potential
      });

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      // Set default stats if loading fails
      setStats({
        topicsCovered: 0,
        notesCreated: 0,
        hoursStudied: 0,
        mindMaps: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  };

  const quickStats = [
    { label: 'Topics Covered', value: stats.topicsCovered.toString(), icon: CheckCircle, color: 'text-green-500' },
    { label: 'Notes Created', value: stats.notesCreated.toString(), icon: PenTool, color: 'text-blue-500' },
    { label: 'Hours Studied', value: stats.hoursStudied.toString(), icon: Clock, color: 'text-purple-500' },
    { label: 'Mind Maps', value: stats.mindMaps.toString(), icon: GitBranch, color: 'text-orange-500' },
  ];

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-slate-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-slate-200 rounded-2xl"></div>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-slate-200 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome back, Aspirant!</h1>
        <p className="text-slate-600">Continue your UPSC preparation journey</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <button
          onClick={() => onModuleChange('pdf-reader')}
          className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200 group text-left"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Upload className="w-6 h-6 text-blue-600" />
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
          </div>
          <h3 className="font-semibold text-slate-900 mb-1">Import PDF</h3>
          <p className="text-sm text-slate-600">Upload and read new study material</p>
        </button>

        <button
          onClick={() => onModuleChange('canvas')}
          className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200 group text-left"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <PenTool className="w-6 h-6 text-green-600" />
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
          </div>
          <h3 className="font-semibold text-slate-900 mb-1">New Note</h3>
          <p className="text-sm text-slate-600">Create handwritten notes</p>
        </button>

        <button
          onClick={() => onModuleChange('chat')}
          className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200 group text-left"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-purple-600" />
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
          </div>
          <h3 className="font-semibold text-slate-900 mb-1">AI Chat</h3>
          <p className="text-sm text-slate-600">Chat with AI about your studies</p>
        </button>

        <button
          onClick={() => onModuleChange('knowledge-base')}
          className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200 group text-left"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <Database className="w-6 h-6 text-orange-600" />
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
          </div>
          <h3 className="font-semibold text-slate-900 mb-1">Knowledge Base</h3>
          <p className="text-sm text-slate-600">AI-powered content organization</p>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        {quickStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <Icon className={`w-8 h-8 ${stat.color}`} />
              </div>
              <div className="text-2xl font-bold text-slate-900 mb-1">{stat.value}</div>
              <div className="text-sm text-slate-600">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-900">Recent Activity</h2>
          <button 
            onClick={() => onModuleChange('folders')}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            View All
          </button>
        </div>
        
        <div className="space-y-4">
          {recentItems.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>No recent activity. Start by uploading a PDF or creating a note!</p>
            </div>
          ) : (
            recentItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-xl transition-colors">
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    item.type === 'pdf' ? 'bg-red-100 text-red-600' :
                    item.type === 'note' ? 'bg-blue-100 text-blue-600' :
                    item.type === 'mindmap' ? 'bg-purple-100 text-purple-600' :
                    'bg-orange-100 text-orange-600'
                  }`}>
                    {item.type === 'pdf' && <BookOpen className="w-5 h-5" />}
                    {item.type === 'note' && <PenTool className="w-5 h-5" />}
                    {item.type === 'mindmap' && <GitBranch className="w-5 h-5" />}
                    {item.type === 'knowledge' && <Brain className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900">{item.title}</h3>
                    <p className="text-sm text-slate-600">{item.date}</p>
                  </div>
                </div>
                {item.progress !== undefined && (
                  <div className="flex items-center space-x-3">
                    <div className="w-24 bg-slate-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${item.progress}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-slate-600 min-w-[3rem]">{item.progress}%</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;


import React from 'react';
import { 
  Plus, 
  Clock, 
  BookOpen, 
  PenTool, 
  GitBranch, 
  Upload,
  ArrowRight,
  Calendar,
  CheckCircle
} from 'lucide-react';

interface DashboardProps {
  onModuleChange: (module: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onModuleChange }) => {
  const recentItems = [
    { type: 'pdf', title: 'Indian Polity - Chapter 5', date: '2 hours ago', progress: 85 },
    { type: 'note', title: 'Constitutional Amendments', date: '1 day ago', progress: 100 },
    { type: 'mindmap', title: 'Fundamental Rights Overview', date: '2 days ago', progress: 70 },
  ];

  const quickStats = [
    { label: 'Topics Covered', value: '142', icon: CheckCircle, color: 'text-green-500' },
    { label: 'Notes Created', value: '89', icon: PenTool, color: 'text-blue-500' },
    { label: 'Hours Studied', value: '156', icon: Clock, color: 'text-purple-500' },
    { label: 'Mind Maps', value: '23', icon: GitBranch, color: 'text-orange-500' },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome back, Aspirant!</h1>
        <p className="text-slate-600">Continue your UPSC preparation journey</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-4 mb-8">
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
          onClick={() => onModuleChange('mindmap')}
          className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200 group text-left"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <GitBranch className="w-6 h-6 text-purple-600" />
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
          </div>
          <h3 className="font-semibold text-slate-900 mb-1">Mind Map</h3>
          <p className="text-sm text-slate-600">Visualize concepts</p>
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
          <button className="text-blue-600 hover:text-blue-700 font-medium">View All</button>
        </div>
        
        <div className="space-y-4">
          {recentItems.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-xl transition-colors">
              <div className="flex items-center space-x-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  item.type === 'pdf' ? 'bg-red-100 text-red-600' :
                  item.type === 'note' ? 'bg-blue-100 text-blue-600' :
                  'bg-purple-100 text-purple-600'
                }`}>
                  {item.type === 'pdf' && <BookOpen className="w-5 h-5" />}
                  {item.type === 'note' && <PenTool className="w-5 h-5" />}
                  {item.type === 'mindmap' && <GitBranch className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-medium text-slate-900">{item.title}</h3>
                  <p className="text-sm text-slate-600">{item.date}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-24 bg-slate-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${item.progress}%` }}
                  ></div>
                </div>
                <span className="text-sm text-slate-600 min-w-[3rem]">{item.progress}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

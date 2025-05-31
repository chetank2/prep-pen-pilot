
import React from 'react';
import { 
  Home, 
  BookOpen, 
  PenTool, 
  GitBranch, 
  FolderOpen, 
  Settings,
  BookMarked
} from 'lucide-react';

interface NavigationProps {
  activeModule: string;
  onModuleChange: (module: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeModule, onModuleChange }) => {
  const navigationItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard' },
    { id: 'pdf-reader', icon: BookOpen, label: 'PDF Reader' },
    { id: 'canvas', icon: PenTool, label: 'Canvas' },
    { id: 'mindmap', icon: GitBranch, label: 'Mind Maps' },
    { id: 'folders', icon: FolderOpen, label: 'Organize' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <nav className="w-20 bg-white/80 backdrop-blur-sm border-r border-slate-200 flex flex-col items-center py-6 space-y-4">
      {/* Logo */}
      <div className="mb-8">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
          <BookMarked className="w-6 h-6 text-white" />
        </div>
      </div>

      {/* Navigation Items */}
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeModule === item.id;
        
        return (
          <button
            key={item.id}
            onClick={() => onModuleChange(item.id)}
            className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-200 group relative ${
              isActive 
                ? 'bg-blue-500 text-white shadow-lg scale-105' 
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
            title={item.label}
          >
            <Icon className="w-6 h-6" />
            
            {/* Tooltip */}
            <div className="absolute left-full ml-3 px-3 py-2 bg-slate-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
              {item.label}
            </div>
          </button>
        );
      })}
    </nav>
  );
};

export default Navigation;

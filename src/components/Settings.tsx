
import React, { useState } from 'react';
import { 
  User, 
  Palette, 
  Cloud, 
  Bell, 
  Shield, 
  Download, 
  Trash2,
  Moon,
  Sun,
  Monitor,
  Zap,
  Database
} from 'lucide-react';

const Settings: React.FC = () => {
  const [theme, setTheme] = useState('light');
  const [notifications, setNotifications] = useState(true);
  const [autoSync, setAutoSync] = useState(true);
  const [gptModel, setGptModel] = useState('gpt-4');

  const settingSections = [
    {
      title: 'Appearance',
      icon: Palette,
      items: [
        {
          title: 'Theme',
          description: 'Choose your preferred theme',
          type: 'theme-selector'
        },
        {
          title: 'Canvas Background',
          description: 'Default background for new notes',
          type: 'select',
          options: ['White', 'Lined', 'Grid', 'Dot Grid']
        }
      ]
    },
    {
      title: 'AI Features',
      icon: Zap,
      items: [
        {
          title: 'GPT Model',
          description: 'Choose AI model for summaries and Q&A',
          type: 'gpt-selector'
        },
        {
          title: 'Auto-summarize',
          description: 'Automatically summarize PDF pages',
          type: 'toggle',
          value: true
        },
        {
          title: 'Smart Suggestions',
          description: 'Show content-based suggestions',
          type: 'toggle',
          value: true
        }
      ]
    },
    {
      title: 'Sync & Storage',
      icon: Cloud,
      items: [
        {
          title: 'Auto Sync',
          description: 'Automatically sync to iCloud',
          type: 'toggle'
        },
        {
          title: 'Storage Usage',
          description: '2.4 GB used of 5 GB',
          type: 'storage-info'
        },
        {
          title: 'Export All Data',
          description: 'Download all notes and PDFs',
          type: 'action-button'
        }
      ]
    },
    {
      title: 'Notifications',
      icon: Bell,
      items: [
        {
          title: 'Study Reminders',
          description: 'Daily study session reminders',
          type: 'toggle'
        },
        {
          title: 'Progress Updates',
          description: 'Weekly progress summaries',
          type: 'toggle',
          value: true
        }
      ]
    },
    {
      title: 'Account & Privacy',
      icon: Shield,
      items: [
        {
          title: 'Account Info',
          description: 'Manage your account details',
          type: 'account-info'
        },
        {
          title: 'Data Privacy',
          description: 'Control how your data is used',
          type: 'link'
        },
        {
          title: 'Delete Account',
          description: 'Permanently delete your account',
          type: 'danger-button'
        }
      ]
    }
  ];

  const renderSettingItem = (item: any) => {
    switch (item.type) {
      case 'theme-selector':
        return (
          <div className="flex space-x-2">
            {['light', 'dark', 'auto'].map((themeOption) => (
              <button
                key={themeOption}
                onClick={() => setTheme(themeOption)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors ${
                  theme === themeOption 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {themeOption === 'light' && <Sun className="w-4 h-4" />}
                {themeOption === 'dark' && <Moon className="w-4 h-4" />}
                {themeOption === 'auto' && <Monitor className="w-4 h-4" />}
                <span className="capitalize">{themeOption}</span>
              </button>
            ))}
          </div>
        );

      case 'gpt-selector':
        return (
          <select
            value={gptModel}
            onChange={(e) => setGptModel(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="gpt-3.5">GPT-3.5 (Faster, Lower Cost)</option>
            <option value="gpt-4">GPT-4 (More Accurate)</option>
          </select>
        );

      case 'toggle':
        return (
          <button
            onClick={() => {
              // Toggle logic would go here
            }}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              item.value ? 'bg-blue-500' : 'bg-slate-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                item.value ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        );

      case 'storage-info':
        return (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Used: 2.4 GB</span>
              <span>Free: 2.6 GB</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: '48%' }}></div>
            </div>
          </div>
        );

      case 'action-button':
        return (
          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        );

      case 'account-info':
        return (
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-medium text-slate-900">UPSC Aspirant</div>
              <div className="text-sm text-slate-500">aspirant@example.com</div>
            </div>
          </div>
        );

      case 'danger-button':
        return (
          <button className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center space-x-2">
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Settings</h1>
          <p className="text-slate-600">Customize your UPSC preparation environment</p>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {settingSections.map((section) => {
            const Icon = section.icon;
            
            return (
              <div key={section.title} className="bg-white rounded-2xl border border-slate-200 p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-slate-900">{section.title}</h2>
                </div>

                <div className="space-y-6">
                  {section.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-slate-900 mb-1">{item.title}</div>
                        <div className="text-sm text-slate-600">{item.description}</div>
                      </div>
                      <div className="ml-6">
                        {renderSettingItem(item)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* App Info */}
        <div className="mt-8 bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">About</h2>
          <div className="space-y-2 text-sm text-slate-600">
            <div>UPSC Prep App v1.0.0</div>
            <div>Built with React + TypeScript</div>
            <div>© 2024 UPSC Preparation Tool</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

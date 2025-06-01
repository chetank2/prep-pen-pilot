import * as React from 'react';
import SimpleChatInterface from './pages/SimpleChatInterface';
import { KnowledgeBase } from './pages/KnowledgeBase';
import './App.css';

type ActiveTab = 'chat' | 'knowledge-base';

function App() {
  const [activeTab, setActiveTab] = React.useState<ActiveTab>('chat');

  const renderContent = () => {
    if (activeTab === 'chat') {
      return React.createElement(SimpleChatInterface);
    } else {
      return React.createElement(KnowledgeBase);
    }
  };

  return React.createElement('div', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }
  }, [
    // Header Navigation
    React.createElement('div', {
      key: 'header',
      style: {
        display: 'flex',
        backgroundColor: 'white',
        borderBottom: '1px solid #e2e8f0',
        padding: '0',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }
    }, [
      React.createElement('button', {
        key: 'chat-tab',
        onClick: () => setActiveTab('chat'),
        style: {
          padding: '16px 24px',
          backgroundColor: activeTab === 'chat' ? '#3b82f6' : 'transparent',
          color: activeTab === 'chat' ? 'white' : '#64748b',
          border: 'none',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500',
          transition: 'all 0.2s',
          borderBottom: activeTab === 'chat' ? '2px solid #3b82f6' : 'none'
        }
      }, '💬 AI Chat'),
      
      React.createElement('button', {
        key: 'kb-tab',
        onClick: () => setActiveTab('knowledge-base'),
        style: {
          padding: '16px 24px',
          backgroundColor: activeTab === 'knowledge-base' ? '#3b82f6' : 'transparent',
          color: activeTab === 'knowledge-base' ? 'white' : '#64748b',
          border: 'none',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500',
          transition: 'all 0.2s',
          borderBottom: activeTab === 'knowledge-base' ? '2px solid #3b82f6' : 'none'
        }
      }, '📚 Knowledge Base')
    ]),
    
    // Main Content
    React.createElement('div', {
      key: 'content',
      style: {
        flex: 1,
        overflow: 'hidden'
      }
    }, renderContent())
  ]);
}

export default App;

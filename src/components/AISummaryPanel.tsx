import React, { useState } from 'react';
import { X, Send, Lightbulb, MessageSquare, Copy, Bookmark } from 'lucide-react';
import { apiService } from '../services/api';

interface AISummaryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedText: string;
}

const AISummaryPanel: React.FC<AISummaryPanelProps> = ({ isOpen, onClose, selectedText }) => {
  const [messages, setMessages] = useState([
    {
      type: 'ai',
      content: 'Hi! I can help you understand and summarize the selected text. What would you like to know?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const newUserMessage = {
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await apiService.summarizeText(selectedText, inputMessage);

      let aiContent = 'Sorry, I could not process your request.';
      if (response.success && response.data) {
        aiContent = response.data.summary;
      } else if (response.error) {
        aiContent = response.error;
      }

      const aiResponse = {
        type: 'ai',
        content: aiContent,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to get AI response:', error);
      const errorResponse = {
        type: 'ai',
        content: 'Sorry, I encountered an error processing your request. Please try again later.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action: string) => {
    let message = '';
    if (action === 'summarize') {
      message = 'Please provide a detailed summary of the selected text';
    } else if (action === 'explain') {
      message = 'Can you explain this concept in simple terms?';
    } else if (action === 'questions') {
      message = 'Generate some practice questions based on this content';
    }
    setInputMessage(message);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white border-l border-slate-200 shadow-xl z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
            <Lightbulb className="w-4 h-4 text-white" />
          </div>
          <h3 className="font-semibold text-slate-900">AI Assistant</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Selected Text Preview */}
      {selectedText && (
        <div className="p-4 bg-blue-50 border-b border-slate-200">
          <div className="text-xs text-blue-600 font-medium mb-1">Selected Text:</div>
          <div className="text-sm text-slate-700 line-clamp-3">
            "{selectedText.substring(0, 150)}..."
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="p-4 border-b border-slate-200">
        <div className="text-xs text-slate-600 mb-2">Quick Actions:</div>
        <div className="flex space-x-2">
          <button
            onClick={() => handleQuickAction('summarize')}
            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition-colors"
          >
            Summarize
          </button>
          <button
            onClick={() => handleQuickAction('explain')}
            className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200 transition-colors"
          >
            Explain
          </button>
          <button
            onClick={() => handleQuickAction('questions')}
            className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm hover:bg-purple-200 transition-colors"
          >
            Questions
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-lg p-3 ${
              message.type === 'user' 
                ? 'bg-blue-500 text-white' 
                : 'bg-slate-100 text-slate-900'
            }`}>
              <div className="text-sm whitespace-pre-line">{message.content}</div>
              {message.type === 'ai' && (
                <div className="flex items-center space-x-2 mt-2 pt-2 border-t border-slate-200">
                  <button className="p-1 text-slate-500 hover:text-slate-700 transition-colors">
                    <Copy className="w-3 h-3" />
                  </button>
                  <button className="p-1 text-slate-500 hover:text-slate-700 transition-colors">
                    <Bookmark className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 rounded-lg p-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-200">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask a question..."
            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AISummaryPanel;

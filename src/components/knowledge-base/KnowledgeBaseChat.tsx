import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  FileText, 
  Brain,
  Lightbulb,
  MessageSquare,
  Plus,
  Search
} from 'lucide-react';
import { KnowledgeBaseService } from '@/services/knowledgeBaseService';
import { toast } from 'sonner';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  referencedItems?: string[];
}

interface KnowledgeBaseChatProps {
  selectedItems?: string[];
  className?: string;
}

export function KnowledgeBaseChat({ selectedItems = [], className }: KnowledgeBaseChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const messageText = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    // Add user message immediately
    const userMessage: ChatMessage = {
      id: 'user-' + Date.now(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      // Simulate AI response for now (replace with actual API call)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const assistantMessage: ChatMessage = {
        id: 'assistant-' + Date.now(),
        role: 'assistant',
        content: generateMockResponse(messageText, selectedItems),
        timestamp: new Date(),
        referencedItems: selectedItems.slice(0, 2),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      inputRef.current?.focus();
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockResponse = (userMessage: string, contextItems: string[]): string => {
    const responses = [
      `I understand you're asking about "${userMessage}". Based on your uploaded content${contextItems.length > 0 ? ` and the ${contextItems.length} selected files` : ''}, I can help you with that.`,
      `That's an interesting question about "${userMessage}". Let me analyze your knowledge base to provide you with relevant insights.`,
      `I can help you with that! From your uploaded materials${contextItems.length > 0 ? ` and selected items` : ''}, here's what I found relevant to your question.`,
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getMessageIcon = (role: 'user' | 'assistant') => {
    return role === 'user' ? User : Bot;
  };

  const getMessageBgColor = (role: 'user' | 'assistant') => {
    return role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-900';
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              AI Knowledge Assistant
            </CardTitle>
            <Button size="sm" variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              New Chat
            </Button>
          </div>
          {selectedItems.length > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-gray-600">
                Using {selectedItems.length} selected item{selectedItems.length > 1 ? 's' : ''} as context
              </span>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Messages */}
      <Card className="flex-1 flex flex-col">
        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 p-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <Lightbulb className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  Start a conversation
                </h3>
                <p className="text-sm text-gray-500 max-w-md">
                  Ask questions about your uploaded content, request summaries, 
                  generate mind maps, or get help with your studies.
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  <Badge variant="outline">Summarize content</Badge>
                  <Badge variant="outline">Create mind map</Badge>
                  <Badge variant="outline">Generate notes</Badge>
                  <Badge variant="outline">Ask questions</Badge>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => {
                  const Icon = getMessageIcon(message.role);
                  return (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {message.role === 'assistant' && (
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <Icon className="w-4 h-4 text-blue-600" />
                          </div>
                        </div>
                      )}
                      
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-2 ${getMessageBgColor(
                          message.role
                        )}`}
                      >
                        <div>{message.content}</div>
                        
                        {/* Referenced Items */}
                        {message.referencedItems && message.referencedItems.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Search className="w-3 h-3" />
                              Referenced {message.referencedItems.length} item(s)
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {message.role === 'user' && (
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                            <Icon className="w-4 h-4 text-gray-600" />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-blue-600" />
                      </div>
                    </div>
                    <div className="bg-gray-100 rounded-lg px-4 py-2">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm text-gray-600">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>
          
          {/* Input */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about your content, request summaries, or generate notes..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
                size="icon"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
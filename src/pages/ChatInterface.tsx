import * as React from 'react';
import { Search, Plus, Upload, Folder, MessageCircle, Send, Paperclip, Sparkles, Save, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { FolderService } from '../services/folderService';
import { ChatService } from '../services/chatService';
import { Folder as FolderType, ChatSession, ChatMessage, ChatContext } from '../types/chat';

interface SaveContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  contentType: string;
  onSave: (folderId: string, title: string) => void;
  folders: FolderType[];
}

const SaveContentModal: React.FC<SaveContentModalProps> = ({ 
  isOpen, 
  onClose, 
  content, 
  contentType, 
  onSave, 
  folders 
}) => {
  const [selectedFolderId, setSelectedFolderId] = React.useState('');
  const [title, setTitle] = React.useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    if (selectedFolderId && title.trim()) {
      onSave(selectedFolderId, title.trim());
      onClose();
      setTitle('');
      setSelectedFolderId('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Save {contentType}</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`${contentType} title`}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Save to Folder</label>
            <select
              value={selectedFolderId}
              onChange={(e) => setSelectedFolderId(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">Select a folder</option>
              {folders.map(folder => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!selectedFolderId || !title.trim()}
              className="flex-1"
            >
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ChatInterface: React.FC = () => {
  const [folders, setFolders] = React.useState<FolderType[]>([]);
  const [currentSession, setCurrentSession] = React.useState<ChatSession | null>(null);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = React.useState('');
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedFolder, setSelectedFolder] = React.useState<FolderType | null>(null);
  const [showSaveModal, setShowSaveModal] = React.useState(false);
  const [contentToSave, setContentToSave] = React.useState<{
    content: string;
    type: string;
    messageId: string;
  } | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    loadFolders();
  }, []);

  React.useEffect(() => {
    if (currentSession) {
      loadMessages(currentSession.id);
    }
  }, [currentSession]);

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadFolders = async () => {
    try {
      const foldersData = await FolderService.getFolders();
      setFolders(foldersData);
    } catch (error) {
      console.error('Failed to load folders:', error);
    }
  };

  const loadMessages = async (sessionId: string) => {
    try {
      const messagesData = await ChatService.getMessages(sessionId);
      setMessages(messagesData);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() && selectedFiles.length === 0) return;

    setIsLoading(true);
    try {
      // Create session if none exists
      let session = currentSession;
      if (!session) {
        const context = selectedFolder ? 'folder' : 'general';
        session = await ChatService.createSession({
          title: inputMessage.trim() || 'New Chat',
          folder_id: selectedFolder?.id,
          context_type: context,
          context_data: selectedFolder ? { folder_name: selectedFolder.name } : {},
        });
        setCurrentSession(session);
      }

      // Create context for the message
      const chatContext: ChatContext = ChatService.createContext(
        selectedFolder ? 'folder' : 'general',
        {
          folder_id: selectedFolder?.id,
          previous_messages: messages.slice(-5), // Last 5 messages for context
        }
      );

      // Send message
      const response = await ChatService.sendMessage(
        session.id,
        inputMessage,
        selectedFiles,
        chatContext
      );

      // Update messages
      setMessages(prev => [...prev, response.data.user_message, response.data.assistant_message]);
      
      // Clear input
      setInputMessage('');
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const generateContent = async (type: string, content: string) => {
    setIsLoading(true);
    try {
      const response = await ChatService.generateContent({
        type: type as any,
        content,
        user_query: `Generate ${type} from this content`,
        context: selectedFolder ? ChatService.createContext('folder', { folder_id: selectedFolder.id }) : undefined,
      });

      // Add generated content as a new assistant message
      const generatedMessage: ChatMessage = {
        id: `generated-${Date.now()}`,
        session_id: currentSession?.id || '',
        role: 'assistant',
        content: `I've generated a ${type} for you:\n\n${JSON.stringify(response.data.content_data, null, 2)}`,
        attachments: [],
        generated_content_ids: [],
        context_used: {},
        processing_status: 'completed',
        created_at: new Date().toISOString(),
      };

      setMessages(prev => [...prev, generatedMessage]);
      
      // Show save modal
      setContentToSave({
        content: JSON.stringify(response.data.content_data),
        type,
        messageId: generatedMessage.id,
      });
      setShowSaveModal(true);
    } catch (error) {
      console.error(`Failed to generate ${type}:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveContent = async (folderId: string, title: string) => {
    if (!contentToSave) return;

    try {
      await ChatService.saveContent({
        content: contentToSave.content,
        content_type: contentToSave.type as any,
        title,
        folder_id: folderId,
        source_message_id: contentToSave.messageId,
      });
      
      console.log('Content saved successfully');
    } catch (error) {
      console.error('Failed to save content:', error);
    }
  };

  const startNewChat = () => {
    setCurrentSession(null);
    setMessages([]);
    setSelectedFolder(null);
  };

  const selectFolder = (folder: FolderType) => {
    setSelectedFolder(folder);
    startNewChat(); // Start fresh when switching folders
  };

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Sidebar with Folders */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Knowledge Folders</h2>
            <Button variant="ghost" size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input 
              placeholder="Search folders..." 
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            <Button
              variant={selectedFolder === null ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setSelectedFolder(null)}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              General Chat
            </Button>
            
            {folders.map((folder) => (
              <Button
                key={folder.id}
                variant={selectedFolder?.id === folder.id ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => selectFolder(folder)}
              >
                <Folder 
                  className="h-4 w-4 mr-2" 
                  style={{ color: folder.color }}
                />
                {folder.name}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">
                {selectedFolder ? selectedFolder.name : 'AI Knowledge Assistant'}
              </h1>
              <p className="text-sm text-gray-600">
                {selectedFolder 
                  ? `Chat with AI about ${selectedFolder.name} content`
                  : 'Upload documents, ask questions, and generate study materials'
                }
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={startNewChat}>
                New Chat
              </Button>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Upload Documents
              </Button>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <Sparkles className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {selectedFolder ? `Start chatting about ${selectedFolder.name}` : 'Welcome to your AI Knowledge Assistant'}
                </h3>
                <p className="text-gray-600 mb-6">
                  Ask questions, upload files, or request AI-generated content like mindmaps, summaries, and study notes.
                </p>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <Button variant="outline" size="sm" onClick={() => setInputMessage('Summarize my recent uploads')}>
                    📄 Summarize content
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setInputMessage('Create a mindmap of key topics')}>
                    🧠 Generate mindmap
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setInputMessage('Make study notes from my materials')}>
                    📝 Create study notes
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setInputMessage('Ask me practice questions')}>
                    ❓ Practice questions
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-2xl rounded-lg p-4 ${
                    message.role === 'user' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-white border border-gray-200'
                  }`}>
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    
                    {message.attachments.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {message.attachments.map((attachment, idx) => (
                          <div key={idx} className="text-xs opacity-75">
                            📎 {attachment.name}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {message.role === 'assistant' && (
                      <div className="mt-3 flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-xs"
                          onClick={() => generateContent('mindmap', message.content)}
                        >
                          🧠 Mindmap
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-xs"
                          onClick={() => generateContent('notes', message.content)}
                        >
                          📝 Notes
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-xs"
                          onClick={() => generateContent('summary', message.content)}
                        >
                          📄 Summary
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="bg-white border-t border-gray-200 p-4">
          {selectedFiles.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1 text-sm">
                  <span>{file.name}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeFile(index)}
                    className="h-4 w-4 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={selectedFolder ? `Ask about ${selectedFolder.name}...` : "Ask a question or upload files..."}
                className="pr-10 resize-none"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,.doc,.docx,.txt,.md,image/*"
              />
              <Button
                size="sm"
                variant="ghost"
                className="absolute right-2 bottom-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
            </div>
            
            <Button 
              onClick={handleSendMessage}
              disabled={isLoading || (!inputMessage.trim() && selectedFiles.length === 0)}
              className="px-6"
            >
              {isLoading ? (
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Save Content Modal */}
      <SaveContentModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        content={contentToSave?.content || ''}
        contentType={contentToSave?.type || ''}
        onSave={handleSaveContent}
        folders={folders}
      />
    </div>
  );
};

export default ChatInterface; 
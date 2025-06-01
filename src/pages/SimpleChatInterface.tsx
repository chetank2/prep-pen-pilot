import { useState, useEffect } from 'react';
import { FolderService } from '../services/folderService';
import { ChatService } from '../services/chatService';

const SimpleChatInterface = () => {
  const [folders, setFolders] = useState([]);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    try {
      const foldersData = await FolderService.getFolders();
      setFolders(foldersData);
    } catch (error) {
      console.error('Failed to load folders:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    setIsLoading(true);
    try {
      let session = currentSession;
      if (!session) {
        session = await ChatService.createSession({
          title: inputMessage.trim(),
          context_type: 'general',
        });
        setCurrentSession(session);
      }

      const response = await ChatService.sendMessage(session.id, inputMessage);
      setMessages(prev => [...prev, response.data.user_message, response.data.assistant_message]);
      setInputMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Arial, sans-serif' }}>
      {/* Sidebar */}
      <div style={{ width: '300px', borderRight: '1px solid #ccc', padding: '20px' }}>
        <h2>Knowledge Folders</h2>
        <div style={{ marginBottom: '20px' }}>
          <div style={{ padding: '10px', background: '#f0f0f0', borderRadius: '5px', marginBottom: '10px', cursor: 'pointer' }}>
            General Chat
          </div>
          {folders.map(folder => (
            <div key={folder.id} style={{ padding: '10px', background: '#f8f8f8', borderRadius: '5px', marginBottom: '5px', cursor: 'pointer' }}>
              📁 {folder.name}
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ padding: '20px', borderBottom: '1px solid #ccc', background: '#fff' }}>
          <h1>AI Knowledge Assistant</h1>
          <p>Upload documents, ask questions, and generate study materials</p>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: '100px' }}>
              <h3>Welcome to your AI Knowledge Assistant</h3>
              <p>Ask questions, upload files, or request AI-generated content like mindmaps, summaries, and study notes.</p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div key={index} style={{ 
                marginBottom: '20px', 
                display: 'flex', 
                justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start' 
              }}>
                <div style={{
                  maxWidth: '70%',
                  padding: '15px',
                  borderRadius: '10px',
                  background: message.role === 'user' ? '#007bff' : '#f8f9fa',
                  color: message.role === 'user' ? 'white' : 'black'
                }}>
                  {message.content}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input Area */}
        <div style={{ padding: '20px', borderTop: '1px solid #ccc', background: '#fff' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask a question or upload files..."
              style={{
                flex: 1,
                padding: '15px',
                border: '1px solid #ccc',
                borderRadius: '5px',
                fontSize: '16px'
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSendMessage();
                }
              }}
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !inputMessage.trim()}
              style={{
                padding: '15px 30px',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              {isLoading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleChatInterface; 
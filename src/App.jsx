import { useState, useEffect } from 'react';
import AuthForm from './components/AuthForm';
import TextQueryPanel from './components/TextQueryPanel';
import VoiceQueryPanel from './components/VoiceQueryPanel';
import FileUploadPanel from './components/FileUploadPanel';
import ChatLog from './components/ChatLog';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorAlert from './components/ErrorAlert';

// Config
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://ai-finance-accountant-agent-5iu7.onrender.com';
const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 'localhost:8000';

// Tabs enum
const TABS = {
  TEXT: 'text',
  VOICE: 'voice',
  UPLOAD: 'upload'
};

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [activeTab, setActiveTab] = useState(TABS.TEXT);
  const [messages, setMessages] = useState([]);
  const [isLiveVoice, setIsLiveVoice] = useState(false);
  const [wsConnection, setWsConnection] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Update localStorage when token changes
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  // Handle login
  const handleLogin = async (username, password) => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }
      
      setToken(data.access_token);
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    setToken('');
    setMessages([]);
  };

  // API fetch with auth
  const fetchWithAuth = async (endpoint, options = {}) => {
    setIsLoading(true);
    setError('');
    
    try {
      const headers = {
        ...options.headers,
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });
      
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }
      
      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }
      
      return data;
    } catch (err) {
      setError(err.message || 'Something went wrong');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Text query handler
  const handleTextQuery = async (query) => {
    try {
      const result = await fetchWithAuth('/text/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });
      
      addToChat('user', query);
      addToChat('ai', result.response_text || 'No response text available', result);
      
      return result;
    } catch (err) {
      console.error('Error submitting text query:', err);
    }
  };

  // Voice query handler
  const handleVoiceQuery = async (audioBlob) => {
    try {
      const formData = new FormData();
      formData.append('audio_file', audioBlob);
      
      const result = await fetchWithAuth('/voice/query', {
        method: 'POST',
        body: formData,
      });
      
      addToChat('user', result.transcript || 'Voice query');
      addToChat('ai', result.response_text || 'No response text available', result);
      
      return result;
    } catch (err) {
      console.error('Error submitting voice query:', err);
    }
  };

  // File upload handler
  const handleFileUpload = async (file, category) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);
      
      return await fetchWithAuth('/files/upload', {
        method: 'POST',
        body: formData,
      });
    } catch (err) {
      console.error('Error uploading file:', err);
    }
  };

  // Add message to chat log
  const addToChat = (type, content, data = null) => {
    setMessages(prev => [...prev, { type, content, data }]);
  };

  // Toggle live voice
  const toggleLiveVoice = async () => {
    if (isLiveVoice) {
      // Stop live voice
      if (wsConnection) {
        wsConnection.close();
      }
      
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
      
      setIsLiveVoice(false);
      setWsConnection(null);
      setMediaRecorder(null);
    } else {
      // Start live voice
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const ws = new WebSocket(`ws://${WS_BASE_URL}/voice/live`);
        
        ws.onopen = () => {
          console.log('WebSocket connected');
          
          const recorder = new MediaRecorder(stream);
          setMediaRecorder(recorder);
          
          recorder.ondataavailable = (event) => {
            if (ws.readyState === WebSocket.OPEN && event.data.size > 0) {
              const reader = new FileReader();
              reader.onload = () => {
                ws.send(reader.result);
              };
              reader.readAsArrayBuffer(event.data);
            }
          };
          
          recorder.start(100);
        };
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.partial) {
              setInterimTranscript(data.partial);
            }
            
            if (data.final) {
              setFinalTranscript(data.final);
              
              // Automatically send to text query
              handleTextQuery(data.final);
            }
          } catch (err) {
            console.error('Error processing WebSocket message:', err);
          }
        };
        
        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          setError('WebSocket connection error');
          setIsLiveVoice(false);
        };
        
        ws.onclose = () => {
          console.log('WebSocket connection closed');
          setIsLiveVoice(false);
        };
        
        setWsConnection(ws);
        setIsLiveVoice(true);
      } catch (err) {
        console.error('Error starting live voice:', err);
        setError('Could not start live voice: ' + err.message);
      }
    }
  };

  // Show login form if not authenticated
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <AuthForm onLogin={handleLogin} isLoading={isLoading} error={error} />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">AI Finance Accountant</h1>
        <button
          onClick={handleLogout}
          className="px-4 py-1.5 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none"
        >
          Logout
        </button>
      </header>
      
      {error && <ErrorAlert message={error} />}
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab(TABS.TEXT)}
            className={`flex-1 py-3 font-medium ${
              activeTab === TABS.TEXT 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Text
          </button>
          <button
            onClick={() => setActiveTab(TABS.VOICE)}
            className={`flex-1 py-3 font-medium ${
              activeTab === TABS.VOICE 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Voice
          </button>
          <button
            onClick={() => setActiveTab(TABS.UPLOAD)}
            className={`flex-1 py-3 font-medium ${
              activeTab === TABS.UPLOAD 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Upload
          </button>
        </div>
        
        <div className="p-6">
          {/* Live Voice Toggle */}
          <div className="flex justify-end mb-4">
            <div className="flex items-center">
              <span className="mr-2 text-gray-700">Live Voice</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={isLiveVoice} 
                  onChange={toggleLiveVoice} 
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
              </label>
            </div>
          </div>
          
          {/* Live Voice Status and Transcription */}
          {isLiveVoice && (
            <div className="mb-6 p-4 bg-blue-50 rounded-md border border-blue-200">
              <h3 className="font-bold mb-2">Live Voice Mode Active</h3>
              {interimTranscript && (
                <p className="text-gray-600 italic">{interimTranscript}</p>
              )}
              {finalTranscript && (
                <div className="mt-2">
                  <p className="font-semibold">Final Transcript:</p>
                  <p className="text-gray-800">{finalTranscript}</p>
                </div>
              )}
            </div>
          )}
          
          {isLoading && <LoadingSpinner />}
          
          {/* Active Tab Content */}
          {activeTab === TABS.TEXT && (
            <TextQueryPanel onSubmit={handleTextQuery} />
          )}
          
          {activeTab === TABS.VOICE && (
            <VoiceQueryPanel onSubmit={handleVoiceQuery} />
          )}
          
          {activeTab === TABS.UPLOAD && (
            <FileUploadPanel onSubmit={handleFileUpload} />
          )}
        </div>
      </div>
      
      {/* Chat Log */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-3">Conversation History</h2>
        <ChatLog messages={messages} />
      </div>
    </div>
  );
}

export default App;
// ChatLog component 
import { useRef, useEffect } from 'react';

const ChatLog = ({ messages = [] }) => {
  const chatEndRef = useRef(null);
  
  // Auto-scroll to bottom when new messages come in
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  if (messages.length === 0) {
    return (
      <div className="bg-gray-50 p-4 rounded-md border border-gray-200 text-center text-gray-500">
        No messages yet. Start a conversation!
      </div>
    );
  }
  
  return (
    <div className="bg-gray-50 p-4 rounded-md border border-gray-200 max-h-96 overflow-y-auto">
      {messages.map((message, idx) => (
        <div 
          key={idx} 
          className={`mb-4 ${message.type === 'user' ? 'text-right' : 'text-left'}`}
        >
          <div 
            className={`inline-block px-4 py-2 rounded-lg max-w-[80%] ${
              message.type === 'user' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-800'
            }`}
          >
            <p>{message.content}</p>
            
            {message.type === 'ai' && message.data?.tts_url && (
              <div className="mt-2">
                <audio controls className="w-full">
                  <source src={message.data.tts_url} type="audio/mpeg" />
                </audio>
              </div>
            )}
          </div>
        </div>
      ))}
      <div ref={chatEndRef} />
    </div>
  );
};

export default ChatLog;
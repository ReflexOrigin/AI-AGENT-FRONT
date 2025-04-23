import { useState } from 'react';

const TextQueryPanel = ({ onSubmit }) => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState(null);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!query.trim()) return;
    
    try {
      const result = await onSubmit(query);
      setResponse(result);
      setQuery('');
    } catch (err) {
      console.error('Error submitting text query:', err);
    }
  };
  
  const playTts = (url) => {
    if (!url) return;
    
    const audio = new Audio(url);
    audio.play();
  };
  
  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="mb-4">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ask the AI Finance Accountant a question..."
            rows={3}
          />
        </div>
        
        <button
          type="submit"
          disabled={!query.trim()}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-300"
        >
          Send
        </button>
      </form>
      
      {response && (
        <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
          <h3 className="font-bold text-lg mb-2">Response</h3>
          
          <div className="mb-4">
            <h4 className="font-semibold">Intent</h4>
            <p className="text-gray-700">{response.intent || 'N/A'}</p>
          </div>
          
          <div className="mb-4">
            <h4 className="font-semibold">Subintent</h4>
            <p className="text-gray-700">{response.subintent || 'N/A'}</p>
          </div>
          
          {response.entities && response.entities.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold">Entities</h4>
              <ul className="list-disc pl-5">
                {response.entities.map((entity, idx) => (
                  <li key={idx} className="text-gray-700">
                    {entity.type}: {entity.value}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="mb-4">
            <h4 className="font-semibold">Response Text</h4>
            <p className="text-gray-700">{response.response_text || 'No response text'}</p>
          </div>
          
          {response.tts_url && (
            <button
              onClick={() => playTts(response.tts_url)}
              className="px-3 py-1 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              Play TTS
            </button>
          )}
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="font-semibold">Raw JSON</h4>
            <pre className="bg-gray-800 text-gray-100 p-3 rounded-md overflow-x-auto text-xs">
              {JSON.stringify(response, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default TextQueryPanel;
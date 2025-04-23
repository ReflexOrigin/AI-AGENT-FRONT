// VoiceQueryPanel component 
import { useState, useEffect, useRef } from 'react';

const VoiceQueryPanel = ({ onSubmit }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [audioBlob, setAudioBlob] = useState(null);
  const [response, setResponse] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recognitionRef = useRef(null);
  
  // Set up speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      
      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        setTranscript(finalTranscript || interimTranscript);
      };
      
      recognitionRef.current = recognition;
    }
    
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (err) {
          // Ignore errors when stopping
        }
      }
    };
  }, []);
  
  // Process audio when recording stops
  useEffect(() => {
    const processAudio = async () => {
      if (audioBlob && !isRecording) {
        try {
          const result = await onSubmit(audioBlob);
          setResponse(result);
        } catch (err) {
          console.error('Error processing voice query:', err);
        }
      }
    };
    
    processAudio();
  }, [audioBlob, isRecording, onSubmit]);
  
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
      };
      
      // Start speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error starting recording:', err);
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      
      // Stop speech recognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (err) {
          // Ignore errors when stopping
        }
      }
      
      // Stop all audio tracks
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
      
      setIsRecording(false);
    }
  };
  
  const resetRecording = () => {
    setAudioBlob(null);
    setTranscript('');
    setResponse(null);
  };
  
  const handleRecordClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      resetRecording();
      startRecording();
    }
  };
  
  return (
    <div className="w-full">
      <div className="mb-6">
        <button
          onClick={handleRecordClick}
          className={`px-4 py-2 rounded-md focus:outline-none focus:ring-2 ${
            isRecording 
              ? 'bg-red-500 hover:bg-red-600 focus:ring-red-500 text-white' 
              : 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-500 text-white'
          }`}
        >
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </button>
      </div>
      
      {(isRecording || transcript) && (
        <div className="mb-6 p-4 bg-gray-50 rounded-md border border-gray-200">
          <h3 className="font-bold mb-2">Transcript</h3>
          <p className="text-gray-700">{transcript || 'Listening...'}</p>
        </div>
      )}
      
      {response && (
        <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
          <h3 className="font-bold text-lg mb-2">Response</h3>
          
          <div className="mb-4">
            <h4 className="font-semibold">Transcript</h4>
            <p className="text-gray-700">{response.transcript || 'N/A'}</p>
          </div>
          
          <div className="mb-4">
            <h4 className="font-semibold">Intent</h4>
            <p className="text-gray-700">{response.intent || 'N/A'}</p>
          </div>
          
          <div className="mb-4">
            <h4 className="font-semibold">Response Text</h4>
            <p className="text-gray-700">{response.response_text || 'No response text'}</p>
          </div>
          
          {response.tts_url && (
            <div className="mb-4">
              <h4 className="font-semibold">TTS Audio</h4>
              <audio controls className="w-full mt-2">
                <source src={response.tts_url} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            </div>
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

export default VoiceQueryPanel;
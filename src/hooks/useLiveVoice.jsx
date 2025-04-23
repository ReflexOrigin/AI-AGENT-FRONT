// useLiveVoice custom hook 
import { useState, useRef, useEffect, useCallback } from 'react';
import { useApi } from './useApi';

export const useLiveVoice = () => {
  const [isLive, setIsLive] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState(null);
  const [error, setError] = useState(null);
  
  const wsRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  
  const { textQuery, isLoading } = useApi();
  
  const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL;
  
  const processAiResponse = useCallback(async (text) => {
    try {
      const response = await textQuery(text);
      setAiResponse(response);
    } catch (err) {
      setError('Error processing voice query: ' + err.message);
    }
  }, [textQuery]);
  
  const startLiveVoice = useCallback(async () => {
    try {
      // Get audio stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Connect WebSocket
      const socket = new WebSocket(`ws://${WS_BASE_URL}/voice/live`);
      
      socket.onopen = () => {
        console.log('WebSocket connected');
        
        // Setup MediaRecorder
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        
        mediaRecorder.ondataavailable = (event) => {
          if (socket.readyState === WebSocket.OPEN && event.data.size > 0) {
            // Convert Blob to ArrayBuffer, then to PCM, and send
            const reader = new FileReader();
            reader.onload = () => {
              socket.send(reader.result);
            };
            reader.readAsArrayBuffer(event.data);
          }
        };
        
        // Start recording in small chunks
        mediaRecorder.start(100);
      };
      
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.partial) {
            setInterimTranscript(data.partial);
          }
          
          if (data.final) {
            setFinalTranscript(data.final);
            processAiResponse(data.final);
          }
        } catch (err) {
          console.error('Error processing WebSocket message:', err);
        }
      };
      
      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('WebSocket connection error');
        stopLiveVoice();
      };
      
      socket.onclose = () => {
        console.log('WebSocket connection closed');
        stopLiveVoice();
      };
      
      wsRef.current = socket;
      setIsLive(true);
    } catch (err) {
      console.error('Error starting live voice:', err);
      setError('Could not start live voice: ' + err.message);
    }
  }, [WS_BASE_URL, processAiResponse]);
  
  const stopLiveVoice = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
      wsRef.current = null;
    }
    
    setIsLive(false);
  }, []);
  
  const toggleLiveVoice = () => {
    if (isLive) {
      stopLiveVoice();
    } else {
      startLiveVoice();
    }
  };
  
  useEffect(() => {
    // Cleanup on unmount
    return () => {
      stopLiveVoice();
    };
  }, [stopLiveVoice]);
  
  return {
    isLive,
    toggleLiveVoice,
    interimTranscript,
    finalTranscript,
    aiResponse,
    isLoading,
    error,
  };
};
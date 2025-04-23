// useApi custom hook 
import { useState } from 'react';
import { useAuth } from './useAuth';

export const useApi = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { token } = useAuth();
  
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  
  const fetchWithAuth = async (endpoint, options = {}) => {
    setIsLoading(true);
    setError(null);
    
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
  
  const textQuery = async (query) => {
    return fetchWithAuth('/text/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });
  };
  
  const voiceQuery = async (audioBlob) => {
    const formData = new FormData();
    formData.append('audio_file', audioBlob);
    
    return fetchWithAuth('/voice/query', {
      method: 'POST',
      body: formData,
    });
  };
  
  const uploadFile = async (file, category) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    
    return fetchWithAuth('/files/upload', {
      method: 'POST',
      body: formData,
    });
  };
  
  return {
    isLoading,
    error,
    textQuery,
    voiceQuery,
    uploadFile,
  };
};
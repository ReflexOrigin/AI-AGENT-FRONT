// useAuth custom hook 
import { useState, useEffect, createContext, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(!!token);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      setIsAuthenticated(true);
    } else {
      localStorage.removeItem('token');
      setIsAuthenticated(false);
    }
  }, [token]);
  
  const login = async (username, password) => {
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
      setToken('');
    } finally {
      setIsLoading(false);
    }
  };
  
  const logout = () => {
    setToken('');
  };
  
  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      token, 
      login, 
      logout, 
      isLoading, 
      error 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
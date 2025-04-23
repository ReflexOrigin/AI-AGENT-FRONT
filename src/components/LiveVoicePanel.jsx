//LiveVoicePanel.jsx
import React, { useEffect } from 'react';
import useLiveVoice from '../hooks/useLiveVoice';
import ErrorAlert from './ErrorAlert';
import LoadingSpinner from './LoadingSpinner';
import { motion } from 'framer-motion';
import { Radio, Mic, MicOff } from 'lucide-react';

const LiveVoicePanel = ({ onMessageSent }) => {
  const { isActive, transcript, messages, start, stop, error } = useLiveVoice();

  // When we get new messages from the live voice hook, send them to the parent
  useEffect(() => {
    if (messages.length > 0) {
      messages.forEach(message => {
        onMessageSent(message);
      });
    }
  }, [messages, onMessageSent]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg-glow p-8 mb-8 transition"
    >
      <h2 className="text-xl font-semibold mb-6 text-gray-800 dark:text-white flex items-center">
        <Radio size={22} className="mr-2 text-primary-600 dark:text-primary-400" />
        Live Voice Conversation
      </h2>
      
      {error && (
        <ErrorAlert
          message={error}
          onDismiss={() => {}}
        />
      )}
      
      <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl mb-6 min-h-[120px] shadow-inner">
        <p className="font-medium mb-3 text-gray-700 dark:text-gray-300">Live Transcript:</p>
        <div>
          {transcript.final && (
            <p className="text-gray-900 dark:text-gray-100 mb-2">
              <span className="font-medium">Final:</span> {transcript.final}
            </p>
          )}
          
          {transcript.partial && (
            <p className="text-gray-600 dark:text-gray-300 italic">
              <span className="font-medium">Listening:</span> {transcript.partial}
            </p>
          )}
          
          {!transcript.final && !transcript.partial && (
            <p className="text-gray-400 dark:text-gray-500 italic">
              Start the live voice mode and your conversation will appear here...
            </p>
          )}
        </div>
      </div>
      
      <div className="flex justify-center mb-6">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={isActive ? stop : start}
          className={`px-6 py-4 rounded-full font-medium text-white shadow-lg flex items-center transition ${
            isActive
              ? 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600'
              : 'bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600'
          }`}
        >
          {isActive ? (
            <>
              <MicOff size={20} className="mr-2" />
              Stop Live Mode
            </>
          ) : (
            <>
              <Mic size={20} className="mr-2" />
              Start Live Mode
            </>
          )}
        </motion.button>
      </div>
      
      {isActive && (
        <div className="text-center bg-gray-50 dark:bg-gray-700 rounded-xl p-4 shadow-inner">
          <div className="flex items-center justify-center">
            <div className="relative">
              <div className="h-4 w-4 bg-red-600 dark:bg-red-500 rounded-full animate-ping absolute"></div>
              <div className="h-4 w-4 bg-red-600 dark:bg-red-500 rounded-full relative"></div>
            </div>
            <p className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">Live Mode Active</p>
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Speak naturally. Your voice is being processed in real-time.
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default LiveVoicePanel;
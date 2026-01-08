import React from 'react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

export const SpeechRecorder: React.FC = () => {
  const {
    isSupported,
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    error
  } = useSpeechRecognition();

  if (!isSupported) {
    return <div className="p-4 text-red-600">Browser does not support Speech Recognition.</div>;
  }

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-lg shadow-sm">
      <div className="flex gap-2">
        {!isListening ? (
          <button
            onClick={startListening}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Start Recording
          </button>
        ) : (
          <button
            onClick={stopListening}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Stop Recording
          </button>
        )}
        
        <button
          onClick={resetTranscript}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
        >
          Reset
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-500">Error: {error}</p>
      )}

      <div className="mt-4 p-3 bg-gray-50 rounded min-h-[100px] whitespace-pre-wrap">
        {transcript || 'Transcript will appear here...'}
      </div>
    </div>
  );
};
"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export function useVoiceRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [error, setError] = useState(null);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);

  // Check browser support
  useEffect(() => {
    const checkSupport = () => {
      if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
        console.log('Speech Recognition not supported');
        setIsSupported(false);
        return false;
      }
      
      // Check if we're on HTTPS (required for speech recognition)
      if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        console.log('Speech Recognition requires HTTPS');
        setError('Voice recognition requires HTTPS. Please use a secure connection.');
        setIsSupported(false);
        return false;
      }
      
      return true;
    };

    if (checkSupport()) {
      console.log('Voice recognition is supported');
    }
  }, []);

  // Initialize recognition when needed
  const initializeRecognition = useCallback(() => {
    if (!isSupported) return null;

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      // Mobile-optimized settings
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      recognition.continuous = false; // Always false for mobile compatibility
      recognition.interimResults = true;
      recognition.lang = "en-US";
      recognition.maxAlternatives = 1;
      
      console.log(`Initializing voice recognition for ${isMobile ? 'mobile' : 'desktop'}`);
      
      return recognition;
    } catch (error) {
      console.error('Failed to initialize speech recognition:', error);
      setError('Failed to initialize voice recognition');
      return null;
    }
  }, [isSupported]);

  const startListening = useCallback((options = {}) => {
    console.log('🎤 Start listening called', { isListening: isListeningRef.current, isSupported });
    
    if (!isSupported) {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setError(isMobile ? 
        'Voice recognition not available on this mobile browser. Try Chrome or Safari.' :
        'Voice recognition not supported in this browser.'
      );
      return;
    }

    // Prevent multiple starts
    if (isListeningRef.current) {
      console.log('Already listening, ignoring start request');
      return;
    }

    // Clean up previous recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      } catch (e) {
        console.log('Error cleaning up previous recognition:', e);
      }
    }

    // Initialize new recognition
    const recognition = initializeRecognition();
    if (!recognition) {
      setError('Could not initialize voice recognition');
      return;
    }

    recognitionRef.current = recognition;

    // Set up event handlers
    recognition.onstart = () => {
      console.log('✅ Voice recognition started');
      setIsListening(true);
      isListeningRef.current = true;
      setError(null);
    };

    recognition.onresult = (event) => {
      console.log('📝 Voice recognition result received');
      
      let interimTranscript = "";
      let finalText = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          finalText = transcript;
          console.log('✅ Final transcript:', finalText);
        } else {
          interimTranscript = transcript;
        }
      }

      setTranscript(interimTranscript || finalText);
      
      if (finalText) {
        setFinalTranscript(finalText);
      }
    };

    recognition.onerror = (event) => {
      console.error('❌ Voice recognition error:', event.error);
      
      // Handle common mobile errors gracefully
      if (event.error === 'no-speech') {
        console.log('No speech detected (this is normal)');
        setIsListening(false);
        isListeningRef.current = false;
        return;
      }

      if (event.error === 'aborted') {
        console.log('Recognition aborted (normal when stopping)');
        setIsListening(false);
        isListeningRef.current = false;
        return;
      }

      // Show meaningful errors to user
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      let errorMessage = '';
      switch (event.error) {
        case 'not-allowed':
        case 'service-not-allowed':
          errorMessage = isMobile ? 
            'Microphone access denied. Please enable microphone permissions in your browser settings.' :
            'Microphone access denied. Please allow microphone access.';
          break;
        case 'network':
          errorMessage = 'Network error. Please check your internet connection.';
          break;
        case 'audio-capture':
          errorMessage = isMobile ?
            'Microphone not available. Please check if another app is using it.' :
            'Microphone not available. Please check your microphone.';
          break;
        default:
          errorMessage = `Voice recognition error: ${event.error}`;
      }
      
      setError(errorMessage);
      setIsListening(false);
      isListeningRef.current = false;
    };

    recognition.onend = () => {
      console.log('🏁 Voice recognition ended');
      setIsListening(false);
      isListeningRef.current = false;
    };

    // Start recognition
    try {
      console.log('🚀 Starting speech recognition...');
      setTranscript('');
      setFinalTranscript('');
      setError(null);
      
      recognition.start();
    } catch (error) {
      console.error('❌ Failed to start recognition:', error);
      
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (error.name === 'InvalidStateError') {
        setError('Voice recognition is already running. Please wait and try again.');
      } else if (error.name === 'NotAllowedError') {
        setError(isMobile ? 
          'Microphone permission denied. Please enable microphone access in your browser settings.' :
          'Microphone access denied. Please allow microphone access.'
        );
      } else {
        setError('Failed to start voice recognition. Please try again.');
      }
      
      setIsListening(false);
      isListeningRef.current = false;
    }
  }, [isSupported, initializeRecognition]);

  const stopListening = useCallback(() => {
    console.log('🛑 Stop listening called');
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error('Error stopping recognition:', error);
      }
    }
    
    setIsListening(false);
    isListeningRef.current = false;
    setError(null);
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setFinalTranscript('');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.error('Error cleaning up recognition on unmount:', error);
        }
      }
    };
  }, []);

  return {
    isListening,
    transcript,
    finalTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript
  };
}
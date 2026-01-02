"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export function useVoiceRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [error, setError] = useState(null);
  const [isSupported, setIsSupported] = useState(true);
  const [persistentMode, setPersistentMode] = useState(false);
  const [isPaused, setIsPaused] = useState(false); // NEW: Track if paused by external code
  const persistentModeRef = useRef(false);
  const isPausedRef = useRef(false); // NEW: Ref for paused state
  const recognitionRef = useRef(null);
  const timeoutRef = useRef(null);
  const restartTimeoutRef = useRef(null);
  const lastCommandRecognizedRef = useRef(false); // NEW: Track if command was just recognized

  // Sync refs with state to avoid stale closures
  useEffect(() => {
    persistentModeRef.current = persistentMode;
  }, [persistentMode]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Create recognition instance only once
  useEffect(() => {
    // Enhanced browser support detection for mobile devices
    const checkSupport = () => {
      // Check for Speech Recognition API
      const hasSpeechRecognition = "webkitSpeechRecognition" in window || "SpeechRecognition" in window;
      
      if (!hasSpeechRecognition) {
        console.log('Speech Recognition API not supported');
        setIsSupported(false);
        return false;
      }

      // Mobile-specific checks
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isAndroid = /Android/.test(navigator.userAgent);
      
      // iOS Safari has limited support
      if (isIOS) {
        const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
        if (isSafari) {
          // iOS Safari 14.5+ has better support
          const safariVersion = navigator.userAgent.match(/Version\/(\d+)/);
          const version = safariVersion ? parseInt(safariVersion[1]) : 0;
          if (version < 14) {
            console.log('iOS Safari version too old for reliable speech recognition');
            setIsSupported(false);
            return false;
          }
        }
      }

      console.log(`Voice recognition supported on ${isMobile ? 'mobile' : 'desktop'} device`);
      return true;
    };

    if (!checkSupport()) {
      return;
    }

    // Create recognition instance with mobile optimizations
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    // Mobile-optimized settings
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    recognition.continuous = !isMobile; // Disable continuous on mobile for better reliability
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;
    
    // Mobile-specific optimizations
    if (isMobile) {
      // Shorter timeout for mobile to prevent connection issues
      recognition.grammars = new (window.SpeechGrammarList || window.webkitSpeechGrammarList)();
    }

    // Event handlers

    // Handle start event
    recognition.onstart = () => {
      console.log('Voice recognition started');
      setIsListening(true);
      setIsStopping(false);
      setError(null);
      
      // Clear any pending restart timeouts since we're now active
      if(restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = null;
      }
    }

    // Handle result event with mobile optimizations
    recognition.onresult = (event) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for(let i = event.resultIndex; i < event.results.length; i++){
        const result = event.results[i];
        const transcriptText = result[0].transcript;

        if(result.isFinal){
          finalTranscript += transcriptText;
        } else {
          interimTranscript += transcriptText;
        }
      }
      
      setTranscript(interimTranscript);
      
      // Only process final transcript if we have new content
      if(finalTranscript){
        // Set the final transcript WITHOUT accumulation to avoid duplicates
        setFinalTranscript(finalTranscript);
        setTranscript(finalTranscript);
        
        // NEW: Mark that a command was recognized
        lastCommandRecognizedRef.current = true;
        
        // Check if this is a stop command
        const command = finalTranscript.toLowerCase().trim();
        if (command.includes("stop voice") || command.includes("stop listening") || 
            command.includes("stop command") || command === "stop") {
          console.log('Stop command detected, disabling persistent mode');
          setPersistentMode(false);
          persistentModeRef.current = false;
          
          // Clear timeouts and stop recognition
          if(timeoutRef.current){
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          if(restartTimeoutRef.current){
            clearTimeout(restartTimeoutRef.current);
            restartTimeoutRef.current = null;
          }
          
          // Stop recognition if active
          if(recognitionRef.current && recognitionRef.current.state !== 'inactive'){
            recognitionRef.current.stop();
          }
          return; // Don't restart, let it stop naturally
        }
        
        // Mobile optimization: Stop immediately after getting result
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile || !recognition.continuous) {
          // On mobile or non-continuous mode, stop immediately after getting result
          if(recognitionRef.current && recognitionRef.current.state !== 'inactive'){
            recognitionRef.current.stop();
          }
        }
        
        // Clear final transcript immediately to prevent re-processing
        setTimeout(() => {
          setFinalTranscript("");
        }, 100);
      }

      // Reset timeout on speech - shorter timeout for mobile
      if(timeoutRef.current){
        clearTimeout(timeoutRef.current);
      }
      const timeoutDuration = isMobile ? 5000 : 8000; // 5s for mobile, 8s for desktop
      timeoutRef.current = setTimeout(() => {
        if(recognitionRef.current && recognitionRef.current.state !== 'inactive'){
          console.log('Speech timeout reached, stopping recognition');
          recognitionRef.current.stop();
        }
      }, timeoutDuration);
    }

    recognition.onerror = (event) => {
      console.log('Voice recognition error:', event.error);
      
      // Handle different types of errors with mobile-specific messaging
      if (event.error === 'no-speech') {
        // No speech detected - this is normal, don't show as error
        console.log('No speech detected, this is normal behavior');
        setIsListening(false);
        setIsStopping(false);
        return;
      }
      
      if (event.error === 'aborted') {
        // Recognition was aborted - this is normal when stopping
        console.log('Recognition aborted (normal when stopping)');
        setIsListening(false);
        setIsStopping(false);
        return;
      }
      
      // Mobile-specific error handling
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        const message = isMobile 
          ? 'Microphone access denied. Please enable microphone permissions in your browser settings and try again.'
          : 'Microphone access denied. Please allow microphone access and try again.';
        setError(message);
      } else if (event.error === 'network') {
        const message = isMobile
          ? 'Network error. Please check your mobile connection and try again.'
          : 'Network error occurred. Please check your internet connection.';
        setError(message);
      } else if (event.error === 'audio-capture') {
        const message = isMobile
          ? 'Microphone not available. Please check if another app is using the microphone.'
          : 'Audio capture failed. Please check your microphone.';
        setError(message);
      } else {
        setError(`Voice recognition error: ${event.error}`);
      }
      
      setIsListening(false);
      setIsStopping(false);
    }

    recognition.onend = () => {
      console.log('Voice recognition ended');
      setIsListening(false);
      setIsStopping(false);
      if(timeoutRef.current){
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      // Only restart if in persistent mode AND a command was just recognized AND not paused
      if (persistentModeRef.current && lastCommandRecognizedRef.current && !isPausedRef.current) {
        // Reset the command flag
        lastCommandRecognizedRef.current = false;
        
        if(restartTimeoutRef.current) {
          clearTimeout(restartTimeoutRef.current);
        }
        restartTimeoutRef.current = setTimeout(() => {
          const currentPersistentMode = persistentModeRef.current;
          const currentIsPaused = isPausedRef.current;
          // Only restart if persistent mode still active and not paused
          if (currentPersistentMode && !currentIsPaused && recognitionRef.current && 
              (!recognitionRef.current.state || recognitionRef.current.state === 'inactive')) {
            try {
              console.log('Auto-restarting voice recognition after command...');
              recognitionRef.current.start();
            } catch (error) {
              console.log('Recognition auto-restart failed:', error);
              setPersistentMode(false);
              persistentModeRef.current = false;
            }
          }
        }, 500); // Shorter delay for faster restart after command
      } else if (persistentModeRef.current && !lastCommandRecognizedRef.current && !isPausedRef.current) {
        // If in persistent mode but no command recognized (likely no-speech), restart faster
        console.log('No speech detected, restarting in persistent mode...');
        if(restartTimeoutRef.current) {
          clearTimeout(restartTimeoutRef.current);
        }
        restartTimeoutRef.current = setTimeout(() => {
          const currentPersistentMode = persistentModeRef.current;
          const currentIsPaused = isPausedRef.current;
          if (currentPersistentMode && !currentIsPaused && recognitionRef.current && 
              (!recognitionRef.current.state || recognitionRef.current.state === 'inactive')) {
            try {
              recognitionRef.current.start();
            } catch (error) {
              console.log('Recognition restart failed:', error);
            }
          }
        }, 1500); // Longer delay to reduce rapid cycling
      }
    }

    recognitionRef.current = recognition;

    return () => {
      if(timeoutRef.current){
        clearTimeout(timeoutRef.current);
      }
      if(restartTimeoutRef.current){
        clearTimeout(restartTimeoutRef.current);
      }
      if(recognition){
        recognition.onstart = null;
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onend = null;
        try {
          recognition.stop();
        } catch (error) {
          console.error('Error cleaning up recognition:', error);
        }
      }
    }
  }, []); // Only create recognition instance once - using refs to avoid dependency issues

  const startListening = useCallback((options = {}) => {
    if(!isSupported || !recognitionRef.current) {
      console.log('Cannot start - not supported or no recognition instance');
      
      // Mobile-specific error messages
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const errorMessage = isMobile 
        ? "Voice recognition is not supported on this mobile browser. Please try Chrome or Safari."
        : "Voice recognition is not supported in this browser. Please use Chrome, Safari, or Edge.";
      setError(errorMessage);
      return;
    }

    // Set persistent mode if specified
    if (options.persistent) {
      setPersistentMode(true);
      persistentModeRef.current = true;
    }

    // Reset states
    setTranscript("");
    setFinalTranscript("");
    setError(null);
    setIsStopping(false); // Ensure stopping state is reset

    // Mobile-specific optimizations
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      // Force mobile-friendly settings
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.maxAlternatives = 1;
      
      // Add mobile-specific audio constraints if available
      if (recognitionRef.current.grammars && recognitionRef.current.grammars.addFromString) {
        try {
          // Add common cooking commands for better recognition
          recognitionRef.current.grammars.addFromString('#JSGF V1.0; grammar commands; public <command> = next | previous | stop | pause | resume | start timer | repeat;', 1);
        } catch (e) {
          console.log('Grammar not supported, continuing without');
        }
      }
    }

    // Start recognition
    try {
      console.log('Starting voice recognition...' + (isMobile ? ' (mobile mode)' : ''));
      recognitionRef.current.start();
    } catch (error) {
      console.error('Failed to start voice recognition:', error);
      
      // Mobile-specific error handling
      if (isMobile) {
        if (error.name === 'NotAllowedError') {
          setError("Microphone permission denied. Please enable microphone access in your browser settings and try again.");
        } else if (error.name === 'NotSupportedError') {
          setError("Voice recognition not supported on this mobile browser. Please try Chrome or Safari.");
        } else if (error.name === 'ServiceNotAllowedError') {
          setError("Voice recognition service not available. Please check your internet connection.");
        } else {
          setError("Voice recognition failed to start. Please check your microphone permissions and try again.");
        }
      } else {
        setError("Failed to start voice recognition.");
      }
      
      setIsListening(false);
    }
  }, [isSupported]); 

  // Stop listening
  const stopListening = useCallback(() => {
    console.log('Stop listening called');
    if(recognitionRef.current){
      try {
        // Disable persistent mode FIRST
        setPersistentMode(false);
        persistentModeRef.current = false;
        
        // Provide immediate UI feedback
        setIsStopping(true);
        
        // Clear any pending timeouts
        if(timeoutRef.current){
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        if(restartTimeoutRef.current){
          clearTimeout(restartTimeoutRef.current);
          restartTimeoutRef.current = null;
        }
        
        // Stop the recognition
        if(recognitionRef.current.state !== 'inactive') {
          recognitionRef.current.stop();
        } else {
          // If already inactive, update states immediately
          setIsListening(false);
          setIsStopping(false);
        }
        
        // Force cleanup after a short delay if recognition doesn't end naturally
        setTimeout(() => {
          setIsStopping(false);
          setIsListening(false);
        }, 800); // Increased timeout for better reliability
        
      } catch (error) {
        console.error('Error stopping recognition:', error);
        setIsListening(false);
        setIsStopping(false);
        setPersistentMode(false);
        persistentModeRef.current = false;
      }
    } else {
      // No recognition instance, just reset states
      setIsListening(false);
      setIsStopping(false);
      setPersistentMode(false);
      persistentModeRef.current = false;
    }
  }, [])

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setFinalTranscript("");
  }, []);

  // NEW: Pause voice recognition temporarily (e.g., while TTS audio is playing)
  const pauseListening = useCallback(() => {
    console.log('Pausing voice recognition...');
    setIsPaused(true);
    isPausedRef.current = true;
    if(recognitionRef.current && recognitionRef.current.state !== 'inactive') {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.log('Error pausing recognition:', error);
      }
    }
  }, []);

  // NEW: Resume voice recognition after pause
  const resumeListening = useCallback(() => {
    console.log('Resuming voice recognition...');
    setIsPaused(false);
    isPausedRef.current = false;
    if(recognitionRef.current && persistentModeRef.current) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.log('Error resuming recognition:', error);
      }
    }
  }, []);

  return {
    isListening: isListening || isStopping,
    isStopping,
    transcript,
    finalTranscript,
    error,
    isSupported,
    persistentMode,
    isPaused, // NEW: Export pause state
    startListening,
    stopListening,
    resetTranscript,
    pauseListening, // NEW: Export pause function
    resumeListening, // NEW: Export resume function
  }
}
"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export function useVoiceRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [isStopping, setIsStopping] = useState(false); // New state for immediate UI feedback
  const [transcript, setTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [error, setError] = useState(null);
  const [isSupported, setIsSupported] = useState(true);
  const [persistentMode, setPersistentMode] = useState(false); // New: persistent listening mode
  const persistentModeRef = useRef(false); // Ref to avoid stale closures
  const recognitionRef = useRef(null);
  const timeoutRef = useRef(null);
  const restartTimeoutRef = useRef(null);

  // Sync ref with state to avoid stale closures
  useEffect(() => {
    persistentModeRef.current = persistentMode;
  }, [persistentMode]);

  // Create recognition instance only once
  useEffect(() => {
    // Check for browser support
    if(!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      setIsSupported(false);
      return;
    }

    // Create recognition instance only once
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

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

    // Handle result event
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
        
        // Stop recognition immediately after getting final result to prevent duplicates
        if(recognitionRef.current && recognitionRef.current.state !== 'inactive'){
          recognitionRef.current.stop();
        }
        
        // Clear final transcript immediately to prevent re-processing
        setTimeout(() => {
          setFinalTranscript("");
        }, 100);
      }

      // Reset timeout on speech
      if(timeoutRef.current){
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        if(recognitionRef.current && recognitionRef.current.state !== 'inactive'){
          console.log('Speech timeout reached, stopping recognition');
          recognitionRef.current.stop();
        }
      }, 8000); // Increased to 8 seconds to reduce no-speech errors
    }

    recognition.onerror = (event) => {
      console.log('Voice recognition error:', event.error);
      
      // Handle different types of errors
      if (event.error === 'no-speech') {
        // No speech detected - this is normal, don't show as error
        console.log('No speech detected, this is normal behavior');
        // Just let it restart naturally, don't set error state
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
      
      // Only show error for actual problems
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setError('Microphone access denied. Please allow microphone access and try again.');
      } else if (event.error === 'network') {
        setError('Network error occurred. Please check your internet connection.');
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
      
      // Only restart if in persistent mode and recognition isn't already running
      if (persistentModeRef.current) {
        if(restartTimeoutRef.current) {
          clearTimeout(restartTimeoutRef.current);
        }
        restartTimeoutRef.current = setTimeout(() => {
          // Use ref to get current persistent mode value (avoids stale closure)
          const currentPersistentMode = persistentModeRef.current;
          // Check if recognition is not already running and persistent mode is still active
          if (currentPersistentMode && recognitionRef.current && 
              (!recognitionRef.current.state || recognitionRef.current.state === 'inactive')) {
            try {
              console.log('Auto-restarting voice recognition...');
              recognitionRef.current.start();
            } catch (error) {
              console.log('Recognition auto-restart failed:', error);
              // If restart fails, disable persistent mode
              setPersistentMode(false);
              persistentModeRef.current = false;
            }
          }
        }, 2500); // Longer delay to prevent rapid cycling and reduce duplicates
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

    // Start recognition
    try {
      console.log('Starting voice recognition...');
      recognitionRef.current.start();
    } catch (error) {
      console.error('Failed to start voice recognition:', error);
      setError("Failed to start voice recognition.");
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

  return {
    isListening: isListening || isStopping, // Show as "listening" while stopping for better UX
    isStopping,
    transcript,
    finalTranscript,
    error,
    isSupported,
    persistentMode,
    startListening,
    stopListening,
    resetTranscript,
  }
}
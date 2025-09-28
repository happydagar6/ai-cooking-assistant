"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export function useVoiceRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [isStopping, setIsStopping] = useState(false); // New state for immediate UI feedback
  const [transcript, setTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [error, setError] = useState(null);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef(null);
  const timeoutRef = useRef(null);

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
      setIsListening(true);
      setIsStopping(false);
      setError(null);
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
      if(finalTranscript){
        setFinalTranscript(prev => prev + finalTranscript);
        setTranscript(prev => prev + finalTranscript);
      }

      // Reset timeout on speech
      if(timeoutRef.current){
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        if(recognitionRef.current && recognitionRef.current.state !== 'inactive'){
          recognitionRef.current.stop();
        }
      }, 6000); // Increased to 6 seconds for longer commands
    }

    recognition.onerror = (event) => {
      setError(event.error);
      setIsListening(false);
      setIsStopping(false);
    }

    recognition.onend = () => {
      setIsListening(false);
      setIsStopping(false);
      if(timeoutRef.current){
        clearTimeout(timeoutRef.current);
      }
    }

    recognitionRef.current = recognition;

    return () => {
      if(timeoutRef.current){
        clearTimeout(timeoutRef.current);
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
  }, []); // Remove isListening dependency - create instance only once

  const startListening = useCallback(() => {
    if(!isSupported || !recognitionRef.current) return; // if not supported or not initialized, do nothing

    // Reset states
    setTranscript("");
    setFinalTranscript("");
    setError(null);


    // Start recognition
    try {
      recognitionRef.current.start();
    } catch (error) {
      setError("Failed to start voice recognition.");
    }
  }, [isSupported]); 

  // Stop listening
  const stopListening = useCallback(() => {
    if(recognitionRef.current){
      try {
        // Provide immediate UI feedback
        setIsStopping(true);
        setIsListening(false);
        
        // Clear any pending timeouts
        if(timeoutRef.current){
          clearTimeout(timeoutRef.current);
        }
        
        // Stop the recognition
        recognitionRef.current.stop();
        
        // Force cleanup after a short delay if recognition doesn't end naturally
        setTimeout(() => {
          setIsStopping(false);
        }, 500);
        
      } catch (error) {
        console.error('Error stopping recognition:', error);
        setIsListening(false);
        setIsStopping(false);
      }
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
    startListening,
    stopListening,
    resetTranscript,
  }
}
"use client"

import { useCallback, useRef, useState } from "react"

export function useOpenAITextToSpeech() {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const audioRef = useRef(null);

    // Function to call OpenAI TTS API and play audio
    const speak = useCallback(async (text, options = {}) => {
        if(!text.trim() || isSpeaking) return;

        setIsLoading(true);
        setError(null);

        // Call OpenAI TTS API
        try {
            const response = await fetch("/api/speech", {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text,
                    voice: options.voice || 'nova',
                    speed: options.speed || 1.0
                 }),
            })

            if(!response.ok){
                throw new Error("Failed to generate speech");
            }

            // Get audio blob and create URL
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            
            // Play audio
            if(audioRef.current){
                audioRef.current.pause();
            }

            // Create new audio element. Why ? : Because we need a fresh audio element to play the new audio
            const audio = new Audio(audioUrl);
            audioRef.current = audio;

            // Set up event handlers

            // Handle audio load start
            audio.onloadstart = () => {
                console.log('Audio loadstart event fired')
                setIsLoading(false);
                setIsSpeaking(true);
            }

            // Handle audio can play
            audio.oncanplay = () => {
                console.log('Audio canplay event fired')
            }

            // Handle audio play start
            audio.onplay = () => {
                console.log('Audio play event fired')
                if(options.onStart) options.onStart();
            }

            // Handle audio end
            audio.onended = () => {
                console.log('Audio ended event fired')
                setIsSpeaking(false);
                URL.revokeObjectURL(audioUrl);
                if(options.onEnd) options.onEnd();
            }

            // Handle audio error
            audio.onerror = (e) => {
                console.log('Audio error event fired:', e)
                setError("Failed to play audio");
                setIsSpeaking(false);
                setIsLoading(false);
                URL.revokeObjectURL(audioUrl);
            }
            
            console.log('About to play audio, blob size:', audioBlob.size, 'bytes')
            await audio.play();
            console.log('Audio.play() completed')
        } catch (error) {
            setError("Failed to generate speech");
            setIsLoading(false);
            setIsSpeaking(false);
        }
    }, [isSpeaking])


    /* Stop speaking. Why ? : To allow user to stop speech mid-way. Why useCallback ? : To avoid re-creating function on every 
    render, why not useMemo ? : Because we don't have dependencies that need memoization. What is memoization ? : Storing the 
    result of an expensive function call and returning the cached result when the same inputs occur again. */
    
    const stop = useCallback(() => {
        if(audioRef.current){
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            setIsSpeaking(false);
        }
    }, []);

    const speakRecipeStep = useCallback(async (stepData, options = {}) => {
    const text = `Step ${stepData.step}: ${stepData.title}. ${stepData.description}. ${stepData.tips ? `Tip: ${stepData.tips}` : ''}`
    await speak(text, options)
  }, [speak]);

  const speakTimer = useCallback(async (message, options = {}) => {
    await speak(message, options)
  }, [speak]);

  return {
    speak,
    speakRecipeStep,
    speakTimer,
    stop,
    isSpeaking,
    isLoading,
    error,
    isSupported: true // TTS is supported when this hook is available
  }
};
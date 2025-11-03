"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mic, MicOff, AlertCircle } from "lucide-react"

export function SimpleVoiceTest() {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [error, setError] = useState("")
  const [recognitionRef, setRecognitionRef] = useState(null)

  const testVoiceRecognition = () => {
    // Check if speech recognition is available
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      setError('Speech recognition not supported in this browser')
      return
    }

    if (isListening) {
      // Stop listening
      if (recognitionRef) {
        recognitionRef.stop()
      }
      return
    }

    // Start listening
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    
    // Simple settings for maximum compatibility
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-US'
    
    recognition.onstart = () => {
      console.log('🎤 Voice recognition started')
      setIsListening(true)
      setError('')
      setTranscript('Listening...')
    }
    
    recognition.onresult = (event) => {
      console.log('📝 Got voice result:', event.results)
      let transcript = ''
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript
      }
      
      setTranscript(transcript)
      console.log('Transcript:', transcript)
    }
    
    recognition.onerror = (event) => {
      console.error('❌ Voice recognition error:', event.error)
      setError(`Error: ${event.error}`)
      setIsListening(false)
    }
    
    recognition.onend = () => {
      console.log('🏁 Voice recognition ended')
      setIsListening(false)
    }
    
    try {
      recognition.start()
      setRecognitionRef(recognition)
    } catch (error) {
      console.error('Failed to start:', error)
      setError(`Failed to start: ${error.message}`)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5" />
          Simple Voice Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={testVoiceRecognition}
          className={`w-full ${isListening ? 'bg-red-500 hover:bg-red-600' : ''}`}
          size="lg"
        >
          {isListening ? (
            <>
              <MicOff className="h-4 w-4 mr-2 animate-pulse" />
              Stop Listening
            </>
          ) : (
            <>
              <Mic className="h-4 w-4 mr-2" />
              Start Voice Test
            </>
          )}
        </Button>
        
        {transcript && (
          <div className="p-3 bg-gray-100 rounded-lg">
            <p className="text-sm font-medium">Transcript:</p>
            <p className="text-sm">{transcript}</p>
          </div>
        )}
        
        {error && (
          <div className="p-3 bg-red-100 text-red-700 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Ensure microphone permissions are granted</p>
          <p>• Make sure you're on HTTPS</p>
          <p>• Try Chrome or Safari browsers</p>
          <p>• Speak clearly after clicking start</p>
        </div>
      </CardContent>
    </Card>
  )
}
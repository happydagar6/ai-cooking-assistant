"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mic, MicOff, AlertCircle, CheckCircle, Smartphone } from "lucide-react"

export function MobileVoiceDebug({ onClose }) {
  const [debugInfo, setDebugInfo] = useState(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Only show on mobile and in development
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    const isDev = process.env.NODE_ENV === 'development'
    
    if (isMobile && isDev) {
      setIsVisible(true)
      collectDebugInfo()
    }
  }, [])

  const collectDebugInfo = () => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    const hasWebkitSpeechRecognition = 'webkitSpeechRecognition' in window
    const hasSpeechRecognition = 'SpeechRecognition' in window
    
    // Test if we can create a recognition instance
    let canCreateRecognition = false
    let recognitionError = null
    
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        canCreateRecognition = true
      }
    } catch (error) {
      recognitionError = error.message
    }

    setDebugInfo({
      isMobile,
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      hasWebkitSpeechRecognition,
      hasSpeechRecognition,
      canCreateRecognition,
      recognitionError,
      isHTTPS: location.protocol === 'https:',
      timestamp: new Date().toLocaleTimeString()
    })
  }

  const testVoiceRecognition = async () => {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (!SpeechRecognition) {
        alert('Speech Recognition not available')
        return
      }

      const recognition = new SpeechRecognition()
      
      // Mobile-optimized settings
      recognition.continuous = false
      recognition.interimResults = true
      recognition.maxAlternatives = 1
      recognition.lang = 'en-US'

      recognition.onstart = () => {
        console.log('✅ Voice recognition started successfully')
        alert('Voice recognition started! Say something...')
      }

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        console.log('✅ Voice recognition result:', transcript)
        alert(`Heard: "${transcript}"`)
        recognition.stop()
      }

      recognition.onerror = (event) => {
        console.error('❌ Voice recognition error:', event.error)
        alert(`Voice recognition error: ${event.error}`)
      }

      recognition.onend = () => {
        console.log('🏁 Voice recognition ended')
      }

      recognition.start()

    } catch (error) {
      console.error('❌ Failed to test voice recognition:', error)
      alert(`Test failed: ${error.message}`)
    }
  }

  if (!isVisible || !debugInfo) {
    return null
  }

  return (
    <Card className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto bg-white/95 backdrop-blur border-2 border-blue-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Smartphone className="h-4 w-4" />
          Mobile Voice Debug
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsVisible(false)}
            className="ml-auto p-1 h-6 w-6"
          >
            ×
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        <div className="flex items-center gap-2">
          {debugInfo.isMobile ? (
            <CheckCircle className="h-3 w-3 text-green-600" />
          ) : (
            <AlertCircle className="h-3 w-3 text-red-600" />
          )}
          <span>Mobile Device: {debugInfo.isMobile ? 'YES' : 'NO'}</span>
        </div>

        <div className="flex items-center gap-2">
          {debugInfo.hasWebkitSpeechRecognition || debugInfo.hasSpeechRecognition ? (
            <CheckCircle className="h-3 w-3 text-green-600" />
          ) : (
            <AlertCircle className="h-3 w-3 text-red-600" />
          )}
          <span>Speech API: {debugInfo.hasWebkitSpeechRecognition || debugInfo.hasSpeechRecognition ? 'Available' : 'Not Available'}</span>
        </div>

        <div className="flex items-center gap-2">
          {debugInfo.canCreateRecognition ? (
            <CheckCircle className="h-3 w-3 text-green-600" />
          ) : (
            <AlertCircle className="h-3 w-3 text-red-600" />
          )}
          <span>Recognition: {debugInfo.canCreateRecognition ? 'Can Create' : 'Cannot Create'}</span>
        </div>

        <div className="flex items-center gap-2">
          {debugInfo.isHTTPS ? (
            <CheckCircle className="h-3 w-3 text-green-600" />
          ) : (
            <AlertCircle className="h-3 w-3 text-red-600" />
          )}
          <span>HTTPS: {debugInfo.isHTTPS ? 'YES' : 'NO'}</span>
        </div>

        {debugInfo.recognitionError && (
          <div className="text-red-600 text-xs">
            Error: {debugInfo.recognitionError}
          </div>
        )}

        <div className="pt-2 border-t">
          <Badge variant="secondary" className="text-xs mb-2">
            {debugInfo.userAgent.includes('Chrome') ? 'Chrome' :
             debugInfo.userAgent.includes('Safari') ? 'Safari' :
             debugInfo.userAgent.includes('Edge') ? 'Edge' : 'Other Browser'}
          </Badge>
        </div>

        <Button 
          size="sm" 
          onClick={testVoiceRecognition}
          className="w-full text-xs h-8"
          disabled={!debugInfo.canCreateRecognition}
        >
          <Mic className="h-3 w-3 mr-1" />
          Test Voice Recognition
        </Button>

        <div className="text-xs text-gray-500 text-center">
          Updated: {debugInfo.timestamp}
        </div>
      </CardContent>
    </Card>
  )
}
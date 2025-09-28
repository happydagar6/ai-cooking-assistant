"use client"

import { Button } from "@/components/ui/button"
import { Mic, MicOff, AlertCircle } from "lucide-react"
import { useVoiceRecognition } from "@/hooks/use-voice-recognition"
import { useEffect } from "react"

export function VoiceInputButton({ onTranscript, onError, disabled = false, size = "default", variant = "outline" }) {
  const { isListening, isStopping, transcript, finalTranscript, error, isSupported, startListening, stopListening, resetTranscript } =
    useVoiceRecognition();


  // Handle transcript updates. Why useEffect instead of directly calling onTranscript in the hook?
  // Because we want to ensure that the parent component only gets the final transcript once it's finalized,
  // and not on every interim update. This avoids excessive re-renders and ensures cleaner data flow.

  // Why useEffect instead of useCallback?
  // useCallback is typically used to memoize functions to prevent unnecessary re-creations on re-renders.
  // Here, we are reacting to changes in finalTranscript and error states, so useEffect is more appropriate.

  useEffect(() => {
    if (finalTranscript && onTranscript) {
      onTranscript(finalTranscript)
      resetTranscript()
    }
  }, [finalTranscript, onTranscript, resetTranscript])


  // Handle error updates. Why 2 dependencies?
  // We include both error and onError in the dependency array to ensure that the effect runs
  // whenever there is a new error or if the onError callback function changes.
  // This guarantees that the latest error is always communicated to the parent component.
  useEffect(() => {
    if (error && onError) {
      onError(error)
    }
  }, [error, onError])


  // Handle button click
  const handleClick = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening({
        continuous: true,
        interimResults: true,
        lang: "en-US",
      })
    }
  }


  // Don't render if voice not supported
  if (!isSupported) {
    return (
      <Button variant="outline" disabled size={size} className="gap-2 bg-transparent">
        <AlertCircle className="h-4 w-4" />
        Voice Not Supported
      </Button>
    )
  }

  return (
    <Button
      onClick={handleClick}
      disabled={disabled}
      variant={variant}
      size={size}
      className={`gap-2 ${isListening ? "bg-red-50 border-red-200 text-red-700 hover:bg-red-100" : ""}`}
    >
      {isListening ? (
        <>
          <MicOff className="h-4 w-4 animate-pulse" />
          {isStopping ? "Stopping..." : "Stop Listening"}
        </>
      ) : (
        <>
          <Mic className="h-4 w-4" />
          Use Voice
        </>
      )}
    </Button>
  )
}

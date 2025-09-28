"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { VoiceInputButton } from "./voice-input-button"
import { Search, Loader2 } from "lucide-react"


// VoiceSearchInput component with voice input and search button
export function VoiceSearchInput({ onSearch, placeholder, isLoading = false }) {
  const [query, setQuery] = useState("")

  // Handle search button click
  const handleSearch = () => {
    if (query.trim() && onSearch) {
      onSearch(query.trim())
    }
  }

  // Handle voice transcript
  const handleVoiceTranscript = (transcript) => {
    setQuery(transcript)
    if (onSearch) {
      onSearch(transcript)
    }
  }

  // Handle Enter key press in input field
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  return (
    <div className="flex gap-2">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          className="pl-10 h-12"
        />
      </div>
      <Button onClick={handleSearch} disabled={isLoading || !query.trim()} size="lg">
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
      </Button>
      <VoiceInputButton
        onTranscript={handleVoiceTranscript}
        onError={(error) => console.error("Voice error:", error)}
        disabled={isLoading}
        size="lg"
      />
    </div>
  )
}

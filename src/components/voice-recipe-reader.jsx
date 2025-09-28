"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Volume2, VolumeX, Play, Pause, RotateCcw } from "lucide-react"
import { useState } from "react"
import { useOpenAITextToSpeech } from "@/hooks/use-openai-speech"

export function VoiceRecipeReader({ recipe, currentStep, className = "" }) {
  const [isEnabled, setIsEnabled] = useState(true)
  const { isSpeaking, isPaused, isSupported, speak, stop, pause, resume, speakRecipeStep } =
    useOpenAITextToSpeech()

  
  // Read the current step of the recipe
  const handleReadStep = () => {
    if (recipe && recipe.instructions && recipe.instructions[currentStep]) {
      speakRecipeStep(recipe.instructions[currentStep])
    }
  }


  // Read out the ingredients of the recipe
  const handleReadIngredients = () => {
    if (recipe && recipe.ingredients) {
      // Format ingredients properly, handling both string and object formats
      const ingredientsText = recipe.ingredients.map(ingredient => 
        typeof ingredient === 'string' 
          ? ingredient 
          : `${ingredient.amount || ''} ${ingredient.unit || ''} ${ingredient.name || ''}`.trim()
      ).join(", ");
      
      const text = `You will need the following ingredients: ${ingredientsText}`;
      speak(text);
    }
  }


  // Read out a brief overview of the recipe
  const handleReadRecipeOverview = () => {
    if (recipe) {
      const text = `Recipe: ${recipe.title}. ${recipe.description}. This recipe takes ${recipe.prepTime + recipe.cookTime} minutes total and serves ${recipe.servings} people.`
      speak(text)
    }
  }


  // Don't render if voice not supported
  if (!isSupported) {
    return null
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Volume2 className="h-5 w-5" />
            Voice Assistant
          </CardTitle>
          <Button onClick={() => setIsEnabled(!isEnabled)} size="sm" variant="ghost">
            {isEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent>

        {isEnabled ? (
          <div className="space-y-3">

            {/* Current Status */}
            {isSpeaking && (
              <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  <span className="text-sm font-medium">{isPaused ? "Paused" : "Speaking..."}</span>
                </div>

                <div className="flex gap-1">
                  {!isPaused ? (
                    <Button onClick={pause} size="sm" variant="ghost">
                      <Pause className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button onClick={resume} size="sm" variant="ghost">
                      <Play className="h-4 w-4" />
                    </Button>
                  )}
                  <Button onClick={stop} size="sm" variant="ghost">
                    <VolumeX className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}


            {/* Voice Actions */}
            <div className="grid grid-cols-1 gap-2">
              <Button
                onClick={handleReadStep}
                variant="outline"
                size="sm"
                disabled={isSpeaking}
                className="justify-start bg-transparent"
              >
                <Play className="h-4 w-4 mr-2" />
                Read Current Step
              </Button>

              <Button
                onClick={handleReadIngredients}
                variant="outline"
                size="sm"
                disabled={isSpeaking}
                className="justify-start bg-transparent"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Read Ingredients
              </Button>

              <Button
                onClick={handleReadRecipeOverview}
                variant="outline"
                size="sm"
                disabled={isSpeaking}
                className="justify-start bg-transparent"
              >
                <Volume2 className="h-4 w-4 mr-2" />
                Recipe Overview
              </Button>
            </div>

            <div className="text-xs text-muted-foreground text-center pt-2 border-t">
              Voice commands: "next", "previous", "repeat", "ingredients"
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <VolumeX className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Voice assistant disabled</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

"use client"


import { useCookingSession } from "@/hooks/use-cooking-session";
import { FavoriteButton } from "@/components/favorite-button";
import { useTouchGestures } from "@/hooks/use-touch-gestures";
import { PullToRefreshIndicator } from "@/components/pull-to-refresh";
import { SwipeFeedback } from "@/components/swipe-feedback";
import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  ChefHat,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Timer,
  Volume2,
  VolumeX,
  Clock,
  Users,
  CheckCircle,
  Circle,
  Calculator,
  Loader2,
  ArrowLeft,
  Square,
} from "lucide-react"
import { VoiceInputButton } from "@/components/voice-input-button"
import { VoiceRecipeReader } from "@/components/voice-recipe-reader"
import { BackNavigation } from "@/components/back-navigation"
import { RecipeScalingCalculator } from "@/components/recipe-scaling-calculator"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useOpenAITextToSpeech } from "@/hooks/use-openai-speech"
import { showToast } from "@/lib/toast"

export default function CookingModePage() {
   const params = useParams()
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [timer, setTimer] = useState(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [isTimerActive, setIsTimerActive] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [completedSteps, setCompletedSteps] = useState(new Set())
  const [showScalingCalculator, setShowScalingCalculator] = useState(false)
  const [scaledRecipe, setScaledRecipe] = useState(null)
  // New state for recipe data
  const [recipe, setRecipe] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const timerRef = useRef(null)

  const { speak, speakRecipeStep, speakTimer, stop, isSpeaking, isLoading: ttsLoading, error: ttsError, isSupported: ttsSupported } = useOpenAITextToSpeech()

  // Fetch recipe data on component mount
  useEffect(() => {
    const fetchRecipe = async () => {
      if (!params?.id) {
        setError("Recipe ID not provided")
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)
        
        const response = await fetch(`/api/recipes/${params.id}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Recipe not found or access denied")
          } else if (response.status === 401) {
            throw new Error("Please log in to view this recipe")
          }
          throw new Error("Failed to fetch recipe")
        }
        
        const data = await response.json()
        
        if (!data.recipe) {
          throw new Error("Invalid recipe data received")
        }
        
        setRecipe(data.recipe)
        
      } catch (err) {
        setError(err.message)
        showToast.error("Error", err.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRecipe()
  }, [params?.id])

  // Memoize baseRecipe early to prevent initialization issues
  const baseRecipe = useMemo(() => {
    if (!recipe) return null
    
    return {
      id: recipe.id,
      title: recipe.title || "Untitled Recipe",
      description: recipe.description || "",
      prepTime: recipe.prep_time || 0,
      cookTime: recipe.cook_time || 0,
      totalTime: recipe.total_time || (recipe.prep_time + recipe.cook_time) || 0,
      servings: recipe.servings || 1,
      difficulty: recipe.difficulty || "medium",
      ingredients: recipe.ingredients || [],
      instructions: recipe.instructions || [],
    }
  }, [recipe])

  // Cooking session tracking - initialize early
  const {
    session,
    isSessionActive,
    elapsedTime,
    formattedElapsedTime,
    startSession,
    endSession,
    trackFeature
  } = useCookingSession(baseRecipe)

  // Handle TTS errors
  useEffect(() => {
    if (ttsError) {
      showToast.error("Speech Error", ttsError)
    }
  }, [ttsError])

  // Timer functionality
  useEffect(() => {
    if (isTimerActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsTimerActive(false)
            if (!isMuted && ttsSupported) {
              speakTimer("Timer finished! Your cooking step is complete.")
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      clearInterval(timerRef.current)
    }

    return () => clearInterval(timerRef.current)
  }, [isTimerActive, timeLeft, isMuted, ttsSupported, speakTimer])

  // Handle scaled recipe changes
  const handleScaledRecipeChange = useCallback((newScaledRecipe) => {
    setScaledRecipe(newScaledRecipe);
    trackFeature('Recipe Scaling', { 
      original_servings: recipe?.servings,
      scaled_servings: newScaledRecipe?.servings 
    });
    showToast.success("Recipe Scaled", `Recipe scaled to ${newScaledRecipe.servings} servings`)
  }, [recipe?.servings, trackFeature]) // Add dependencies

  // Session management functions
  const handleStartCooking = async () => {
    if (!isSessionActive) {
      await startSession()
      showToast.success("Cooking session started! 🍳", "Track your cooking progress")
    }
  }

  const handleFinishCooking = async () => {
    if (isSessionActive) {
      const stepsCompleted = completedSteps.size
      await endSession(stepsCompleted)
      showToast.success("Cooking session completed! Great job! 🎉", "Your session has been recorded")
    }
  }

  // Add haptic feedback (if supported)
  const triggerHapticFeedback = useCallback((type = 'impact') => {
    if ('vibrate' in navigator) {
      switch (type) {
        case 'light':
          navigator.vibrate(10)
          break
        case 'medium':
          navigator.vibrate(20)
          break
        case 'heavy':
          navigator.vibrate(50)
          break
        default:
          navigator.vibrate(15)
      }
    }
  }, [])

  // Touch gesture controls
  const {
    gestureHandlers,
    isPulling,
    pullDistance,
    isRefreshing,
    pullProgress,
  } = useTouchGestures({
    onSwipeLeft: (e, details) => {
      // Next step on swipe left
      const currentActiveRecipe = scaledRecipe || baseRecipe
      if (currentStep < (currentActiveRecipe?.instructions?.length || 1) - 1) {
        triggerHapticFeedback('light')
        nextStep()
        trackFeature('Swipe Navigation', { direction: 'left', method: 'gesture' })
        window.showSwipeFeedback?.('swipe-left', 'Next Step')
      }
    },
    onSwipeRight: (e, details) => {
      // Previous step on swipe right
      if (currentStep > 0) {
        triggerHapticFeedback('light')
        prevStep()
        trackFeature('Swipe Navigation', { direction: 'right', method: 'gesture' })
        window.showSwipeFeedback?.('swipe-right', 'Previous Step')
      }
    },
    onPullToRefresh: async () => {
      // Refresh the recipe data
      try {
        const response = await fetch(`/api/recipes/${params.id}`)
        if (response.ok) {
          const data = await response.json()
          if (data.recipe) {
            setRecipe(data.recipe)
            showToast.success("Recipe Refreshed", "Recipe data updated")
          }
        }
      } catch (error) {
        showToast.error("Refresh Failed", "Could not refresh recipe")
      }
    },
    threshold: 80, // Adjust sensitivity
    enabled: !isLoading && !error && baseRecipe, // Only enable when recipe is loaded
  })

  // Get current recipe (scaled or base)
  const currentRecipe = scaledRecipe || baseRecipe
  
  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading recipe...</p>
        </div>
      </div>
    )
  }
  
  // Error state
  if (error || !recipe) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 mb-4">
            <ChefHat className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h2 className="text-xl font-semibold mb-2">Recipe Not Available</h2>
            <p className="text-gray-600 mb-4">
              {error || "Unable to load recipe data"}
            </p>
          </div>
          <Link href="/dashboard">
            <Button>
              ← Back to My Recipes
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // Use scaled recipe if available, otherwise use base recipe
  const activeRecipe = scaledRecipe || baseRecipe

  const startTimer = (seconds) => {
    setTimeLeft(seconds)
    setIsTimerActive(true)
    setTimer(seconds)

    // Track feature usage
    trackFeature('Timer', { action: 'start', duration_seconds: seconds })

    if (!isMuted && ttsSupported) {
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60
      let timeText = ""
      if (minutes > 0) {
        timeText = `${minutes} minute${minutes > 1 ? "s" : ""}`
        if (remainingSeconds > 0) {
          timeText += ` and ${remainingSeconds} second${remainingSeconds > 1 ? "s" : ""}`
        }
      } else {
        timeText = `${remainingSeconds} second${remainingSeconds > 1 ? "s" : ""}`
      }
      speakTimer(`Timer started for ${timeText}`)
    }
  }

  const stopTimer = () => {
    setIsTimerActive(false)
    setTimeLeft(0)
    setTimer(null)

    // Track feature usage
    trackFeature('Timer', { action: 'stop' })

    if (!isMuted && ttsSupported) {
      speakTimer("Timer stopped")
    }
  }

  const nextStep = () => {
    if (currentStep < activeRecipe?.instructions?.length - 1) {
      triggerHapticFeedback('light')
      // Stop current audio and reset playing state
      stop()
      setIsPlaying(false)
      
      setCompletedSteps((prev) => new Set([...prev, currentStep]))
      setCurrentStep(currentStep + 1)
      stopTimer()

      // Track feature usage
      trackFeature('Next Step', {
        step_number: currentStep + 1,
        method: 'button_click'
      })

      if (!isMuted && ttsSupported) {
        const nextInstruction = activeRecipe.instructions[currentStep + 1]
        speakRecipeStep(nextInstruction, {
          onEnd: () => setIsPlaying(false),
          onStart: () => setIsPlaying(true)
        })
      }
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      triggerHapticFeedback('light')
      // Stop current audio and reset playing state
      stop()
      setIsPlaying(false)
      
      setCurrentStep(currentStep - 1)
      setCompletedSteps((prev) => {
        const newSet = new Set(prev)
        newSet.delete(currentStep - 1)
        return newSet
      })
      stopTimer()

      // Track feature usage
      trackFeature('Previous Step', {
        step_number: currentStep - 1,
        method: 'button_click'
      })

      if (!isMuted && ttsSupported) {
        const prevInstruction = activeRecipe.instructions[currentStep - 1]
        speakRecipeStep(prevInstruction, {
          onEnd: () => setIsPlaying(false),
          onStart: () => setIsPlaying(true)
        })
      }
    }
  }

  const togglePlayPause = () => {
    if (isSpeaking) {
      // If currently speaking, stop the audio
      stop()
      setIsPlaying(false)
      trackFeature('Text-to-Speech', { action: 'stop' })
    } else {
      // If not speaking, start the audio
      setIsPlaying(true)
      trackFeature('Text-to-Speech', { action: 'start', step_number: currentStep + 1 })
      if (!isMuted && ttsSupported) {
        const currentInstruction = activeRecipe.instructions[currentStep]
        speakRecipeStep(currentInstruction, {
          onEnd: () => setIsPlaying(false),
          onStart: () => setIsPlaying(true)
        })
      }
    }
  }

  const handleVoiceCommand = (transcript) => {
    const command = transcript.toLowerCase().trim()
    console.log('Voice command received:', command) // Debug log

    // Track voice command usage
    trackFeature('Voice Command', { command: transcript, parsed_action: 'unknown' })

    // More flexible command matching
    if (command.includes("next") || command.includes("continue") || command.includes("forward")) {
      console.log('Executing next step')
      trackFeature('Voice Command', { command: transcript, parsed_action: 'next_step' })
      nextStep()
    } else if (command.includes("previous") || command.includes("back") || command.includes("prev")) {
      console.log('Executing previous step')
      trackFeature('Voice Command', { command: transcript, parsed_action: 'previous_step' })
      prevStep()
    } else if (command.includes("repeat") || command.includes("again") || command.includes("say again")) {
      console.log('Repeating current step')
      trackFeature('Voice Command', { command: transcript, parsed_action: 'repeat_step' })
      if (!isMuted && ttsSupported) {
        const currentInstruction = activeRecipe.instructions[currentStep]
        speakRecipeStep(currentInstruction)
      }
    } else if (command.includes("ingredient") || command.includes("what do i need")) {
      console.log('Reading ingredients')
      if (!isMuted && ttsSupported) {
        const ingredientsText = activeRecipe.ingredients.map(ingredient => 
          typeof ingredient === 'string' 
            ? ingredient 
            : `${ingredient.amount || ''} ${ingredient.unit || ''} ${ingredient.name || ''}`.trim()
        ).join(", ");
        const text = `You will need: ${ingredientsText}`
        speak(text)
      }
    } else if (command.includes("start timer") || command.includes("set timer") || command.includes("timer")) {
      console.log('Starting timer')
      const currentInstruction = activeRecipe.instructions[currentStep]
      if (currentInstruction.duration) {
        startTimer(currentInstruction.duration)
      }
    } else if (command.includes("stop timer") || command.includes("cancel timer")) {
      console.log('Stopping timer')
      stopTimer()
    } else if (command.includes("play") || command.includes("start")) {
      console.log('Playing audio')
      if (!isSpeaking && !isMuted && ttsSupported) {
        const currentInstruction = activeRecipe.instructions[currentStep]
        speakRecipeStep(currentInstruction, {
          onEnd: () => setIsPlaying(false),
          onStart: () => setIsPlaying(true)
        })
      }
    } else if (command.includes("pause") || command.includes("stop")) {
      console.log('Pausing audio')
      if (isSpeaking) {
        stop()
        setIsPlaying(false)
      }
    } else {
      console.log('Command not recognized:', command)
      showToast.info("Command not recognized", `Try saying: next, previous, repeat, ingredients, start timer, or stop timer`)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const progress = activeRecipe ? ((currentStep + 1) / activeRecipe.instructions.length) * 100 : 0
  const currentInstruction = activeRecipe ? activeRecipe.instructions[currentStep] : null

  return (
    <>
      <SwipeFeedback />
      <PullToRefreshIndicator
        isPulling={isPulling}
        isRefreshing={isRefreshing}
        pullProgress={pullProgress}
        pullDistance={pullDistance}
      />
      <div 
        className="min-h-screen bg-gradient-to-br from-background to-muted gesture-container flex flex-col"
        {...gestureHandlers}
        style={{
          paddingTop: isPulling ? Math.min(pullDistance, 80) : 0,
          transition: !isPulling ? 'padding-top 0.3s ease-out' : 'none'
        }}
      >
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="w-full px-2 sm:px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <Link href="/search" className="flex items-center gap-2 flex-shrink-0">
              <ChefHat className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              <h1 className="text-lg sm:text-2xl font-bold text-foreground">CookAI</h1>
            </Link>
            
            {/* Mobile Session Timer and Status */}
            <div className="flex items-center gap-2 sm:gap-3">
              {isSessionActive && (
                <div className="flex items-center gap-1 sm:gap-2 bg-green-100 dark:bg-green-900/20 px-2 sm:px-3 py-1 rounded-full">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs sm:text-sm font-medium text-green-700 dark:text-green-300">
                    {formattedElapsedTime}
                  </span>
                </div>
              )}
              <Badge variant="secondary" className="text-xs sm:text-sm">Cooking Mode</Badge>
            </div>
          </div>
          
          {/* Mobile-optimized controls */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            {/* Session Control - Most Important */}
            {!isSessionActive ? (
              <Button
                onClick={handleStartCooking}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white flex-shrink-0 order-1"
              >
                <Play className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="text-xs sm:text-sm">Start Session</span>
              </Button>
            ) : (
              <Button
                onClick={handleFinishCooking}
                size="sm"
                variant="outline"
                className="border-green-600 text-green-600 hover:bg-green-50 flex-shrink-0 order-1"
              >
                <Square className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="text-xs sm:text-sm">Finish Session</span>
              </Button>
            )}
            
            {/* Secondary controls */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowScalingCalculator(!showScalingCalculator)}
              className={`flex-shrink-0 order-2 ${showScalingCalculator ? "bg-primary text-primary-foreground" : ""}`}
            >
              <Calculator className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="sr-only sm:not-sr-only sm:ml-1 text-xs">Scale</span>
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsMuted(!isMuted)}
              className="flex-shrink-0 order-3"
            >
              {isMuted ? <VolumeX className="h-3 w-3 sm:h-4 sm:w-4" /> : <Volume2 className="h-3 w-3 sm:h-4 sm:w-4" />}
              <span className="sr-only sm:not-sr-only sm:ml-1 text-xs">Sound</span>
            </Button>

            {/* Favorite Button */}
            <div className="order-4">
              <FavoriteButton 
                recipeId={activeRecipe?.id} 
                size="sm"
                onToggle={(isFavorite) => {
                  trackFeature('Toggle Favorite', { is_favorite: isFavorite })
                }}
              />
            </div>
          </div>
          
          {/* Recipe Title and Meta */}
          <div className="mt-3">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {activeRecipe?.title}
            </h2>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>⏱️ {(activeRecipe?.prepTime || 0) + (activeRecipe?.cookTime || 0)} min</span>
              <span>👥 {activeRecipe?.servings} servings</span>
              <span>📊 {activeRecipe?.difficulty}</span>
              {isSessionActive && (
                <span className="text-green-600 font-medium">
                  • Session Active
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="w-full px-2 sm:px-4 py-3 sm:py-6 flex-grow">
        <BackNavigation 
          showHomeButton={true}
          showBackButton={true}
          homeLabel="Home"
          backLabel="Back to Recipes"
        />
        
        {/* Recipe Header */}
        <div className="mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">{activeRecipe.title}</h2>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
              {activeRecipe.prepTime + activeRecipe.cookTime}m total
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3 sm:h-4 sm:w-4" />
              {activeRecipe.servings} servings
            </div>
            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 text-xs">
              {activeRecipe.difficulty}
            </Badge>
          </div>
        </div>

        {/* Scaling Calculator */}
        {showScalingCalculator && (
          <div className="mb-4 sm:mb-6">
            <RecipeScalingCalculator
              recipe={baseRecipe}
              onScaledRecipeChange={handleScaledRecipeChange} 
            />
          </div>
        )}

        {/* Progress Bar */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {activeRecipe?.instructions?.length || 0}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
          {/* Main Cooking Interface */}
          <div className="xl:col-span-2 order-1">
            {/* Current Step */}
            {currentInstruction && (
            <Card className="mb-4 sm:mb-6">
              <CardHeader className="pb-3 sm:pb-6">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg sm:text-xl lg:text-2xl leading-tight">
                    Step {currentInstruction.step || (currentStep + 1)}: {currentInstruction.title || currentInstruction}
                  </CardTitle>
                  {completedSteps.has(currentStep) && <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 flex-shrink-0" />}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm sm:text-base lg:text-lg mb-4 leading-relaxed">
                  {currentInstruction.description || currentInstruction}
                </p>

                {currentInstruction.tips && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-blue-800">
                      <strong>Pro Tip:</strong> {currentInstruction.tips}
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Button
                  onClick={() => setCompletedSteps((prev) => new Set([...prev, currentStep]))}
                  disabled={completedSteps.has(currentStep)}
                  variant={completedSteps.has(currentStep) ? "default" : "outline"}
                  >

                    {completedSteps.has(currentStep) ? (
                      <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Completed
                      </>
                    ): (
                      <>
                      <Circle className="h-4 w-4 mr-2" />
                      Mark as Complete
                      </>
                    )}
                  </Button>
                  {currentInstruction.duration && (
                    <Badge variant="secondary" className="ml-auto">
                      <Timer className="h-4 w-4 mr-1" />
                      {Math.floor(currentInstruction.duration / 60)}m {currentInstruction.duration % 60}s
                    </Badge>
                  )}
                </div>


                {/* Timer Card */}
                {currentInstruction.duration && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Timer className="h-5 w-5 text-orange-600" />
                        <span className="font-medium text-orange-800">
                          Suggested time: {formatTime(currentInstruction.duration)}
                        </span>
                      </div>
                      <Button
                        onClick={() => startTimer(currentInstruction.duration)}
                        size="sm"
                        variant="outline"
                        className="border-orange-300 text-orange-700 hover:bg-orange-100"
                      >
                        Start Timer
                      </Button>
                    </div>
                  </div>
                )}

                {/* Active Timer Display */}
                {isTimerActive && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Timer className="h-5 w-5 text-red-600 animate-pulse" />
                        <span className="font-bold text-red-800 text-xl">{formatTime(timeLeft)}</span>
                      </div>
                      <Button
                        onClick={stopTimer}
                        size="sm"
                        variant="outline"
                        className="border-red-300 text-red-700 bg-transparent"
                      >
                        Stop Timer
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            )}

            {/* Controls */}
            <Card>
              <CardContent className="pt-4 sm:pt-6">
                <div className="flex items-center justify-center gap-2 sm:gap-4 mb-4">
                  <Button onClick={prevStep} disabled={currentStep === 0} size="sm" className="sm:size-default lg:size-lg" variant="outline">
                    <SkipBack className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="sr-only sm:not-sr-only sm:ml-1">Previous</span>
                  </Button>

                  <Button onClick={togglePlayPause} size="sm" className="px-4 sm:px-6 lg:px-8 sm:size-default lg:size-lg" disabled={isLoading}>
                    {isSpeaking ? <Pause className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" /> : <Play className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />}
                    <span className="text-xs sm:text-sm">{isLoading ? "Loading..." : isSpeaking ? "Pause" : "Play"}</span>
                  </Button>

                  <Button
                    onClick={nextStep}
                    disabled={currentStep === (activeRecipe?.instructions?.length || 1) - 1}
                    size="sm"
                    className="sm:size-default lg:size-lg"
                    variant="outline"
                  >
                    <SkipForward className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="sr-only sm:not-sr-only sm:ml-1">Next</span>
                  </Button>
                </div>

                <div className="flex justify-center mb-4">
                  <VoiceInputButton
                    onTranscript={handleVoiceCommand}
                    onError={(error) => console.error("Voice command error:", error)}
                    size="default"
                  />
                </div>

                <div className="text-center">
                  <p className="text-xs sm:text-sm text-muted-foreground px-2">
                    Say: "next", "previous", "repeat", "ingredients", "start timer", "stop timer", "play", or "pause"
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6 order-2 xl:order-2">
            <div className="xl:block">
              <VoiceRecipeReader recipe={activeRecipe} currentStep={currentStep} />
            </div>

           {/* Ingredients */}
            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="text-base sm:text-lg">
                  Ingredients
                  {scaledRecipe && (
                    <Badge variant="outline" className="ml-2 bg-blue-100 text-blue-800 border-blue-200 text-xs">
                      Scaled
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5 sm:space-y-2">
                  {activeRecipe?.ingredients?.map((ingredient, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm sm:text-base">
                      <Circle className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-muted-foreground mt-1.5 sm:mt-2 flex-shrink-0" />
                      <span className="break-words">
                        {typeof ingredient === 'string' 
                          ? ingredient 
                          : `${ingredient.amount || ''} ${ingredient.unit || ''} ${ingredient.name || ''}`.trim()
                        }
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>


             {/* Recipe Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Recipe Info</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{activeRecipe?.description}</p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Prep Time</span>
                    <span className="text-sm font-medium">{activeRecipe?.prepTime}m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Cook Time</span>
                    <span className="text-sm font-medium">{activeRecipe?.cookTime}m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Total Time</span>
                    <span className="text-sm font-medium">{(activeRecipe?.prepTime || 0) + (activeRecipe?.cookTime || 0)}m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Servings</span>
                    <span className="text-sm font-medium">{activeRecipe?.servings}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Difficulty</span>
                    <Badge variant="outline" className="text-xs">
                      {activeRecipe?.difficulty}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Gesture hints for mobile */}
        {activeRecipe && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40 bg-black/70 text-white px-4 py-2 rounded-full text-xs backdrop-blur-sm md:hidden">
            Swipe ← → for steps • Pull down to refresh
          </div>
        )}
      </main>
      </div>
    </>
  )
}
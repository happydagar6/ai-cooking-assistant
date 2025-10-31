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
  Sparkles,
  Star,
  Flame,
  Target,
  Zap,
  Mic,
  MicOff,
  Heart,
  TrendingUp,
  Activity,
  RotateCcw,
  PlayCircle,
  PauseCircle,
  SkipBackIcon,
  SkipForwardIcon,
  ArrowRight,
  Trophy,
  Award,
  Rocket,
} from "lucide-react"
import { VoiceInputButton } from "@/components/voice-input-button"
import { VoiceRecipeReader } from "@/components/voice-recipe-reader"
import { NutritionAnalysis } from "@/components/nutrition-analysis"
import { BackNavigation } from "@/components/back-navigation"
import { RecipeScalingCalculator } from "@/components/recipe-scaling-calculator"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useOpenAITextToSpeech } from "@/hooks/use-openai-speech"
import { useAuth } from "@/lib/auth-context"
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
  const [lastCommandTime, setLastCommandTime] = useState(0) // Add command debouncing
  // New state for recipe data
  const [recipe, setRecipe] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const timerRef = useRef(null)

  const { speak, speakRecipeStep, speakTimer, stop, isSpeaking, isLoading: ttsLoading, error: ttsError, isSupported: ttsSupported } = useOpenAITextToSpeech()
  const { isLoaded, isSignedIn } = useAuth()

  // Fetch recipe data on component mount
  useEffect(() => {
    const fetchRecipe = async () => {
      // Wait for Clerk authentication to load
      if (!isLoaded) {
        return
      }

      // Check if user is authenticated
      if (!isSignedIn) {
        setError("You need to be logged in to view this recipe")
        setIsLoading(false)
        return
      }

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
            throw new Error("Authentication required. Please sign in.")
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
  }, [params?.id, isLoaded, isSignedIn])

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
      console.log('TTS Error detected:', ttsError)
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative inline-block mb-4">
            <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center">
              <ChefHat className="h-8 w-8 text-white animate-bounce" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-300 rounded-full animate-ping" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Recipe</h3>
          <p className="text-gray-600 text-sm">Please wait...</p>
        </div>
      </div>
    )
  }
  
  // Error state
  if (error || !recipe) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ChefHat className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Recipe Not Found</h2>
          <p className="text-gray-600 mb-6 text-sm leading-relaxed">
            {error || "Unable to load recipe data"}
          </p>
          <Link href="/dashboard">
            <Button className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg px-4 py-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Recipes
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

  const stopTimer = (announce = true) => {
    const wasActive = isTimerActive
    setIsTimerActive(false)
    setTimeLeft(0)
    setTimer(null)

    // Track feature usage
    trackFeature('Timer', { action: 'stop' })

    // Only announce if timer was actually running and announce is true
    if (announce && wasActive && !isMuted && ttsSupported) {
      speakTimer("Timer stopped")
    }
  }

  const nextStep = () => {
    if (currentStep < activeRecipe?.instructions?.length - 1) {
      triggerHapticFeedback('light')
      
      // Stop current audio and reset playing state FIRST
      if (isSpeaking) {
        stop()
      }
      setIsPlaying(false)
      
      // Update step state
      setCompletedSteps((prev) => new Set([...prev, currentStep]))
      const nextStepIndex = currentStep + 1
      setCurrentStep(nextStepIndex)
      stopTimer(false) // Don't announce timer stop when changing steps

      // Track feature usage
      trackFeature('Next Step', {
        step_number: nextStepIndex + 1,
        method: 'voice_command'
      })

      // Wait a moment before starting new audio to avoid conflicts
      setTimeout(() => {
        if (!isMuted && ttsSupported) {
          const nextInstruction = activeRecipe.instructions[nextStepIndex]
          speakRecipeStep(nextInstruction, {
            onEnd: () => setIsPlaying(false),
            onStart: () => setIsPlaying(true)
          })
        }
      }, 500) // 500ms delay to ensure audio system is ready
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      triggerHapticFeedback('light')
      
      // Stop current audio and reset playing state FIRST
      if (isSpeaking) {
        stop()
      }
      setIsPlaying(false)
      
      // Update step state
      const prevStepIndex = currentStep - 1
      setCurrentStep(prevStepIndex)
      setCompletedSteps((prev) => {
        const newSet = new Set(prev)
        newSet.delete(prevStepIndex)
        return newSet
      })
      stopTimer(false) // Don't announce timer stop when changing steps

      // Track feature usage
      trackFeature('Previous Step', {
        step_number: prevStepIndex + 1,
        method: 'voice_command'
      })

      // Wait a moment before starting new audio to avoid conflicts
      setTimeout(() => {
        if (!isMuted && ttsSupported) {
          const prevInstruction = activeRecipe.instructions[prevStepIndex]
          speakRecipeStep(prevInstruction, {
            onEnd: () => setIsPlaying(false),
            onStart: () => setIsPlaying(true)
          })
        }
      }, 700) // 700ms delay to ensure audio system is ready
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
    const now = Date.now()
    
    console.log('Voice command received:', command) // Debug log
    
    // Filter out background noise and very short commands
    if (command.length < 2 || command.match(/^[a-z]$/)) {
      console.log('Command too short or invalid, ignoring:', command)
      return
    }
    
    // Filter out common non-command phrases
    const commonNonCommands = ['step one', 'step two', 'step three', 'step four', 'step five', 'step six', 'step seven', 'step eight', 'step nine', 'step ten', 'step 1', 'step 2', 'step 3', 'step 4', 'step 5', 'step 6', 'step 7', 'step 8', 'step 9', 'step 0', 'um', 'uh', 'ah', 'oh', 'the', 'and', 'a', 'an', 'is', 'are', 'was', 'were']
    if (commonNonCommands.includes(command)) {
      console.log('Common non-command phrase ignored:', command)
      return
    }
    
    // Debounce commands - ignore if less than 2.5 seconds since last command
    if (now - lastCommandTime < 2500) {
      console.log('Command ignored due to debouncing:', command)
      return
    }
    
    setLastCommandTime(now)

    // Track voice command usage
    trackFeature('Voice Command', { command: transcript, parsed_action: 'unknown' })

    // More flexible command matching - prioritize voice control commands
    if (command.includes("stop voice") || command.includes("stop listening") || command.includes("stop command")) {
      console.log('Stopping voice commands');
      trackFeature('Voice Command', { command: transcript, parsed_action: 'stop_voice' })
      // Voice recognition will handle stopping itself
      showToast.success("Voice Control Stopped", "Click the microphone to start again")
    } else if (command.includes("next") || command.includes("continue") || command.includes("forward")) {
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
      trackFeature('Voice Command', { command: transcript, parsed_action: 'stop_timer' })
      stopTimer()
    } else if (command.includes("pause") || (command === "stop" || command.includes("stop audio") || command.includes("stop playing"))) {
      console.log('Pausing audio')
      trackFeature('Voice Command', { command: transcript, parsed_action: 'pause_audio' })
      if (isSpeaking) {
        stop()
        setIsPlaying(false)
      }
    } else if (command.includes("play") || command.includes("start")) {
      console.log('Playing audio - Voice command')
      trackFeature('Voice Command', { command: transcript, parsed_action: 'play_audio' })
      if (!isSpeaking && !isMuted && ttsSupported) {
        const currentInstruction = activeRecipe.instructions[currentStep]
        speakRecipeStep(currentInstruction, {
          onEnd: () => {
            console.log('Voice command TTS ended')
            setIsPlaying(false)
          },
          onStart: () => {
            console.log('Voice command TTS started')
            setIsPlaying(true)
          }
        })
      } else {
        console.log('Cannot play audio - conditions not met:', {
          isSpeaking,
          isMuted,
          ttsSupported
        })
      }
    } else {
      console.log('Command not recognized:', command)
      // Only show notification for commands that seem intentional and might be valid attempts
      const seemsIntentional = command.length > 3 && 
                              !command.includes('um') && 
                              !command.includes('uh') && 
                              !command.includes('step') &&
                              !command.match(/\b(the|and|a|an|is|are|was|were|of|to|in|for|on|at|by|with)\b/)
      
      if (seemsIntentional) {
        showToast.info("Command not recognized", `Try: next, previous, repeat, ingredients, or timers`)
      }
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
      {/* Show loading while authentication is loading */}
      {!isLoaded && (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader2 className="h-6 w-6 text-white animate-spin" />
            </div>
            <h3 className="text-base font-medium text-gray-900 mb-1">Loading</h3>
            <p className="text-gray-600 text-sm">Just a moment...</p>
          </div>
        </div>
      )}

      {/* Show error if not authenticated */}
      {isLoaded && !isSignedIn && (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ChefHat className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Sign In Required</h2>
            <p className="text-gray-600 mb-6 text-sm leading-relaxed">
              Please sign in to access your cooking sessions.
            </p>
            <Link 
              href="/search" 
              className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Search
            </Link>
          </div>
        </div>
      )}

      {/* Show loading while recipe is loading */}
      {isLoaded && isSignedIn && isLoading && (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <ChefHat className="h-8 w-8 text-white animate-bounce" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Recipe</h3>
            <p className="text-gray-600 text-sm">Please wait...</p>
          </div>
        </div>
      )}

      {/* Show error if recipe loading failed */}
      {isLoaded && isSignedIn && error && (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ChefHat className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Something Went Wrong</h2>
            <p className="text-gray-600 mb-6 text-sm leading-relaxed">{error}</p>
            <Link 
              href="/search" 
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Search
            </Link>
          </div>
        </div>
      )}

      {/* Main cooking interface - only show when authenticated and recipe is loaded */}
      {isLoaded && isSignedIn && !isLoading && !error && activeRecipe && (
        <>
      <SwipeFeedback />
      <PullToRefreshIndicator
        isPulling={isPulling}
        isRefreshing={isRefreshing}
        pullProgress={pullProgress}
        pullDistance={pullDistance}
      />
      <div 
        className="min-h-screen bg-gray-50 gesture-container flex flex-col"
        {...gestureHandlers}
        style={{
          paddingTop: isPulling ? Math.min(pullDistance, 80) : 0,
          transition: !isPulling ? 'padding-top 0.3s ease-out' : 'none'
        }}
      >
      {/* Clean Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="w-full px-4 py-4">
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-4">
            <Link href="/search" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <ChefHat className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">CookAI</h1>
                <p className="text-xs text-gray-500">Cooking Assistant</p>
              </div>
            </Link>
            
            {/* Session Status */}
            <div className="flex items-center gap-3">
              {isSessionActive && (
                <div className="flex items-center gap-2 bg-gray-100 text-gray-700 px-3 py-1 rounded-lg border border-gray-300">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium">{formattedElapsedTime}</span>
                </div>
              )}
              <Badge className="bg-gray-100 text-gray-700 border-gray-300">
                <Flame className="h-3 w-3 mr-1" />
                Cooking
              </Badge>
            </div>
          </div>
          
          {/* Recipe Title and Info */}
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-2 leading-tight">
              {activeRecipe?.title}
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <div className="flex items-center gap-2 bg-gray-100 px-2 py-1 rounded-lg">
                <Clock className="h-4 w-4 text-gray-600" />
                <span className="text-gray-700">
                  {(activeRecipe?.prepTime || 0) + (activeRecipe?.cookTime || 0)} min
                </span>
              </div>
              <div className="flex items-center gap-2 bg-gray-100 px-2 py-1 rounded-lg">
                <Users className="h-4 w-4 text-gray-600" />
                <span className="text-gray-700">{activeRecipe?.servings} servings</span>
              </div>
              <div className="flex items-center gap-2 bg-gray-100 px-2 py-1 rounded-lg">
                <Target className="h-4 w-4 text-gray-600" />
                <span className="text-gray-700 capitalize">{activeRecipe?.difficulty}</span>
              </div>
            </div>
          </div>

          {/* Control Bar */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {/* Primary Session Control */}
            {!isSessionActive ? (
              <Button
                onClick={handleStartCooking}
                className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg px-4 py-2"
              >
                <PlayCircle className="h-4 w-4 mr-2" />
                Start Session
              </Button>
            ) : (
              <Button
                onClick={handleFinishCooking}
                variant="outline"
                className="border-orange-500 text-orange-600 hover:bg-orange-50 rounded-lg px-4 py-2"
              >
                <Trophy className="h-4 w-4 mr-2" />
                Complete
              </Button>
            )}
            
            {/* Secondary Controls */}
            <Button
              variant="outline"
              onClick={() => setShowScalingCalculator(!showScalingCalculator)}
              className={`rounded-lg px-3 py-2 ${
                showScalingCalculator 
                  ? "bg-orange-500 text-white border-orange-500 hover:bg-orange-600" 
                  : "border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Calculator className="h-4 w-4 mr-1" />
              Scale
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => setIsMuted(!isMuted)}
              className="border-gray-300 text-gray-600 hover:bg-gray-50 rounded-lg px-3 py-2"
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>

            {/* Favorite Button */}
            <FavoriteButton 
              recipeId={activeRecipe?.id} 
              size="default"
              className="border-gray-300 text-gray-600 hover:bg-gray-50 rounded-lg"
              onToggle={(isFavorite) => {
                trackFeature('Toggle Favorite', { is_favorite: isFavorite })
              }}
            />
          </div>
        </div>
      </header>

      <main className="flex-grow px-4 py-6">
        {/* Back Navigation */}
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard" 
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm font-medium">Back to Recipes</span>
            </Link>
            <div className="w-px h-4 bg-gray-300" />
            <Link 
              href="/" 
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ChefHat className="h-4 w-4" />
              <span className="text-sm font-medium">Home</span>
            </Link>
          </div>
        </div>

        {/* Progress Section */}
        <div className="mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Progress</h3>
                  <p className="text-sm text-gray-600">Step {currentStep + 1} of {activeRecipe?.instructions?.length || 0}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-gray-900">{Math.round(progress)}%</div>
                <div className="text-xs text-gray-600">Complete</div>
              </div>
            </div>
            <Progress value={progress} className="h-2 bg-gray-100 rounded-full" />
          </div>
        </div>

        {/* Scaling Calculator */}
        {showScalingCalculator && (
          <div className="mb-6">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <Calculator className="h-5 w-5 text-orange-500" />
                <h3 className="font-medium text-gray-900">Recipe Scaling</h3>
              </div>
              <RecipeScalingCalculator
                recipe={baseRecipe}
                onScaledRecipeChange={handleScaledRecipeChange} 
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main Cooking Interface */}
          <div className="xl:col-span-2 space-y-4">
            {/* Current Step Card */}
            {currentInstruction && (
            <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
              <CardHeader className="bg-orange-500 text-white rounded-t-lg p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-white/20 text-white border-white/30 px-2 py-1 text-xs rounded">
                        Step {currentInstruction.step || (currentStep + 1)}
                      </Badge>
                      {completedSteps.has(currentStep) && (
                        <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-orange-500" />
                        </div>
                      )}
                    </div>
                    <CardTitle className="text-lg font-semibold leading-tight">
                      {currentInstruction.title || currentInstruction}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <p className="text-base text-gray-700 mb-4 leading-relaxed">
                  {currentInstruction.description || currentInstruction}
                </p>

                {currentInstruction.tips && (
                  <div className="bg-gray-50 border-l-4 border-orange-500 rounded-r-lg p-3 mb-4">
                    <div className="flex items-start gap-2">
                      <Sparkles className="h-4 w-4 text-orange-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900 text-sm mb-1">Pro Tip</p>
                        <p className="text-gray-700 text-sm">{currentInstruction.tips}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Timer Section */}
                {currentInstruction.duration && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                          <Timer className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">Suggested Timer</p>
                          <p className="text-gray-600 text-sm">{formatTime(currentInstruction.duration)}</p>
                        </div>
                      </div>
                      <Button
                        onClick={() => startTimer(currentInstruction.duration)}
                        className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg px-3 py-1 text-sm"
                      >
                        Start Timer
                      </Button>
                    </div>
                  </div>
                )}

                {/* Active Timer Display */}
                {isTimerActive && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center animate-pulse">
                          <Timer className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-red-800 text-lg">{formatTime(timeLeft)}</p>
                          <p className="text-red-600 text-sm">Time remaining</p>
                        </div>
                      </div>
                      <Button
                        onClick={stopTimer}
                        variant="outline"
                        className="border-red-400 text-red-600 hover:bg-red-50 rounded-lg px-3 py-1 text-sm"
                      >
                        Stop
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setCompletedSteps((prev) => new Set([...prev, currentStep]))}
                    disabled={completedSteps.has(currentStep)}
                    className={`flex-1 rounded-lg ${
                      completedSteps.has(currentStep) 
                        ? "bg-orange-500 hover:bg-orange-600 text-white" 
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300"
                    }`}
                  >
                    {completedSteps.has(currentStep) ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Completed
                      </>
                    ) : (
                      <>
                        <Circle className="h-4 w-4 mr-2" />
                        Mark Complete
                      </>
                    )}
                  </Button>
                  
                  {currentInstruction.duration && (
                    <Badge className="bg-gray-100 text-gray-700 border border-gray-200 px-2 py-1 text-xs rounded">
                      <Timer className="h-3 w-3 mr-1" />
                      {Math.floor(currentInstruction.duration / 60)}m {currentInstruction.duration % 60}s
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
            )}

            {/* Controls */}
            <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
              <CardContent className="p-4">
                {/* Navigation Controls */}
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Button 
                    onClick={prevStep} 
                    disabled={currentStep === 0} 
                    className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 disabled:opacity-50"
                  >
                    <SkipBack className="h-5 w-5" />
                  </Button>

                  <Button 
                    onClick={togglePlayPause} 
                    disabled={ttsLoading}
                    className="w-14 h-14 rounded-full bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50"
                  >
                    {isSpeaking ? 
                      <PauseCircle className="h-6 w-6" /> : 
                      <PlayCircle className="h-6 w-6" />
                    }
                  </Button>

                  <Button
                    onClick={nextStep}
                    disabled={currentStep === (activeRecipe?.instructions?.length || 1) - 1}
                    className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 disabled:opacity-50"
                  >
                    <SkipForward className="h-5 w-5" />
                  </Button>
                </div>

                <div className="text-center mb-4">
                  <p className="text-sm text-gray-600 mb-1">
                    {isSpeaking ? "Playing instructions..." : "Click play to hear instructions"}
                  </p>
                </div>

                {/* Voice Control */}
                <div className="text-center">
                  <VoiceInputButton
                    onTranscript={handleVoiceCommand}
                    onError={(error) => console.error("Voice command error:", error)}
                    size="lg"
                    persistent={true}
                    className="bg-gray-700 hover:bg-gray-800 text-white rounded-lg"
                  />
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Voice Commands:</p>
                    <div className="flex flex-wrap gap-1 justify-center">
                      {["next", "previous", "repeat", "ingredients", "play", "pause"].map((cmd) => (
                        <Badge key={cmd} className="text-xs bg-white text-gray-600 border border-gray-200 rounded">
                          "{cmd}"
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Voice Recipe Reader */}
            <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
              <CardHeader className="bg-gray-800 text-white rounded-t-lg p-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Mic className="h-4 w-4" />
                  Voice Assistant
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <VoiceRecipeReader recipe={activeRecipe} currentStep={currentStep} />
              </CardContent>
            </Card>

            {/* Ingredients */}
            <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
              <CardHeader className="bg-gray-800 text-white rounded-t-lg p-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <span className="text-sm">🥗</span>
                  Ingredients
                  {scaledRecipe && (
                    <Badge className="bg-orange-500 text-white ml-auto text-xs rounded">
                      Scaled
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <ul className="space-y-2">
                  {activeRecipe?.ingredients?.map((ingredient, index) => (
                    <li key={index} className="flex items-start gap-2 p-2 rounded-lg bg-gray-50 border border-gray-200">
                      <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">
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
            <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
              <CardHeader className="bg-gray-800 text-white rounded-t-lg p-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <span className="text-sm">📊</span>
                  Recipe Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <p className="text-gray-600 mb-4 text-sm leading-relaxed">{activeRecipe?.description}</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-600" />
                      <span className="text-sm text-gray-700">Prep Time</span>
                    </div>
                    <span className="text-sm font-medium text-gray-700">{activeRecipe?.prepTime}m</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Flame className="h-4 w-4 text-gray-600" />
                      <span className="text-sm text-gray-700">Cook Time</span>
                    </div>
                    <span className="text-sm font-medium text-gray-700">{activeRecipe?.cookTime}m</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Timer className="h-4 w-4 text-gray-600" />
                      <span className="text-sm text-gray-700">Total Time</span>
                    </div>
                    <span className="text-sm font-medium text-gray-700">{(activeRecipe?.prepTime || 0) + (activeRecipe?.cookTime || 0)}m</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-600" />
                      <span className="text-sm text-gray-700">Servings</span>
                    </div>
                    <span className="text-sm font-medium text-gray-700">{activeRecipe?.servings}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-gray-600" />
                      <span className="text-sm text-gray-700">Difficulty</span>
                    </div>
                    <Badge className="bg-gray-100 text-gray-700 border-gray-200 capitalize text-xs rounded">
                      {activeRecipe?.difficulty}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Nutrition Analysis */}
            <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
              <CardHeader className="bg-gray-800 text-white rounded-t-lg p-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <span className="text-sm">🍎</span>
                  Nutrition Info
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <NutritionAnalysis recipe={activeRecipe} />
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Mobile Gesture Hints */}
        {activeRecipe && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 md:hidden">
            <div className="bg-gray-900/80 backdrop-blur-sm text-white px-4 py-2 rounded-full border border-gray-700">
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1">
                  <ArrowLeft className="h-3 w-3" />
                  <ArrowRight className="h-3 w-3" />
                  <span>Swipe</span>
                </div>
                <div className="w-px h-3 bg-white/30" />
                <div className="flex items-center gap-1">
                  <RotateCcw className="h-3 w-3" />
                  <span>Pull</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      </div>
        </>
      )}
    </>
  )
}
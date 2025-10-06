import { create } from 'zustand'
import { persist } from 'zustand/middleware'


// Define the shape of our store and actions for cooking assistant app. Why not use Redux? Because Zustand is simpler and more lightweight for this use case.
// Why zustand? Zustand provides a simple and flexible way to manage state in React applications with minimal boilerplate. 
// It allows for easy state persistence, which is useful for saving user preferences and session data in a cooking assistant app. 
// Additionally, Zustand's API is straightforward, making it easy to create and manage global state without the complexity of Redux. 
// This makes it an ideal choice for applications that require a balance between simplicity and functionality.

export const useCookingStore = create(

  // Persist certain parts of the store to localStorage for user preferences and voice 
  // settings. What is persist in zustand?: Persist is a middleware in Zustand that 
  // allows you to save and rehydrate state from localStorage (or other storage) 
  // automatically. This is useful for maintaining user preferences and session data 
  // across page reloads. Why using localStorage here?: localStorage is used here to 
  // persist user preferences and voice settings so that they are retained even when 
  // the user refreshes the page or closes and reopens the browser. This enhances the 
  // user experience by keeping their settings consistent across sessions.
  persist(
    (set, get) => ({
      // User state
      user: null,
      isAuthenticated: false,

      // Current recipe state
      currentRecipe: null,
      currentSession: null,
      currentStep: 0,
      completedSteps: new Set(),
      
      // Voice settings
      voiceSettings: {
        isEnabled: true,
        autoRead: true,
        voice: 'nova',
        speed: 1.0,
        volume: 0.8
      },

      // Cooking timers
      timers: [],
      
      // User preferences
      preferences: {
        units: 'metric', // 'metric' | 'imperial'
        dietaryRestrictions: [],
        skillLevel: 'beginner'
      },

      // Actions
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      
      setCurrentRecipe: (recipe) => set({ 
        currentRecipe: recipe,
        currentStep: 0,
        completedSteps: new Set()
      }),
      
      setCurrentSession: (session) => set({ currentSession: session }),
      
      setCurrentStep: (step) => set({ currentStep: step }),
      
      completeStep: (stepIndex) => set((state) => ({
        completedSteps: new Set([...state.completedSteps, stepIndex])
      })),
      
      resetSteps: () => set({ completedSteps: new Set() }),
      
      updateVoiceSettings: (settings) => set((state) => ({
        voiceSettings: { ...state.voiceSettings, ...settings }
      })),
      
      addTimer: (timer) => set((state) => ({
        timers: [...state.timers, { ...timer, id: Date.now() }]
      })),
      
      removeTimer: (id) => set((state) => ({
        timers: state.timers.filter(t => t.id !== id)
      })),
      
      updateTimer: (id, updates) => set((state) => ({
        timers: state.timers.map(t => 
          t.id === id ? { ...t, ...updates } : t
        )
      })),
      
      updatePreferences: (prefs) => set((state) => ({
        preferences: { ...state.preferences, ...prefs }
      })),

      // Clear all data on logout
      clearData: () => set({
        user: null,
        isAuthenticated: false,
        currentRecipe: null,
        currentSession: null,
        currentStep: 0,
        completedSteps: new Set(),
        timers: []
      })
    }),
    {
      name: 'cooking-store',
      partialize: (state) => ({
        voiceSettings: state.voiceSettings,
        preferences: state.preferences
      })
    }
  )
)


// Explain the code above and why zustand is used instead of redux:
// The code above defines a global state management solution for a cooking assistant application using Zustand, a lightweight state management library for React.
// Here's a breakdown of how it works and why Zustand is chosen over Redux:
// 1. Store Creation: The `useCookingStore` is created using the `create` function from Zustand. This function initializes the store with state variables and actions to manipulate that state.
// 2. State Variables: The store contains various state variables such as `user`, `currentRecipe`, `voiceSettings`, `timers`, and `preferences`. These variables hold the current state of the application, including user information, recipe details, voice settings for text-to-speech, cooking timers, and user preferences.
// 3. Actions: The store also defines several actions (functions) that allow components to update the state. For example, `setUser` updates the user information, `setCurrentRecipe` sets the current recipe being viewed or cooked, and `updateVoiceSettings` modifies the voice settings.
// 4. Persistence: The store is wrapped with the `persist` middleware from Zustand, which allows certain parts of the state (like `voiceSettings` and `preferences`) to be saved to local storage. This means that user preferences will persist across sessions, enhancing user experience.
// 5. Simplicity and Flexibility: Zustand is chosen over Redux for several reasons
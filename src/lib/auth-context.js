'use client'

import { useUser, useClerk, useAuth as useClerkAuth } from '@clerk/nextjs'

// Custom hook that maintains the existing interface for components
export const useAuth = () => {
  const { user, isLoaded } = useUser()
  const { signOut, openSignIn, openSignUp } = useClerk()
  const { getToken } = useClerkAuth()
  
  return {
    user,
    isLoaded, // Add isLoaded for authentication state
    isSignedIn: !!user, // Add isSignedIn based on user presence
    loading: !isLoaded,
    getToken, // Add getToken for Supabase JWT integration
    signOut: async () => {
      await signOut()
    },
    // For compatibility with existing components
    signIn: (email, password) => {
      // Clerk handles sign in through UI components
      openSignIn()
      return { data: null, error: null }
    },
    signUp: (email, password, metadata) => {
      // Clerk handles sign up through UI components
      openSignUp()
      return { data: null, error: null }
    },
    resetPassword: (email) => {
      // This will be handled by Clerk's forgot password flow
      openSignIn()
      return { data: null, error: null }
    },
    openSignIn,
    openSignUp
  }
}
"use client"

import { useAuth } from '@clerk/nextjs'

export function useAuthenticatedFetch() {
  const { getToken } = useAuth()

  const authenticatedFetch = async (url, options = {}) => {
    try {
      const token = await getToken()
      
      const headers = {
        ...options.headers,
      }

      // Add authorization header if token exists
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      const response = await fetch(url, {
        ...options,
        headers,
      })

      return response
    } catch (error) {
      console.error('Authenticated fetch error:', error)
      throw error
    }
  }

  return { authenticatedFetch }
}
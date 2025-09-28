'use client'

import { useAuth } from '@/lib/auth-context'
import { SignIn } from '@clerk/nextjs'
import { Loader2 } from 'lucide-react'

export default function ProtectedRoute({ children, redirectTo = '/' }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center">
        <div className="w-full max-w-md">
          <SignIn 
            routing="hash"
            appearance={{
              elements: {
                formButtonPrimary: "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600",
                card: "shadow-2xl",
                headerTitle: "text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent",
                headerSubtitle: "text-gray-600"
              }
            }}
          />
        </div>
      </div>
    )
  }

  return children
}
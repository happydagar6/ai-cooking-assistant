'use client'

import { ArrowLeft, Home } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"

export function BackNavigation({ 
  showHomeButton = true, 
  showBackButton = true, 
  customBackAction = null,
  backLabel = "Back",
  homeLabel = "Home",
  className = "" 
}) {
  const router = useRouter()

  const handleBack = () => {
    if (customBackAction) {
      customBackAction()
    } else {
      router.back()
    }
  }

  const handleHome = () => {
    router.push('/')
  }

  if (!showBackButton && !showHomeButton) {
    return null
  }

  return (
    <div className={`flex items-center gap-2 mb-6 ${className}`}>
      {showBackButton && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleBack}
          className="flex items-center gap-2 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {backLabel}
        </Button>
      )}
      
      {showHomeButton && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleHome}
          className="flex items-center gap-2 hover:bg-gray-50 transition-colors"
        >
          <Home className="w-4 h-4" />
          {homeLabel}
        </Button>
      )}
    </div>
  )
}
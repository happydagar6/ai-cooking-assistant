"use client"

import { useState } from 'react'
import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth-context'
import { useFavoriteStatus, useFavoriteMutation } from '@/hooks/use-optimized-queries'

export function FavoriteButton({ 
  recipeId, 
  size = "sm", 
  variant = "ghost",
  showText = false,
  className = "",
  onToggle = () => {} 
}) {
  const { user } = useAuth()
  const userId = user?.id

  // React Query automatically handles caching and loading states
  const {
    data: favoriteData,
    isLoading: statusLoading,
    error: statusError
  } = useFavoriteStatus(userId, recipeId)

  // Mutation with optimistic updates
  const favoriteMutation = useFavoriteMutation(userId)

  const isFavorite = favoriteData?.is_favorite || false
  const isLoading = statusLoading || favoriteMutation.isPending

  const handleToggle = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (!recipeId || isLoading) return

    try {
      // This will do optimistic update automatically
      const result = await favoriteMutation.mutateAsync(recipeId)

      // Show appropriate toast
      if (result.is_favorite) {
        toast.success('Recipe added to favorites! ❤️', {
          description: 'You can find it in your favorites section',
        })
      } else {
        toast('Recipe removed from favorites', {
          description: 'It\'s no longer in your favorites',
        })
      }

      // Notify parent component
      onToggle(result.is_favorite)

    } catch (error) {
      console.error('Failed to toggle favorite:', error)
      
      toast.error('Failed to update favorite status', {
        description: 'Please try again later'
      })
    }
  }

  // Show loading state while determining favorite status
  if (statusLoading && !favoriteData) {
    return (
      <Button
        variant={variant}
        size={size}
        disabled
        className={cn("relative", className)}
      >
        <Heart className="h-4 w-4 animate-pulse opacity-50" />
        {showText && <span className="ml-2">Loading...</span>}
      </Button>
    )
  }

  // Show error state
  if (statusError) {
    return (
      <Button
        variant={variant}
        size={size}
        disabled
        className={cn("relative opacity-50", className)}
      >
        <Heart className="h-4 w-4" />
        {showText && <span className="ml-2">Error</span>}
      </Button>
    )
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggle}
      disabled={isLoading}
      className={cn(
        "relative transition-all duration-200",
        isFavorite && "text-red-500 hover:text-red-600",
        !isFavorite && "text-muted-foreground hover:text-red-500",
        isLoading && "opacity-70",
        className
      )}
      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
    >
      <Heart 
        className={cn(
          "h-4 w-4 transition-all duration-200",
          isFavorite && "fill-red-500 scale-110",
          isLoading && "animate-pulse"
        )} 
      />
      {showText && (
        <span className="ml-2">
          {isLoading ? 'Updating...' : 
           isFavorite ? 'Favorited' : 'Add to Favorites'}
        </span>
      )}
    </Button>
  )
}
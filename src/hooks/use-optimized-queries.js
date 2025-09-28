import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ======== Query keys (Centralized cache management) ========

export const QUERY_KEYS = {
  // User specific data
  recipes: ["recipes"],
  userRecipes: (userId) => ["userRecipes", userId],

  // Analytics data (diffrent cache times for different data types)
  analytics: (userId) => ["analytics", userId],
  analyticsOverview: (userId) => ["analytics", "overview", userId],
  analyticsCookingTime: (userId) => ["analytics", "cooking-time", userId],
  analyticsFeatures: (userId) => ["analytics", "features", userId],
  analyticsSessions: (userId) => ["analytics", "sessions", userId],


  // Favorites (most frequently changing data)
  favorites: (userId) => ["favorites", userId],
  favoriteStatus: (userId, recipeId) => ["favorite-status", recipeId, userId],
};


// ======== Optimized Recipe Queries =========

// Hook for getting user's recipes (cached for 10 minutes)
export function useUserRecipes(userId) {
    return useQuery({
        queryKey: QUERY_KEYS.userRecipes(userId),
        queryFn: async () => {
            const response = await fetch('/api/recipes/saved')
            if(!response.ok) throw new Error('Failed to fetch user recipes')
            const data = await response.json();
            return data.recipes || [];
        },
        enabled: !!userId, // Only run if userId is authenticated
        staleTime: 10 * 60 * 1000, // 10 minutes for recipes (they don't change often)
        gcTime: 15 * 60 * 1000, // Keep in cache for 15 minutes after unmount
    })
}


// ========= Optmized Analytics Queries =========

// Hook for getting user analytics overview (cached for 5 minutes)

export function useAnalyticsOverview(userId) {
    return useQuery({
        queryKey: QUERY_KEYS.analyticsOverview(userId),
        queryFn: async () => {
            const response = await fetch('/api/analytics?type=overview')
            if(!response.ok) throw new Error('Failed to fetch analytics overview')
            const data = await response.json();
            return data.data;
        },
        enabled: !!userId, // Only run if userId is authenticated
        staleTime: 5 * 60 * 1000, // 5 minutes for overview
    })
}


// Hook for cooking time stats (cached for 10 minutes)
export function useAnalyticsCookingTime(userId) {
    return useQuery({
        queryKey: QUERY_KEYS.analyticsCookingTime(userId),
        queryFn: async () => {
            const response = await fetch('/api/analytics?type=cooking-time')
            if(!response.ok) throw new Error('Failed to fetch cooking time stats')
            const data = await response.json();
            return data.data;
        },
        enabled: !!userId,
        staleTime: 10 * 60 * 1000, // 10 minutes for cooking time stats
    })
}


// Hook for most used features (cached for 15 minutes)
export function useAnalyticsFeatures(userId) {
    return useQuery({
        queryKey: QUERY_KEYS.analyticsFeatures(userId),
        queryFn: async () => {
            const response = await fetch('/api/analytics?type=features')
            if(!response.ok) throw new Error('Failed to fetch most used features')
            const data = await response.json();
            return data.data;
        },
        enabled: !!userId,
        staleTime: 15 * 60 * 1000, // 15 minutes for most used features
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
    })
}


// Hook for recent sesions (cached for 3 minutes)
export function useAnalyticsSessions(userId, limit = 5) {
    return useQuery({
        queryKey: [...QUERY_KEYS.analyticsSessions(userId), limit],
        queryFn: async () => {
            const response = await fetch(`/api/analytics?type=sessions&limit=${limit}`)
            if(!response.ok) throw new Error('Failed to fetch recent sessions')
            const data = await response.json();
            return data.data;
        },
        enabled: !!userId,
        staleTime: 3 * 60 * 1000, // 3 minutes for recent sessions
    })
}




// ========= Optimized Favorites Queries =========

// Hook for getting user's favorite recipes (cached for 3 minutes)
export function useFavoriteRecipes(userId) {
    return useQuery({
        queryKey: QUERY_KEYS.favorites(userId),
        queryFn: async () => {
            const response = await fetch('/api/analytics?type=favorites')
            if(!response.ok) throw new Error('Failed to fetch favorite recipes')
            const data = await response.json();
            return data.data || [];
        },
        enabled: !!userId, // Only run if userId is authenticated
        staleTime: 3 * 60 * 1000, // 3 minutes for favorites (they can change often)
    })
}



// Hook for individual recipe favorite status (cached for 5 minutes)
export function useFavoriteStatus(userId, recipeId) {
    return useQuery({
        queryKey: QUERY_KEYS.favoriteStatus(userId, recipeId),
        queryFn: async () => {
            const response = await fetch(`/api/favorites/${recipeId}`);
            if(!response.ok){
                if(response.status === 404) return { is_favorite: false }; // Not found means not favorite
                throw new Error('Failed to fetch favorite status');
            }
            return await response.json();
        },
        enabled: !!(recipeId && userId), // Only run if both recipeId and userId are available
        staleTime: 5 * 60 * 1000, // 5 minutes for individual favorite status
    })
}


// ============ OPTIMIZED MUTATIONS (For Updates) ============

// Hook for toggling favorites with optimistic updates
export function useFavoriteMutation(userId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (recipeId) => {
      const response = await fetch(`/api/favorites/${recipeId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      if (!response.ok) throw new Error('Failed to toggle favorite')
      return await response.json()
    },
    
    // OPTIMISTIC UPDATE: Update UI immediately, revert if error
    onMutate: async (recipeId) => {
      // Cancel outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.favoriteStatus(userId, recipeId) })
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.favorites(userId) })

      // Snapshot the previous values
      const previousStatus = queryClient.getQueryData(QUERY_KEYS.favoriteStatus(userId, recipeId))
      const previousFavorites = queryClient.getQueryData(QUERY_KEYS.favorites(userId))

      // Optimistically update favorite status
      queryClient.setQueryData(
        QUERY_KEYS.favoriteStatus(userId, recipeId),
        (old) => ({ ...old, is_favorite: !old?.is_favorite })
      )

      // Return context for rollback
      return { previousStatus, previousFavorites, recipeId }
    },

    // On success, invalidate related queries to refetch fresh data
    onSuccess: (data, recipeId) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.favorites(userId) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.analyticsOverview(userId) })
    },

    // On error, rollback the optimistic update
    onError: (err, recipeId, context) => {
      if (context?.previousStatus) {
        queryClient.setQueryData(
          QUERY_KEYS.favoriteStatus(userId, recipeId),
          context.previousStatus
        )
      }
    },
  })
}


// Hook for saving recipe with cache invalidation for instant updates
export function useSaveRecipeMutation(userId) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (recipe) => {
            const response = await fetch('/api/recipes/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ recipe })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save recipe');
            }
            
            const result = await response.json();
            return result.recipe;
        },

        onSuccess: (savedRecipe) => {
            // ✨ INSTANTLY update the user recipes cache with the new recipe
            queryClient.setQueryData(
                QUERY_KEYS.userRecipes(userId),
                (old) => {
                    const recipes = old || [];
                    // Add the new recipe to the beginning of the list
                    return [savedRecipe, ...recipes];
                }
            );

            // ✨ IMPORTANT: Invalidate ALL related caches to ensure live updates
            queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.userRecipes(userId)
            });

            // Invalidate analytics to refresh recipe counts immediately 
            queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.analyticsOverview(userId)
            });

            // Also invalidate all analytics data for immediate updates
            queryClient.invalidateQueries({
                predicate: (query) => {
                    const key = query.queryKey[0];
                    return typeof key === 'string' && key.includes('analytics');
                }
            });
        },

        onError: (error) => {
            console.error('Save recipe mutation error:', error);
        }
    });
}

// Hook for deleting recipe with cache updates
export function useDeleteRecipeMutation(userId) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (recipeId) => {
            const response = await fetch(`/api/recipes/${recipeId}`, {
                method: 'DELETE',
            })
            if(!response.ok) throw new Error('Failed to delete recipe')
            return recipeId;
        },

        onSuccess: (deletedRecipeId) => {
            // Remove from recipes cache instantly
            queryClient.setQueryData(
                QUERY_KEYS.userRecipes(userId),
                (old) => old?.filter(recipe => recipe.id !== deletedRecipeId) || []
            );

            // ✨ FIX: Comprehensive cache invalidation for live updates
            queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.analyticsOverview(userId)
            });
            
            // Invalidate user recipes to ensure fresh data
            queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.userRecipes(userId)
            });

            // Invalidate all analytics data for immediate count updates
            queryClient.invalidateQueries({
                predicate: (query) => {
                    const key = query.queryKey[0];
                    return typeof key === 'string' && key.includes('analytics');
                }
            });

            // Also invalidate favorites in case this recipe was favorited
            queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.favorites(userId)
            });
        }
    })
}
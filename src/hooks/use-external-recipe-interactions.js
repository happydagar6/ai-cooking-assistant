import { useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Hook to track interactions with external recipes (from web)
 * Supports: view, save, favorite, share, click_to_source
 */
export function useExternalRecipeInteractions(externalRecipeId) {
  const queryClient = useQueryClient();

  const trackInteraction = useMutation({
    mutationFn: async (interactionType) => {
      console.log('[useExternalRecipeInteractions] Tracking:', { externalRecipeId, interactionType });

      const response = await fetch('/api/external-recipes/interact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          externalRecipeId,
          interactionType, // 'view' | 'save' | 'favorite' | 'share' | 'click_to_source'
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to track interaction: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate related queries to refresh stats
      queryClient.invalidateQueries({ queryKey: ['recommendations', 'web'] });
      queryClient.invalidateQueries({ queryKey: ['recommendations', 'hybrid-trending'] });
      queryClient.invalidateQueries({ queryKey: ['recommendations', 'hybrid-popular'] });
    },
    onError: (error) => {
      console.error('[useExternalRecipeInteractions] Error:', error);
      // Don't throw - interaction tracking is non-critical
    },
  });

  return {
    track: trackInteraction.mutate,
    isPending: trackInteraction.isPending,
    isSuccess: trackInteraction.isSuccess,
  };
}

/**
 * Hook to save an external recipe to favorites
 */
export function useSaveExternalRecipe(externalRecipeId) {
  const { track, isPending } = useExternalRecipeInteractions(externalRecipeId);

  const save = () => {
    track('save');
  };

  return { save, isPending };
}

/**
 * Hook to favorite an external recipe
 */
export function useFavoriteExternalRecipe(externalRecipeId) {
  const { track, isPending } = useExternalRecipeInteractions(externalRecipeId);

  const favorite = () => {
    track('favorite');
  };

  return { favorite, isPending };
}

/**
 * Hook to share an external recipe
 */
export function useShareExternalRecipe(externalRecipeId) {
  const { track, isPending } = useExternalRecipeInteractions(externalRecipeId);

  const share = async () => {
    track('share');
    
    // Also trigger native share if available
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Recipe',
          text: 'Check out this recipe!',
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share cancelled:', err);
      }
    }
  };

  return { share, isPending };
}

/**
 * Hook to click through to original recipe source
 */
export function useClickToSource(externalRecipeId, sourceUrl) {
  const { track, isPending } = useExternalRecipeInteractions(externalRecipeId);

  const clickToSource = () => {
    track('click_to_source');
    // Open source in new tab
    window.open(sourceUrl, '_blank', 'noopener,noreferrer');
  };

  return { clickToSource, track, isPending };
}

/**
 * Hook to auto-track view of an external recipe
 * Tracks after 2 seconds of viewing
 */
export function useAutoTrackExternalRecipeView(externalRecipeId, enabled = true) {
  const { track } = useExternalRecipeInteractions(externalRecipeId);

  // Auto-track view after 2 seconds
  if (enabled && externalRecipeId) {
    setTimeout(() => {
      track('view');
    }, 2000);
  }

  return { tracked: true };
}

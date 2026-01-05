import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

/**
 * Hook to fetch recipes from web search (FireCrawl)
 * Caches results for 5 minutes (web results change frequently)
 */
export function useWebRecipes(query, options = {}) {
  const {
    limit = 12,
    maxCookTime = null,
    dietary = [],
    enabled = true,
  } = options;

  const queryKey = ['recommendations', 'web', query, { limit, maxCookTime, dietary }];

  return useQuery({
    queryKey,
    queryFn: async () => {
      if (!query || query.trim().length === 0) {
        return [];
      }

      console.log('[useWebRecipes] Fetching:', query);

      const params = new URLSearchParams({
        q: query,
        limit: String(limit),
      });

      if (maxCookTime) {
        params.append('maxCookTime', String(maxCookTime));
      }

      if (dietary && dietary.length > 0) {
        params.append('dietary', JSON.stringify(dietary));
      }

      const response = await fetch(`/api/recommendations/web-search?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch web recipes: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[useWebRecipes] Received:', data.recipes.length, 'recipes');
      return data.recipes || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes (web results change)
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    enabled: enabled && !!query && query.trim().length > 0,
  });
}

/**
 * Hook to refetch web recipes manually
 */
export function useWebRecipesRefetch() {
  const queryClient = useQueryClient();

  return useCallback((query, options = {}) => {
    const queryKey = ['recommendations', 'web', query, options];
    return queryClient.invalidateQueries({ queryKey });
  }, [queryClient]);
}

/**
 * Hook to prefetch web recipes (for search-ahead)
 */
export function usePrefetchWebRecipes() {
  const queryClient = useQueryClient();

  return useCallback((query, options = {}) => {
    const queryKey = ['recommendations', 'web', query, options];
    return queryClient.prefetchQuery({
      queryKey,
      queryFn: async () => {
        const params = new URLSearchParams({ query, limit: String(options.limit || 12) });
        const response = await fetch(`/api/recommendations/web-search?${params}`);
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        return data.recipes || [];
      },
      staleTime: 5 * 60 * 1000,
    });
  }, [queryClient]);
}

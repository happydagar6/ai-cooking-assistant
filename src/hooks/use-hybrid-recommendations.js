import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

/**
 * Hook to fetch hybrid trending recipes (internal + external blended)
 * Auto-refetches every 5 minutes (trending data is volatile)
 * Caches for 2 minutes
 */
export function useHybridTrending(limit = 12, includeWeb = true) {
  const queryKey = ['recommendations', 'hybrid-trending', { limit, includeWeb }];

  return useQuery({
    queryKey,
    queryFn: async () => {
      console.log('[useHybridTrending] Fetching trending recipes');

      const params = new URLSearchParams({
        type: 'trending',
        limit: String(limit),
        internal_ratio: includeWeb ? '60' : '100',
        external_ratio: includeWeb ? '40' : '0',
      });

      const response = await fetch(`/api/recommendations/hybrid?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch hybrid trending: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[useHybridTrending] Received:', {
        total: data.stats.total,
        internal: data.stats.internal,
        external: data.stats.external,
      });
      return data.recipes || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes (trending is volatile)
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refetch every 5 minutes
    retry: 2,
    enabled: includeWeb !== null,
  });
}

/**
 * Hook to fetch hybrid popular recipes (internal + external blended)
 * Caches for 30 minutes (popular data is stable)
 */
export function useHybridPopular(limit = 12, includeWeb = true) {
  const queryKey = ['recommendations', 'hybrid-popular', { limit, includeWeb }];

  return useQuery({
    queryKey,
    queryFn: async () => {
      console.log('[useHybridPopular] Fetching popular recipes');

      const params = new URLSearchParams({
        type: 'popular',
        limit: String(limit),
        internal_ratio: includeWeb ? '60' : '100',
        external_ratio: includeWeb ? '40' : '0',
      });

      const response = await fetch(`/api/recommendations/hybrid?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch hybrid popular: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[useHybridPopular] Received:', {
        total: data.stats.total,
        internal: data.stats.internal,
        external: data.stats.external,
      });
      return data.recipes || [];
    },
    staleTime: 30 * 60 * 1000, // 30 minutes (popular data is stable)
    gcTime: 60 * 60 * 1000, // 1 hour
    retry: 2,
    enabled: includeWeb !== null,
  });
}

/**
 * Hook to prefetch hybrid trending recipes
 * Useful for page load or route prefetch
 */
export function usePrefetchHybridTrending(limit = 12, includeWeb = true) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const queryKey = ['recommendations', 'hybrid-trending', { limit, includeWeb }];
    
    // Prefetch on component mount
    queryClient.prefetchQuery({
      queryKey,
      queryFn: async () => {
        const params = new URLSearchParams({
          type: 'trending',
          limit: String(limit),
          internal_ratio: includeWeb ? '60' : '100',
          external_ratio: includeWeb ? '40' : '0',
        });

        const response = await fetch(`/api/recommendations/hybrid?${params}`);
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        return data.recipes || [];
      },
      staleTime: 2 * 60 * 1000,
    });
  }, [queryClient, limit, includeWeb]);
}

/**
 * Hook to prefetch hybrid popular recipes
 * Useful for page load or route prefetch
 */
export function usePrefetchHybridPopular(limit = 12, includeWeb = true) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const queryKey = ['recommendations', 'hybrid-popular', { limit, includeWeb }];
    
    // Prefetch on component mount
    queryClient.prefetchQuery({
      queryKey,
      queryFn: async () => {
        const params = new URLSearchParams({
          type: 'popular',
          limit: String(limit),
          internal_ratio: includeWeb ? '60' : '100',
          external_ratio: includeWeb ? '40' : '0',
        });

        const response = await fetch(`/api/recommendations/hybrid?${params}`);
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        return data.recipes || [];
      },
      staleTime: 30 * 60 * 1000,
    });
  }, [queryClient, limit, includeWeb]);
}

/**
 * Hook to toggle hybrid mode on/off
 * Returns {hybridMode, toggleHybridMode}
 */
export function useHybridMode(defaultEnabled = true) {
  const queryClient = useQueryClient();

  const toggleHybridMode = (enabled) => {
    // Invalidate all hybrid caches when toggling
    queryClient.invalidateQueries({ queryKey: ['recommendations', 'hybrid-trending'] });
    queryClient.invalidateQueries({ queryKey: ['recommendations', 'hybrid-popular'] });
    
    // Store preference in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('hybridModeEnabled', JSON.stringify(enabled));
    }
  };

  // Read from localStorage on mount
  const getHybridMode = () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('hybridModeEnabled');
      return stored !== null ? JSON.parse(stored) : defaultEnabled;
    }
    return defaultEnabled;
  };

  return {
    enabled: getHybridMode(),
    toggle: toggleHybridMode,
  };
}

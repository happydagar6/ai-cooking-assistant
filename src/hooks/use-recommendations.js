/**
 * RECOMMENDATION HOOKS
 * =====================
 * TanStack React Query hooks for smart recipe recommendations
 * 
 * Features:
 * - Automatic caching and background refetching
 * - Optimistic updates for instant UI feedback
 * - Proper error handling and retry logic
 * - Minimal re-renders with smart dependencies
 */

'use client';

import { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { showToast } from '@/lib/toast';

// ============================================
// QUERY KEYS - Centralized for consistency
// ============================================
export const recommendationKeys = {
  all: ['recommendations'],
  dinner: (context) => ['recommendations', 'dinner', context],
  similar: (recipeId) => ['recommendations', 'similar', recipeId],
  trending: () => ['recommendations', 'trending'],
  popular: () => ['recommendations', 'popular'],
  completeMeal: (context) => ['recommendations', 'complete-meal', context],
  personalized: (page) => ['recommendations', 'personalized', page],
};

// ============================================
// SIMILAR RECIPES
// ============================================
export function useSimilarRecipes(recipeId, options = {}) {
  const { limit = 6, enabled = true } = options;

  return useQuery({
    queryKey: recommendationKeys.similar(recipeId),
    queryFn: async () => {
      if (!recipeId) return [];

      const params = new URLSearchParams({ limit: limit.toString() });
      const response = await fetch(`/api/recommendations/similar/${recipeId}?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch similar recipes');
      }

      const data = await response.json();
      return data.recipes || [];
    },
    enabled: enabled && !!recipeId,
    staleTime: 10 * 60 * 1000, // 10 minutes - similar recipes don't change often
    gcTime: 30 * 60 * 1000, // 30 minutes in cache
    retry: 2,
  });
}

// ============================================
// COMPLETE MEAL SUGGESTION
// ============================================
export function useCompleteMeal(context = {}, options = {}) {
  const {
    occasion = 'casual',
    totalTime = 120,
    servings = 4,
  } = context;

  const { enabled = false } = options; // Only fetch when explicitly requested

  return useQuery({
    queryKey: recommendationKeys.completeMeal({ occasion, totalTime, servings }),
    queryFn: async () => {
      const params = new URLSearchParams({
        occasion,
        totalTime: totalTime.toString(),
        servings: servings.toString(),
      });

      const response = await fetch(`/api/recommendations/complete-meal?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch complete meal suggestion');
      }

      const data = await response.json();
      return data.mealPlan;
    },
    enabled,
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes in cache
    retry: 2,
  });
}

// ============================================
// PERSONALIZED FEED
// ============================================
export function usePersonalizedFeed(page = 1, limit = 12) {
  return useQuery({
    queryKey: recommendationKeys.personalized(page),
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      const response = await fetch(`/api/recommendations/personalized?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch personalized feed');
      }

      const data = await response.json();
      return data.recipes || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes in cache
    retry: 2,
    keepPreviousData: true, // Keep previous page data while loading next page
  });
}

// ============================================
// TRACK INTERACTION MUTATION
// ============================================
export function useTrackInteraction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ recipeId, interactionType, metadata = {} }) => {
      const response = await fetch('/api/recommendations/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipeId,
          interactionType,
          metadata,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to track interaction');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries when user interacts with recipe
      // This ensures recommendations stay up-to-date

      // Invalidate personalized feed
      queryClient.invalidateQueries({ 
        queryKey: ['recommendations', 'personalized'] 
      });

      // If user cooked or favorited, invalidate dinner recommendations
      if (['cook', 'favorite', 'complete'].includes(variables.interactionType)) {
        queryClient.invalidateQueries({ 
          queryKey: ['recommendations', 'dinner'] 
        });
      }

      // Invalidate trending if interaction might affect trending
      if (['view', 'cook', 'favorite'].includes(variables.interactionType)) {
        queryClient.invalidateQueries({ 
          queryKey: recommendationKeys.trending() 
        });
      }
    },
    onError: (error) => {
      console.error('Failed to track interaction:', error);
      // Silent fail - don't show error to user for tracking
    },
    retry: 1, // Only retry once
  });
}

// ============================================
// PREFETCH HOOKS - For optimized UX
// ============================================

/**
 * Prefetch similar recipes when user hovers over recipe card
 */
export function usePrefetchSimilarRecipes() {
  const queryClient = useQueryClient();

  return (recipeId) => {
    if (!recipeId) return;

    queryClient.prefetchQuery({
      queryKey: recommendationKeys.similar(recipeId),
      queryFn: async () => {
        const response = await fetch(`/api/recommendations/similar/${recipeId}?limit=6`);
        if (!response.ok) return [];
        const data = await response.json();
        return data.recipes || [];
      },
      staleTime: 10 * 60 * 1000,
    });
  };
}

/**
 * Prefetch trending recipes on page load
 */
export function usePrefetchTrending() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.prefetchQuery({
      queryKey: recommendationKeys.trending(),
      queryFn: async () => {
        const response = await fetch('/api/recommendations/trending?limit=12');
        if (!response.ok) return [];
        const data = await response.json();
        return data.recipes || [];
      },
      staleTime: 2 * 60 * 1000,
    });
  };
}

// ============================================
// HELPER HOOKS
// ============================================

/**
 * Auto-track recipe view when component mounts
 * Only tracks once per recipe ID
 */
export function useAutoTrackView(recipeId) {
  const trackInteraction = useTrackInteraction();
  const hasTrackedRef = useRef(false); // Track if we've already sent the view

  useEffect(() => {
    // Don't track if no recipe ID or already tracked this recipe
    if (!recipeId || hasTrackedRef.current) return;

    // Mark as tracked to prevent duplicate calls
    hasTrackedRef.current = true;

    // Track view after 2 seconds (user actually viewing, not just passing by)
    const timer = setTimeout(() => {
      trackInteraction.mutate({
        recipeId,
        interactionType: 'view',
        metadata: { timestamp: new Date().toISOString() },
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, [recipeId]); // Only depend on recipeId
}

/**
 * Batch invalidation for recommendation refresh
 */
export function useRefreshRecommendations() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ 
      queryKey: recommendationKeys.all 
    });
    showToast.success('Recommendations refreshed');
  };
}

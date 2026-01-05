'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// ============================================
// COLLECTION HOOKS
// ============================================

/**
 * Fetch all collections for current user
 * Cached for 5 minutes, auto-refetches on window focus
 */
export function useCollections() {
  return useQuery({
    queryKey: ['collections'],
    queryFn: async () => {
      const response = await fetch('/api/collections');
      if (!response.ok) {
        throw new Error('Failed to fetch collections');
      }
      const data = await response.json();
      return data.collections || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Fetch single collection with recipes
 * @param {string} collectionId - Collection ID
 */
export function useCollection(collectionId) {
  return useQuery({
    queryKey: ['collections', collectionId],
    queryFn: async () => {
      const response = await fetch(`/api/collections/${collectionId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch collection');
      }
      return response.json();
    },
    enabled: !!collectionId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Create new collection
 * Optimistically updates cache
 */
export function useCreateCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (collectionData) => {
      const response = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(collectionData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create collection');
      }

      return response.json();
    },
    onMutate: async (newCollection) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['collections'] });

      // Snapshot previous value
      const previousCollections = queryClient.getQueryData(['collections']);

      // Optimistically update
      queryClient.setQueryData(['collections'], (old = []) => [
        {
          id: `temp-${Date.now()}`,
          ...newCollection,
          recipe_count: 0,
          created_at: new Date().toISOString(),
        },
        ...old,
      ]);

      return { previousCollections };
    },
    onError: (err, newCollection, context) => {
      // Rollback on error
      queryClient.setQueryData(['collections'], context.previousCollections);
      toast.error(err.message || 'Failed to create collection');
    },
    onSuccess: (data) => {
      toast.success(`Collection "${data.collection.name}" created!`);
    },
    onSettled: () => {
      // Refetch to sync with server
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });
}

/**
 * Update collection
 */
export function useUpdateCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ collectionId, updates }) => {
      const response = await fetch(`/api/collections/${collectionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update collection');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      toast.success('Collection updated');
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['collections', variables.collectionId] });
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to update collection');
    },
  });
}

/**
 * Delete collection
 */
export function useDeleteCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (collectionId) => {
      const response = await fetch(`/api/collections/${collectionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete collection');
      }

      return response.json();
    },
    onMutate: async (collectionId) => {
      await queryClient.cancelQueries({ queryKey: ['collections'] });
      const previousCollections = queryClient.getQueryData(['collections']);

      // Optimistically remove
      queryClient.setQueryData(['collections'], (old = []) =>
        old.filter((c) => c.id !== collectionId)
      );

      return { previousCollections };
    },
    onError: (err, collectionId, context) => {
      queryClient.setQueryData(['collections'], context.previousCollections);
      toast.error(err.message || 'Failed to delete collection');
    },
    onSuccess: () => {
      toast.success('Collection deleted');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });
}

/**
 * Add recipe to collection
 */
export function useAddRecipeToCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ collectionId, recipeId }) => {
      const response = await fetch(`/api/collections/${collectionId}/recipes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add recipe to collection');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      toast.success('Recipe added to collection');
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['collections', variables.collectionId] });
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to add recipe');
    },
  });
}

/**
 * Remove recipe from collection
 */
export function useRemoveRecipeFromCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ collectionId, recipeId }) => {
      const response = await fetch(
        `/api/collections/${collectionId}/recipes?recipeId=${recipeId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove recipe from collection');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      toast.success('Recipe removed from collection');
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['collections', variables.collectionId] });
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to remove recipe');
    },
  });
}

/**
 * Reorder recipes in collection
 */
export function useReorderCollectionRecipes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ collectionId, recipePositions }) => {
      const response = await fetch(`/api/collections/${collectionId}/recipes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipePositions }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reorder recipes');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['collections', variables.collectionId] });
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to reorder recipes');
    },
  });
}

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// ============================================
// RECIPE NOTES HOOKS
// ============================================

/**
 * Fetch all notes for a recipe
 * @param {string} recipeId - Recipe ID
 */
export function useRecipeNotes(recipeId) {
  return useQuery({
    queryKey: ['recipe-notes', recipeId],
    queryFn: async () => {
      const response = await fetch(`/api/recipes/${recipeId}/notes`);
      if (!response.ok) {
        throw new Error('Failed to fetch recipe notes');
      }
      const data = await response.json();
      return data.notes || [];
    },
    enabled: !!recipeId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Create new recipe note
 */
export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ recipeId, noteData }) => {
      const response = await fetch(`/api/recipes/${recipeId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noteData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create note');
      }

      return response.json();
    },
    onMutate: async ({ recipeId, noteData }) => {
      await queryClient.cancelQueries({ queryKey: ['recipe-notes', recipeId] });
      const previousNotes = queryClient.getQueryData(['recipe-notes', recipeId]);

      // Optimistically add note
      queryClient.setQueryData(['recipe-notes', recipeId], (old = []) => [
        {
          id: `temp-${Date.now()}`,
          ...noteData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        ...old,
      ]);

      return { previousNotes, recipeId };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['recipe-notes', context.recipeId], context.previousNotes);
      toast.error(err.message || 'Failed to create note');
    },
    onSuccess: () => {
      toast.success('Note added');
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['recipe-notes', variables.recipeId] });
    },
  });
}

/**
 * Update recipe note
 */
export function useUpdateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ noteId, recipeId, updates }) => {
      const response = await fetch(`/api/recipes/notes/${noteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update note');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      toast.success('Note updated');
      queryClient.invalidateQueries({ queryKey: ['recipe-notes', variables.recipeId] });
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to update note');
    },
  });
}

/**
 * Delete recipe note
 */
export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ noteId, recipeId }) => {
      const response = await fetch(`/api/recipes/notes/${noteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete note');
      }

      return response.json();
    },
    onMutate: async ({ noteId, recipeId }) => {
      await queryClient.cancelQueries({ queryKey: ['recipe-notes', recipeId] });
      const previousNotes = queryClient.getQueryData(['recipe-notes', recipeId]);

      // Optimistically remove
      queryClient.setQueryData(['recipe-notes', recipeId], (old = []) =>
        old.filter((note) => note.id !== noteId)
      );

      return { previousNotes, recipeId };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['recipe-notes', context.recipeId], context.previousNotes);
      toast.error(err.message || 'Failed to delete note');
    },
    onSuccess: () => {
      toast.success('Note deleted');
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['recipe-notes', variables.recipeId] });
    },
  });
}

/**
 * Toggle note pin status
 */
export function useTogglePinNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ noteId, recipeId, isPinned }) => {
      const response = await fetch(`/api/recipes/notes/${noteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to pin note');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['recipe-notes', variables.recipeId] });
    },
  });
}

// ============================================
// RECIPE MODIFICATIONS HOOKS
// ============================================

/**
 * Fetch active recipe modification
 * @param {string} recipeId - Recipe ID
 */
export function useRecipeModification(recipeId) {
  return useQuery({
    queryKey: ['recipe-modification', recipeId],
    queryFn: async () => {
      const response = await fetch(`/api/recipes/${recipeId}/modifications`);
      if (!response.ok) {
        throw new Error('Failed to fetch recipe modification');
      }
      const data = await response.json();
      return data.modification;
    },
    enabled: !!recipeId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Create recipe modification
 */
export function useCreateModification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ recipeId, modificationData }) => {
      const response = await fetch(`/api/recipes/${recipeId}/modifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modificationData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save modification');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      toast.success('Recipe modification saved as "My Version"');
      queryClient.invalidateQueries({ queryKey: ['recipe-modification', variables.recipeId] });
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to save modification');
    },
  });
}

/**
 * Toggle modification active state
 */
export function useToggleModification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ recipeId, modificationId, isActive }) => {
      const response = await fetch(`/api/recipes/${recipeId}/modifications`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modificationId, isActive }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to toggle modification');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      const message = variables.isActive
        ? 'Using your custom version'
        : 'Using original recipe';
      toast.success(message);
      queryClient.invalidateQueries({ queryKey: ['recipe-modification', variables.recipeId] });
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to toggle modification');
    },
  });
}

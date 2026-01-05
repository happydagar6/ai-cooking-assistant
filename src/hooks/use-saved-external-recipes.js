import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';

/**
 * Hook to fetch user's saved external recipes
 * Gets recipes from user_external_favorites linked to external_recipes
 */
export function useSavedExternalRecipes() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['saved-external-recipes', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      console.log('[useSavedExternalRecipes] Fetching for user:', user.id);

      const response = await fetch('/api/external-recipes/saved', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch saved recipes: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[useSavedExternalRecipes] Found', data.recipes?.length || 0, 'saved recipes');
      return data.recipes || [];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

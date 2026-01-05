'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Clock, Users, ChefHat, ExternalLink, Heart, Trash2, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { showToast } from '@/lib/toast';

/**
 * Component to display saved external recipes
 * Mobile-first design with interactive cards
 */
export function SavedExternalRecipesSection({ recipes = [], isLoading = false, onViewRecipe = null, onRemoveFavorite = null }) {
  const [removingIds, setRemovingIds] = useState(new Set());

  const handleRemove = async (recipe) => {
    if (!recipe?.id) return;

    try {
      setRemovingIds(prev => new Set([...prev, recipe.id]));

      const response = await fetch(`/api/external-recipes/favorites?id=${recipe.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove from favorites');
      }

      showToast.success('Recipe removed from saved');
      if (onRemoveFavorite) {
        onRemoveFavorite(recipe.id);
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
      showToast.error('Could not remove recipe');
    } finally {
      setRemovingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(recipe.id);
        return newSet;
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Saved Recipes from Web</h2>
        <div className="flex justify-center py-12">
          <Loader className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  if (!recipes || recipes.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Saved Recipes from Web</h2>
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-8 text-center">
          <Heart className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600 dark:text-gray-400 mb-2">No saved web recipes yet</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Search for recipes and click the heart icon to save your favorites
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 mb-12">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Saved Recipes from Web
        </h2>
        <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-medium">
          {recipes.length} saved
        </span>
      </div>

      {/* Mobile-optimized grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {recipes.map((recipe) => (
          <div
            key={recipe.id}
            className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700 flex flex-col"
          >
            {/* Recipe Image */}
            <div className="relative bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/20 dark:to-amber-900/20 h-48 sm:h-40 overflow-hidden">
              {recipe.image_url ? (
                <Image
                  src={recipe.image_url}
                  alt={recipe.title}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ChefHat className="w-12 h-12 text-orange-300" />
                </div>
              )}
              
              {/* Remove Button */}
              <button
                onClick={() => handleRemove(recipe)}
                disabled={removingIds.has(recipe.id)}
                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white rounded-full p-2 transition-colors shadow-lg"
              >
                {removingIds.has(recipe.id) ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Recipe Info */}
            <div className="p-4 flex-1 flex flex-col">
              <h3 className="font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 text-sm sm:text-base">
                {recipe.title}
              </h3>

              {/* Source */}
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                From {recipe.source_domain}
              </p>

              {/* Recipe Meta */}
              <div className="flex flex-wrap gap-2 text-xs text-gray-600 dark:text-gray-400 mb-4">
                {recipe.prep_time && (
                  <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    <Clock className="w-3 h-3" />
                    <span>{recipe.prep_time}m prep</span>
                  </div>
                )}
                {recipe.cook_time && (
                  <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    <Clock className="w-3 h-3" />
                    <span>{recipe.cook_time}m cook</span>
                  </div>
                )}
                {recipe.servings && (
                  <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    <Users className="w-3 h-3" />
                    <span>{recipe.servings}</span>
                  </div>
                )}
                {recipe.difficulty && (
                  <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    <span className="capitalize">{recipe.difficulty}</span>
                  </div>
                )}
              </div>

              {/* Dietary Tags */}
              {recipe.dietary_tags && recipe.dietary_tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {recipe.dietary_tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs px-2 py-1 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                  {recipe.dietary_tags.length > 2 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      +{recipe.dietary_tags.length - 2}
                    </span>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs sm:text-sm"
                  onClick={() => onViewRecipe?.(recipe)}
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  View
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs sm:text-sm"
                  onClick={() => window.open(recipe.source_url, '_blank', 'noopener,noreferrer')}
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Original
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

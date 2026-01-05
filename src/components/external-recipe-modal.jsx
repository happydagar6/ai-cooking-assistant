'use client';

import { useState, useEffect } from 'react';
import { X, Clock, Users, ChefHat, Flame, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { showToast } from '@/lib/toast';

/**
 * Modal to display full external recipe details
 */
export function ExternalRecipeModal({ recipe, isOpen, onClose, onFavoriteChange }) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [isSavingFavorite, setIsSavingFavorite] = useState(false);

  // Check if recipe is already favorited
  useEffect(() => {
    if (!isOpen || !recipe?.id) return;

    const checkFavorite = async () => {
      try {
        const response = await fetch(`/api/external-recipes/favorites?id=${recipe.id}`);
        const data = await response.json();
        setIsFavorited(data.isFavorited || false);
      } catch (error) {
        console.error('Error checking favorite status:', error);
      }
    };

    checkFavorite();
  }, [isOpen, recipe?.id]);

  const handleToggleFavorite = async () => {
    if (!recipe) return;

    try {
      setIsSavingFavorite(true);

      if (isFavorited) {
        // Remove from favorites
        const response = await fetch(`/api/external-recipes/favorites?id=${recipe.id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to remove from favorites');
        }

        setIsFavorited(false);
        showToast.success('Removed from favorites');
      } else {
        // Add to favorites
        const response = await fetch('/api/external-recipes/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            externalRecipeId: recipe.id,
            recipe,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to save favorite');
        }

        setIsFavorited(true);
        showToast.success('Added to favorites!');
      }

      // Notify parent component about the change
      if (onFavoriteChange) {
        onFavoriteChange();
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      showToast.error(error.message || 'Could not update favorite');
    } finally {
      setIsSavingFavorite(false);
    }
  };

  if (!isOpen || !recipe) return null;

  const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end md:items-center justify-center">
      <div className="bg-white dark:bg-gray-900 w-full md:max-w-2xl max-h-[90vh] md:max-h-[80vh] overflow-y-auto rounded-t-2xl md:rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b dark:border-gray-800 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold truncate">{recipe.title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Source attribution */}
          <div className="text-sm text-gray-600 dark:text-gray-400">
            From <span className="font-semibold">{recipe.source_domain}</span>
          </div>

          {/* Quick info */}
          <div className="grid grid-cols-4 gap-3 md:gap-4">
            {recipe.prep_time > 0 && (
              <div className="flex flex-col items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400 mb-1" />
                <span className="text-xs md:text-sm font-semibold">{recipe.prep_time}m prep</span>
              </div>
            )}
            {recipe.cook_time > 0 && (
              <div className="flex flex-col items-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <Flame className="w-4 h-4 text-orange-600 dark:text-orange-400 mb-1" />
                <span className="text-xs md:text-sm font-semibold">{recipe.cook_time}m cook</span>
              </div>
            )}
            {recipe.servings > 0 && (
              <div className="flex flex-col items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <Users className="w-4 h-4 text-green-600 dark:text-green-400 mb-1" />
                <span className="text-xs md:text-sm font-semibold">{recipe.servings} servings</span>
              </div>
            )}
            {recipe.difficulty && (
              <div className="flex flex-col items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <ChefHat className="w-4 h-4 text-purple-600 dark:text-purple-400 mb-1" />
                <span className="text-xs md:text-sm font-semibold capitalize">{recipe.difficulty}</span>
              </div>
            )}
          </div>

          {/* Description */}
          {recipe.description && (
            <div>
              <h3 className="font-semibold mb-2">About</h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                {recipe.description}
              </p>
            </div>
          )}

          {/* Ingredients */}
          {recipe.ingredients && recipe.ingredients.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 text-lg">Ingredients</h3>
              <ul className="space-y-2">
                {recipe.ingredients.map((ingredient, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      className="mt-1 w-4 h-4 rounded border-gray-300 cursor-pointer"
                      defaultChecked={false}
                    />
                    <span>{ingredient}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Instructions */}
          {recipe.instructions && recipe.instructions.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 text-lg">Instructions</h3>
              <ol className="space-y-3">
                {recipe.instructions.map((instruction, idx) => {
                  const step = instruction.instruction || instruction;
                  const stepNum = instruction.stepNumber || idx + 1;
                  return (
                    <li key={idx} className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center font-semibold text-sm">
                        {stepNum}
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 pt-1">
                        {typeof step === 'string' ? step : step.text || step}
                      </p>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}

          {/* Dietary tags */}
          {recipe.dietary_tags && recipe.dietary_tags.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2 text-sm">Dietary Tags</h4>
              <div className="flex flex-wrap gap-2">
                {recipe.dietary_tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs px-3 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t dark:border-gray-800">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => window.open(recipe.source_url, '_blank', 'noopener,noreferrer')}
            >
              View Original
            </Button>
            <Button
              variant={isFavorited ? 'default' : 'outline'}
              className="flex-1"
              onClick={handleToggleFavorite}
              disabled={isSavingFavorite}
            >
              {isSavingFavorite ? (
                <>
                  <div className="w-3 h-3 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : isFavorited ? (
                <>
                  <Heart className="w-4 h-4 mr-2 fill-current" />
                  Saved to Favorites
                </>
              ) : (
                <>
                  <Heart className="w-4 h-4 mr-2" />
                  Save Recipe
                </>
              )}
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

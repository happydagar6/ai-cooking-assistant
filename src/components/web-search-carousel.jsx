'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { Star, Globe, Clock, Users, ExternalLink, Heart, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useClickToSource, useShareExternalRecipe } from '@/hooks/use-external-recipe-interactions';
import { showToast } from '@/lib/toast';

/**
 * WebSearchCarousel Component
 * Displays horizontally scrollable web recipes from FireCrawl
 * Mobile: Touch swipe support
 * Desktop: Mouse wheel and scroll support
 */
export function WebSearchCarousel({ recipes = [], isLoading = false, onRecipeClick = null, onViewRecipe = null }) {
  const scrollContainerRef = useRef(null);
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  const scroll = (direction) => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = 400;
    scrollContainerRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse" />
        <div className="flex gap-4 overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-80 h-96 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!recipes || recipes.length === 0) {
    return (
      <div className="text-center py-12">
        <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">No web recipes found. Try a different search.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold">Web Recipes</h3>
          <span className="text-sm text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
            {recipes.length} found
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => scroll('left')}
            className="hidden md:inline-flex p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
          >
            ←
          </button>
          <button
            onClick={() => scroll('right')}
            className="hidden md:inline-flex p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
          >
            →
          </button>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory [-webkit-overflow-scrolling:touch]"
      >
        {recipes.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            onRecipeClick={onRecipeClick}
            onViewRecipe={onViewRecipe}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Individual recipe card for web results
 */
function RecipeCard({ recipe, onRecipeClick, onViewRecipe }) {
  const { clickToSource, track } = useClickToSource(recipe.id, recipe.source_url || recipe.sourceUrl);
  const { share } = useShareExternalRecipe(recipe.id);
  const [isLoading, setIsLoading] = useState(false);

  const handleSourceClick = async (recipe) => {
    try {
      // Delegate modal display to parent component
      if (onViewRecipe) {
        onViewRecipe(recipe);
      } else {
        // Fallback: open in new tab
        window.open(recipe.source_url || recipe.sourceUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error('Error handling recipe view:', error);
      showToast.error('Could not load recipe');
    }
  };

  const handleShare = () => {
    share();
    showToast.success('Recipe shared!');
  };

  const totalTime = (recipe.prep_time || recipe.prepTime || 0) + (recipe.cook_time || recipe.cookTime || 0);

  return (
    <div className="flex-shrink-0 w-72 snap-start">
      <div
        className="bg-white dark:bg-gray-900 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition h-full flex flex-col cursor-pointer group"
        onClick={() => onRecipeClick?.(recipe)}
      >
        {/* Image */}
        <div className="relative h-48 bg-gray-200 dark:bg-gray-800 overflow-hidden">
          {recipe.image_url || recipe.imageUrl ? (
            <Image
              src={recipe.image_url || recipe.imageUrl}
              alt={recipe.title}
              fill
              className="object-cover group-hover:scale-105 transition duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Globe className="w-12 h-12 text-gray-400" />
            </div>
          )}

          {/* Source badge */}
          <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs font-semibold px-2 py-1 rounded">
            {recipe.source_domain || recipe.sourceDomain || 'Web'}
          </div>

          {/* Trust score badge */}
          {recipe.trustScore && (
            <div className="absolute top-2 left-2 bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded flex items-center gap-1">
              <Star className="w-3 h-3 fill-current" />
              {(recipe.trustScore * 100).toFixed(0)}%
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-3 flex flex-col">
          {/* Title */}
          <h4 className="font-semibold text-sm line-clamp-2 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400">
            {recipe.title}
          </h4>

          {/* Metadata */}
          <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400 mb-3">
            {totalTime > 0 && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{totalTime} min</span>
              </div>
            )}

            {recipe.servings && (
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>Serves {recipe.servings}</span>
              </div>
            )}

            {recipe.difficulty && (
              <div className="text-xs text-gray-600 dark:text-gray-400">
                <span className={`inline-block px-2 py-0.5 rounded text-white text-xs font-semibold ${
                  recipe.difficulty === 'easy' ? 'bg-green-500' :
                  recipe.difficulty === 'medium' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}>
                  {recipe.difficulty.charAt(0).toUpperCase() + recipe.difficulty.slice(1)}
                </span>
              </div>
            )}
          </div>

          {/* Dietary tags */}
          {(recipe.dietary_tags || recipe.dietaryTags) && (recipe.dietary_tags || recipe.dietaryTags).length > 0 && (
            <div className="mb-3 flex gap-1 flex-wrap">
              {(recipe.dietary_tags || recipe.dietaryTags).slice(0, 2).map((tag) => (
                <span key={tag} className="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs px-2 py-0.5 rounded">
                  {tag}
                </span>
              ))}
              {(recipe.dietary_tags || recipe.dietaryTags).length > 2 && (
                <span className="text-xs text-gray-600 dark:text-gray-400">+{(recipe.dietary_tags || recipe.dietaryTags).length - 2}</span>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 mt-auto">
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                handleSourceClick(recipe);
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="w-3 h-3 mr-1 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <ExternalLink className="w-3 h-3 mr-1" />
                  View
                </>
              )}
            </Button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleShare();
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition text-gray-600 dark:text-gray-400"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * SIMILAR RECIPES SECTION
 * =======================
 * Shows similar recipes on the cook page
 * Horizontal scrollable on mobile, grid on desktop
 */

'use client';

import React, { useRef } from 'react';
import { useSimilarRecipes, usePrefetchSimilarRecipes, useTrackInteraction } from '@/hooks/use-recommendations';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, 
  Clock, 
  Users, 
  ChefHat,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Target
} from 'lucide-react';
import Link from 'next/link';

export function SimilarRecipesSection({ recipeId, className = '' }) {
  const { data: recipes = [], isLoading } = useSimilarRecipes(recipeId, 6);
  const prefetchSimilar = usePrefetchSimilarRecipes();
  const scrollContainerRef = useRef(null);

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!recipeId) return null;

  return (
    <div className={`${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Similar Recipes</h3>
            <p className="text-xs text-gray-600">You might also like these</p>
          </div>
        </div>

        {/* Scroll Buttons (Desktop) */}
        {recipes.length > 0 && (
          <div className="hidden md:flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => scroll('left')}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => scroll('right')}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex gap-4 overflow-hidden">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-72 h-56 bg-gray-200 rounded-lg animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Recipe Cards - Horizontal Scroll on Mobile, Grid on Desktop */}
      {!isLoading && recipes.length > 0 && (
        <>
          {/* Mobile: Horizontal Scroll */}
          <div
            ref={scrollContainerRef}
            className="md:hidden flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {recipes.map((recipe, index) => (
              <SimilarRecipeCard
                key={recipe.id}
                recipe={recipe}
                index={index}
                sourceRecipeId={recipeId}
                onHover={() => prefetchSimilar(recipe.id)}
              />
            ))}
          </div>

          {/* Desktop: Grid */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recipes.map((recipe, index) => (
              <SimilarRecipeCard
                key={recipe.id}
                recipe={recipe}
                index={index}
                sourceRecipeId={recipeId}
                onHover={() => prefetchSimilar(recipe.id)}
              />
            ))}
          </div>
        </>
      )}

      {/* Empty State */}
      {!isLoading && recipes.length === 0 && (
        <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
          <Target className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <p className="text-sm text-gray-600">No similar recipes found</p>
          <p className="text-xs text-gray-500 mt-1">Try exploring trending recipes instead</p>
        </div>
      )}
    </div>
  );
}

function SimilarRecipeCard({ recipe, index, sourceRecipeId, onHover }) {
  const trackInteraction = useTrackInteraction();

  const handleClick = () => {
    trackInteraction.mutate({
      recipeId: recipe.id,
      interactionType: 'view',
      metadata: {
        source: 'similar_recipes',
        source_recipe_id: sourceRecipeId,
        position: index,
        similarity_score: recipe.similarity_score,
      },
    });
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const similarityPercentage = Math.round((recipe.similarity_score / 100) * 100);

  return (
    <Link 
      href={`/cook/${recipe.id}`} 
      onClick={handleClick}
      onMouseEnter={onHover}
    >
      <Card className="md:flex-none flex-shrink-0 w-72 md:w-full hover:shadow-xl transition-all duration-300 border-0 bg-white snap-start group h-full">
        <CardContent className="p-4 flex flex-col h-full">
          {/* Image Placeholder / Gradient */}
          <div className="relative mb-3 rounded-lg overflow-hidden bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 h-36">
            <div className="absolute inset-0 flex items-center justify-center">
              <ChefHat className="h-14 w-14 text-purple-300 group-hover:scale-110 transition-transform" />
            </div>
            
            {/* Similarity Score Badge */}
            <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1.5 shadow-sm">
              <Target className="h-3.5 w-3.5 text-purple-600" />
              <span className="text-xs font-bold text-gray-800">
                {similarityPercentage}% match
              </span>
            </div>

            {/* Difficulty Badge */}
            <div className="absolute bottom-2 left-2">
              <Badge className={`${getDifficultyColor(recipe.difficulty)} text-xs`}>
                {recipe.difficulty}
              </Badge>
            </div>
          </div>

          {/* Recipe Info */}
          <div className="space-y-2 flex-1 flex flex-col">
            <h4 className="font-bold text-sm text-gray-900 line-clamp-2 group-hover:text-purple-600 transition-colors">
              {recipe.title}
            </h4>

            <p className="text-xs text-gray-600 line-clamp-2 flex-1">
              {recipe.description}
            </p>

            {/* Stats */}
            <div className="flex items-center gap-4 text-xs text-gray-600 pt-2 border-t border-gray-100 mt-auto">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-purple-500" />
                <span>{recipe.prep_time + recipe.cook_time}m</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3 text-purple-500" />
                <span>{recipe.servings}</span>
              </div>
              <div className="flex-1 text-right">
                <Badge variant="secondary" className="text-xs">
                  {recipe.cuisine_type}
                </Badge>
              </div>
            </div>

            {/* Similarity Reasons (if available) */}
            {recipe.similarity_reasons && recipe.similarity_reasons.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Similar because:</p>
                <div className="flex flex-wrap gap-1">
                  {recipe.similarity_reasons.slice(0, 2).map((reason, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {reason}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// Add scrollbar hide style
const style = `
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

if (typeof document !== 'undefined' && !document.getElementById('similar-recipes-style')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'similar-recipes-style';
  styleSheet.textContent = style;
  document.head.appendChild(styleSheet);
}

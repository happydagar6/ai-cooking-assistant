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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-teal-600 rounded-lg flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Similar Recipes</h3>
            <p className="text-sm text-gray-700">You might also like these recipes</p>
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
            className="md:hidden flex flex-nowrap gap-3 overflow-x-auto overflow-y-hidden pb-3 scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
          >
            {recipes.map((recipe, index) => (
              <SimilarRecipeCard
                key={recipe.id}
                recipe={recipe}
                index={index}
                sourceRecipeId={recipeId}
                isMobile={true}
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
                isMobile={false}
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

function SimilarRecipeCard({ recipe, index, sourceRecipeId, isMobile = false, onHover }) {
  const trackInteraction = useTrackInteraction();

  const handleClick = () => {
    trackInteraction.mutate({
      recipeId: recipe.id,
      interactionType: 'view',
      metadata: {
        source: 'similar_recipes',
        source_recipe_id: sourceRecipeId,
        position: index,
        similarity_score: recipe.similarityScore,
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

  const similarityPercentage = recipe.similarityScore ? Math.round(recipe.similarityScore) : 0;

  if (isMobile) {
    // Mobile: Simple div-based card without Card component bloat
    return (
      <Link 
        href={`/cook/${recipe.id}`} 
        onClick={handleClick}
        onMouseEnter={onHover}
        className="flex-shrink-0 block"
        style={{ minWidth: '240px', maxWidth: '240px' }}
      >
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden hover:shadow-lg transition-all duration-300 h-full flex flex-col">
          {/* Image Placeholder / Gradient */}
          <div className="relative bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 h-32 flex-shrink-0">
            <div className="absolute inset-0 flex items-center justify-center">
              <ChefHat className="h-12 w-12 text-purple-300" />
            </div>
            
            {/* Similarity Score Badge */}
            <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1 shadow-sm">
              <Target className="h-3 w-3 text-purple-600" />
              <span className="text-xs font-bold text-gray-800">
                {similarityPercentage}%
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
          <div className="p-3 flex flex-col gap-2 flex-grow">
            <h4 className="font-bold text-sm text-gray-900 line-clamp-2 hover:text-teal-600 transition-colors">
              {recipe.title}
            </h4>

            <p className="text-xs text-gray-700 line-clamp-2">
              {recipe.description}
            </p>

            {/* Stats */}
            <div className="flex items-center gap-2 text-xs text-gray-600 pt-1 flex-wrap">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-purple-500" />
                <span>{recipe.prep_time + recipe.cook_time}m</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3 text-purple-500" />
                <span>{recipe.servings}</span>
              </div>
            </div>

            {/* Cuisine Type */}
            <div className="pt-1">
              <Badge variant="secondary" className="text-xs">
                {recipe.cuisine_type}
              </Badge>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Desktop: Use Card component
  return (
    <Link 
      href={`/cook/${recipe.id}`} 
      onClick={handleClick}
      onMouseEnter={onHover}
    >
      <Card 
        className="hover:shadow-xl transition-all duration-300 border-0 bg-white group w-full"
      >
        <CardContent className="p-3 flex flex-col gap-2">
          {/* Image Placeholder / Gradient */}
          <div className="relative rounded-lg overflow-hidden bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 h-32">
            <div className="absolute inset-0 flex items-center justify-center">
              <ChefHat className="h-12 w-12 text-purple-300 group-hover:scale-110 transition-transform" />
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
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-gray-900 line-clamp-2 group-hover:text-teal-600 transition-colors">
              {recipe.title}
            </h4>

            <p className="text-xs text-gray-700 line-clamp-2">
              {recipe.description}
            </p>

            {/* Stats */}
            <div className="flex items-center gap-3 text-xs text-gray-700 pt-1">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-teal-600" />
                <span>{recipe.prep_time + recipe.cook_time}m</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3 text-teal-600" />
                <span>{recipe.servings}</span>
              </div>
              <Badge variant="secondary" className="text-xs ml-auto">
                {recipe.cuisine_type}
              </Badge>
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

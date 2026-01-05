/**
 * TRENDING & POPULAR RECIPES WIDGET
 * ===================================
 * Display trending and popular recipes in a horizontal scrollable carousel
 * Mobile-optimized with touch gestures
 */

'use client';

import React, { useRef } from 'react';
import { useTrendingRecipes, usePopularRecipes, useTrackInteraction } from '@/hooks/use-recommendations';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  Star, 
  Clock, 
  Users, 
  ChefHat,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Flame
} from 'lucide-react';
import Link from 'next/link';

export function TrendingRecipesCarousel({ limit = 12, className = '' }) {
  const { data: recipes = [], isLoading } = useTrendingRecipes(limit);
  const scrollContainerRef = useRef(null);

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className={`${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center">
            <Flame className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Trending Now</h3>
            <p className="text-xs text-gray-600">Hot recipes this week</p>
          </div>
        </div>

        {/* Scroll Buttons (Desktop) */}
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
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex gap-4 overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-64 h-48 bg-gray-200 rounded-lg animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Recipe Cards */}
      {!isLoading && (
        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {recipes.map((recipe, index) => (
            <RecipeCard key={recipe.id} recipe={recipe} index={index} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && recipes.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No trending recipes available</p>
        </div>
      )}
    </div>
  );
}

export function PopularRecipesCarousel({ limit = 12, className = '' }) {
  const { data: recipes = [], isLoading } = usePopularRecipes(limit);
  const scrollContainerRef = useRef(null);

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className={`${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <Star className="h-4 w-4 text-white fill-current" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">All-Time Favorites</h3>
            <p className="text-xs text-gray-600">Most loved recipes</p>
          </div>
        </div>

        {/* Scroll Buttons (Desktop) */}
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
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex gap-4 overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-64 h-48 bg-gray-200 rounded-lg animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Recipe Cards */}
      {!isLoading && (
        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {recipes.map((recipe, index) => (
            <RecipeCard key={recipe.id} recipe={recipe} index={index} isPopular />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && recipes.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Star className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No popular recipes available</p>
        </div>
      )}
    </div>
  );
}

// Shared Recipe Card Component
function RecipeCard({ recipe, index, isPopular = false }) {
  const trackInteraction = useTrackInteraction();

  const handleClick = () => {
    trackInteraction.mutate({
      recipeId: recipe.id,
      interactionType: 'view',
      metadata: {
        source: isPopular ? 'popular_carousel' : 'trending_carousel',
        position: index,
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

  const score = recipe.recipe_scores?.[0];

  return (
    <Link href={`/cook/${recipe.id}`} onClick={handleClick}>
      <Card className="flex-shrink-0 w-64 sm:w-72 hover:shadow-xl transition-all duration-300 border-0 bg-white snap-start group">
        <CardContent className="p-4">
          {/* Image Placeholder / Gradient */}
          <div className="relative mb-3 rounded-lg overflow-hidden bg-gradient-to-br from-orange-100 to-amber-100 h-32">
            <div className="absolute inset-0 flex items-center justify-center">
              <ChefHat className="h-12 w-12 text-orange-300 group-hover:scale-110 transition-transform" />
            </div>
            
            {/* Stats Badge */}
            <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
              {isPopular ? (
                <>
                  <Star className="h-3 w-3 text-yellow-500 fill-current" />
                  <span className="text-xs font-semibold text-gray-700">
                    {score?.cook_count || 0}
                  </span>
                </>
              ) : (
                <>
                  <TrendingUp className="h-3 w-3 text-red-500" />
                  <span className="text-xs font-semibold text-gray-700">
                    {Math.round(score?.trending_score || 0)}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Recipe Info */}
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-bold text-sm text-gray-900 line-clamp-2 flex-1 group-hover:text-orange-600 transition-colors">
                {recipe.title}
              </h4>
              <Badge className={`${getDifficultyColor(recipe.difficulty)} text-xs flex-shrink-0`}>
                {recipe.difficulty}
              </Badge>
            </div>

            <p className="text-xs text-gray-600 line-clamp-2">
              {recipe.description}
            </p>

            {/* Stats */}
            <div className="flex items-center gap-4 text-xs text-gray-600 pt-2 border-t border-gray-100">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-orange-500" />
                <span>{recipe.prep_time + recipe.cook_time}m</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3 text-orange-500" />
                <span>{recipe.servings}</span>
              </div>
              <div className="flex-1 text-right">
                <Badge variant="secondary" className="text-xs">
                  {recipe.cuisine_type}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// Add this to global CSS to hide scrollbar
const style = `
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

// Inject style if needed
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = style;
  document.head.appendChild(styleSheet);
}

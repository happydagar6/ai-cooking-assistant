/**
 * WHAT'S FOR DINNER WIDGET
 * ==========================
 * Smart recommendation widget with swipeable cards
 * Shows 3 recipe options with reasons why they're recommended
 * Mobile-optimized with touch gestures
 */

'use client';

import React, { useState, useMemo } from 'react';
import { useWhatsForDinner, useTrackInteraction } from '@/hooks/use-recommendations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChefHat, 
  Clock, 
  Users, 
  Sparkles, 
  RefreshCw, 
  ArrowRight,
  Loader2,
  TrendingUp,
  Star,
  Timer
} from 'lucide-react';
import Link from 'next/link';
import { showToast } from '@/lib/toast';

export function WhatsForDinnerWidget({ className = '' }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeAvailable, setTimeAvailable] = useState(60);
  const [servings, setServings] = useState(2);

  const { 
    data: recommendations = [],
    isLoading,
    isError,
    refetch 
  } = useWhatsForDinner({ timeAvailable, mealType: 'dinner', servings });

  const trackInteraction = useTrackInteraction();

  const currentRecipe = recommendations[currentIndex];

  // Handle card swipe (next recipe)
  const handleNext = () => {
    if (currentIndex < recommendations.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setCurrentIndex(0); // Loop back to first
    }
  };

  // Handle card swipe (previous recipe)
  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    } else {
      setCurrentIndex(recommendations.length - 1); // Loop to last
    }
  };

  // Handle "Let's Cook" button
  const handleLetsCook = () => {
    if (!currentRecipe) return;

    trackInteraction.mutate({
      recipeId: currentRecipe.id,
      interactionType: 'cook',
      metadata: {
        source: 'whats_for_dinner_widget',
        recommendation_reasons: currentRecipe.recommendationReasons,
      },
    });

    showToast.success('Great choice!', 'Opening cooking mode...');
  };

  // Handle refresh
  const handleRefresh = () => {
    setCurrentIndex(0);
    refetch();
    showToast.success('Finding fresh recommendations...');
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'hard':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card className={`bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 shadow-lg ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full flex items-center justify-center">
              <ChefHat className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">What's for Dinner?</h3>
              <p className="text-xs text-gray-600 font-normal">Smart picks just for you</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="hover:bg-orange-100"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {/* Time & Servings Controls */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1">
            <label className="text-xs text-gray-600 mb-1 block">Time Available</label>
            <select
              value={timeAvailable}
              onChange={(e) => {
                setTimeAvailable(Number(e.target.value));
                setCurrentIndex(0);
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value={30}>30 min</option>
              <option value={45}>45 min</option>
              <option value={60}>1 hour</option>
              <option value={90}>1.5 hours</option>
              <option value={120}>2 hours</option>
            </select>
          </div>

          <div className="flex-1">
            <label className="text-xs text-gray-600 mb-1 block">Servings</label>
            <select
              value={servings}
              onChange={(e) => {
                setServings(Number(e.target.value));
                setCurrentIndex(0);
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value={1}>1 person</option>
              <option value={2}>2 people</option>
              <option value={4}>4 people</option>
              <option value={6}>6 people</option>
              <option value={8}>8 people</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto mb-3" />
            <p className="text-sm text-gray-600">Finding perfect recipes...</p>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="text-center py-12">
            <p className="text-sm text-gray-600 mb-3">Oops! Couldn't load recommendations</p>
            <Button size="sm" onClick={handleRefresh} variant="outline">
              Try Again
            </Button>
          </div>
        )}

        {/* Recipe Card */}
        {!isLoading && !isError && currentRecipe && (
          <div className="space-y-4">
            {/* Recipe Header */}
            <div className="bg-white rounded-xl p-4 border border-orange-200 shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <h4 className="text-lg font-bold text-gray-900 flex-1">
                  {currentRecipe.title}
                </h4>
                <Badge className={getDifficultyColor(currentRecipe.difficulty)}>
                  {currentRecipe.difficulty}
                </Badge>
              </div>

              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {currentRecipe.description}
              </p>

              {/* Recipe Stats */}
              <div className="flex items-center gap-4 text-sm text-gray-700">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-orange-500" />
                  <span>{currentRecipe.prep_time + currentRecipe.cook_time}m</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-orange-500" />
                  <span>{currentRecipe.servings}</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4 text-orange-500" />
                  <span className="text-xs">{currentRecipe.cuisine_type}</span>
                </div>
              </div>
            </div>

            {/* Why Recommended */}
            {currentRecipe.recommendationReasons && currentRecipe.recommendationReasons.length > 0 && (
              <div className="bg-white rounded-xl p-4 border border-orange-100">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-semibold text-gray-900">Why we picked this:</span>
                </div>
                <ul className="space-y-1">
                  {currentRecipe.recommendationReasons.map((reason, idx) => (
                    <li key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                      <Star className="h-3 w-3 text-orange-400 fill-current flex-shrink-0" />
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Navigation & Actions */}
            <div className="flex items-center justify-between gap-3">
              {/* Previous/Next Dots */}
              <div className="flex items-center gap-1.5">
                {recommendations.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-2 w-2 rounded-full transition-all ${
                      idx === currentIndex
                        ? 'bg-orange-500 w-6'
                        : 'bg-orange-200 hover:bg-orange-300'
                    }`}
                    aria-label={`View recipe ${idx + 1}`}
                  />
                ))}
                <span className="text-xs text-gray-500 ml-2">
                  {currentIndex + 1}/{recommendations.length}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNext}
                  className="border-orange-200 hover:bg-orange-50"
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
                
                <Link href={`/cook/${currentRecipe.id}`}>
                  <Button
                    size="sm"
                    onClick={handleLetsCook}
                    className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
                  >
                    <ChefHat className="h-4 w-4 mr-2" />
                    Let's Cook!
                  </Button>
                </Link>
              </div>
            </div>

            {/* Mobile Swipe Hint */}
            <p className="text-xs text-center text-gray-500 mt-2 sm:hidden">
              👉 Swipe or tap dots to see more options
            </p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && recommendations.length === 0 && (
          <div className="text-center py-12">
            <ChefHat className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-600 mb-2">No recommendations available</p>
            <p className="text-xs text-gray-500 mb-4">Try adjusting time or servings</p>
            <Button size="sm" onClick={handleRefresh} variant="outline">
              Refresh
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Mobile-Optimized Compact Version
export function WhatsForDinnerCompact({ className = '' }) {
  const { data: recommendations = [], isLoading } = useWhatsForDinner({
    timeAvailable: 60,
    mealType: 'dinner',
    servings: 2,
  });

  const recipe = recommendations[0];

  if (isLoading) {
    return (
      <div className={`bg-gradient-to-r from-orange-100 to-amber-100 rounded-lg p-4 ${className}`}>
        <Loader2 className="h-5 w-5 animate-spin text-orange-500 mx-auto" />
      </div>
    );
  }

  if (!recipe) return null;

  return (
    <Link href={`/cook/${recipe.id}`}>
      <div className={`bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg p-4 text-white hover:shadow-lg transition-all ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <ChefHat className="h-4 w-4" />
              <span className="text-xs font-medium opacity-90">What's for Dinner?</span>
            </div>
            <h4 className="font-bold text-sm line-clamp-1 mb-1">{recipe.title}</h4>
            <div className="flex items-center gap-3 text-xs opacity-90">
              <span className="flex items-center gap-1">
                <Timer className="h-3 w-3" />
                {recipe.prep_time + recipe.cook_time}m
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {recipe.servings}
              </span>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 flex-shrink-0" />
        </div>
      </div>
    </Link>
  );
}

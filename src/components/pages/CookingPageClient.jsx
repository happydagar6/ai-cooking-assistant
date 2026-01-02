'use client';

import dynamic from 'next/dynamic';
import VoiceControls from '@/components/voice-controls';
import BackNavigation from '@/components/back-navigation';
import RecipeHeader from '@/components/recipe-header';
import RecipeIngredients from '@/components/recipe-ingredients';
import RecipeInstructions from '@/components/recipe-instructions';

// Lazy load heavy/optional components
const LazyVoiceInputButton = dynamic(
  () => import('@/components/voice-input-button'),
  {
    loading: () => <div className="h-10 bg-gray-200 rounded animate-pulse"></div>,
    ssr: false
  }
);

const LazyRecipeScalingCalculator = dynamic(
  () => import('@/components/recipe-scaling-calculator'),
  {
    loading: () => <div className="h-64 bg-gray-200 rounded animate-pulse"></div>,
    ssr: false
  }
);

const LazyNutritionAnalysis = dynamic(
  () => import('@/components/nutrition-analysis'),
  {
    loading: () => <div className="h-80 bg-gray-200 rounded animate-pulse"></div>,
    ssr: false
  }
);

const LazyVoiceRecipeReader = dynamic(
  () => import('@/components/voice-recipe-reader'),
  {
    loading: () => <div className="h-12 bg-gray-200 rounded animate-pulse"></div>,
    ssr: false
  }
);

export default function CookingPageClient({ recipe, recipeData }) {
  if (!recipe) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Recipe not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white pb-20">
      {/* Back Navigation - Always visible */}
      <BackNavigation />

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        {/* Recipe Header - Critical Content */}
        <RecipeHeader recipe={recipe} />

        {/* Voice Controls - Important for interaction */}
        <VoiceControls recipe={recipe} />

        {/* Recipe Ingredients - Critical Content */}
        <RecipeIngredients recipe={recipe} />

        {/* Recipe Instructions - Critical Content */}
        <RecipeInstructions recipe={recipe} />

        {/* Voice Input Button - Lazy loaded (optional feature) */}
        <section className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>🎤</span> Voice Input
          </h3>
          <LazyVoiceInputButton recipe={recipe} />
        </section>

        {/* Recipe Scaling Calculator - Lazy loaded (optional feature) */}
        <section className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>📏</span> Scale Recipe
          </h3>
          <LazyRecipeScalingCalculator recipe={recipe} />
        </section>

        {/* Voice Recipe Reader - Lazy loaded (optional feature) */}
        <section className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>📖</span> Narration
          </h3>
          <LazyVoiceRecipeReader recipe={recipe} />
        </section>

        {/* Nutrition Analysis - Lazy loaded (optional feature) */}
        <section className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>📊</span> Nutrition
          </h3>
          <LazyNutritionAnalysis recipe={recipe} />
        </section>
      </main>
    </div>
  );
}

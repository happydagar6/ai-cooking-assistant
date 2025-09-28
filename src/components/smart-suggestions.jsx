"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sparkles, TrendingUp, Clock, ChefHat } from 'lucide-react'

export function SmartSuggestions({ recipes = [], className = "" }) {
  const [suggestions, setSuggestions] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    generateSmartSuggestions()
  }, [recipes])

  const generateSmartSuggestions = () => {
    try {
      setIsLoading(true)
      
      // Generate suggestions based on existing recipes
      const quickRecipes = recipes.filter(recipe => {
        const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0);
        return totalTime <= 30;
      }).slice(0, 3);

      const easyRecipes = recipes.filter(recipe => 
        recipe.difficulty === 'easy'
      ).slice(0, 3);

      const popularRecipes = recipes
        .sort((a, b) => (b.cook_count || 0) - (a.cook_count || 0))
        .slice(0, 3);

      const suggestionTypes = [
        {
          type: 'trending',
          title: 'Popular Recipes',
          icon: TrendingUp,
          color: 'bg-orange-500',
          recipes: popularRecipes.length > 0 ? popularRecipes : [
            { id: 'trend1', title: "Classic Spaghetti Carbonara", time: "20 mins", difficulty: "Easy", description: "Creamy Italian pasta" },
            { id: 'trend2', title: "Chicken Stir Fry", time: "25 mins", difficulty: "Medium", description: "Quick Asian-style dinner" },
            { id: 'trend3', title: "Avocado Toast", time: "5 mins", difficulty: "Easy", description: "Healthy breakfast option" }
          ]
        },
        {
          type: 'quick',
          title: 'Quick Meals (Under 30 mins)',
          icon: Clock,
          color: 'bg-green-500',
          recipes: quickRecipes.length > 0 ? quickRecipes : [
            { id: 'quick1', title: "5-Minute Scrambled Eggs", time: "5 mins", difficulty: "Easy", description: "Perfect breakfast" },
            { id: 'quick2', title: "Instant Ramen Upgrade", time: "10 mins", difficulty: "Easy", description: "Elevated comfort food" },
            { id: 'quick3', title: "Grilled Cheese", time: "8 mins", difficulty: "Easy", description: "Classic comfort food" }
          ]
        },
        {
          type: 'easy',
          title: 'Beginner Friendly',
          icon: ChefHat,
          color: 'bg-blue-500',
          recipes: easyRecipes.length > 0 ? easyRecipes : [
            { id: 'easy1', title: "Perfect Scrambled Eggs", time: "10 mins", difficulty: "Easy", description: "Master the basics" },
            { id: 'easy2', title: "Simple Pasta with Butter", time: "15 mins", difficulty: "Easy", description: "Minimal ingredients, maximum taste" },
            { id: 'easy3', title: "Banana Smoothie", time: "3 mins", difficulty: "Easy", description: "Healthy and refreshing" }
          ]
        }
      ]

      setSuggestions(suggestionTypes)
    } catch (error) {
      console.error('Error generating suggestions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTryRecipe = (recipe) => {
    // For now, just show a toast - could integrate with search or recipe generation
    if (typeof window !== 'undefined' && window.navigator) {
      navigator.clipboard?.writeText(`I want to cook: ${recipe.title}`)
    }
    // You can integrate this with your existing recipe search or generation flow
  }

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-2">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-orange-500" />
        <h2 className="text-lg font-semibold">Smart Suggestions</h2>
        <Badge variant="secondary" className="text-xs">AI-Powered</Badge>
      </div>

      {suggestions.map((category) => (
        <Card key={category.type} className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <div className={`p-1.5 rounded-full ${category.color} text-white`}>
                <category.icon className="h-3 w-3" />
              </div>
              {category.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {category.recipes.map((recipe, index) => (
                <div
                  key={recipe.id || `${category.type}-${index}`}
                  className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                >
                  <div>
                    <p className="font-medium text-sm">{recipe.title}</p>
                    <div className="flex gap-2 text-xs text-gray-500">
                      <span>🕐 {recipe.time}</span>
                      <span>📊 {recipe.difficulty}</span>
                    </div>
                    {recipe.description && (
                      <p className="text-xs text-gray-400 mt-1">{recipe.description}</p>
                    )}
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-xs"
                    onClick={() => handleTryRecipe(recipe)}
                  >
                    Try It
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
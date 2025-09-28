"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Trophy, 
  Star, 
  Award, 
  Target, 
  Flame,
  ChefHat,
  Clock,
  Heart,
  Zap,
  Crown
} from 'lucide-react'

export function CookingAchievements({ recipes = [], className = "" }) {
  const [achievements, setAchievements] = useState([])
  const [unlockedAchievements, setUnlockedAchievements] = useState([])

  useEffect(() => {
    calculateAchievements()
  }, [recipes])

  const calculateAchievements = () => {
    // Calculate stats from recipes
    const totalRecipes = recipes.length
    const favoriteCount = recipes.filter(recipe => recipe.is_favorite).length
    const quickMeals = recipes.filter(recipe => {
      const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0);
      return totalTime <= 30;
    }).length
    const cookingStreak = 3 // Mock streak - in real app would come from cooking session data
    const totalCookCount = recipes.reduce((sum, recipe) => sum + (recipe.cook_count || 0), 0)

    const allAchievements = [
      {
        id: 'first_recipe',
        title: 'First Steps',
        description: 'Save your first recipe',
        icon: ChefHat,
        color: 'text-green-500',
        bgColor: 'bg-green-50',
        threshold: 1,
        current: totalRecipes,
        unlocked: totalRecipes >= 1,
        rarity: 'common'
      },
      {
        id: 'recipe_explorer',
        title: 'Recipe Explorer',
        description: 'Save 10 different recipes',
        icon: Target,
        color: 'text-blue-500',
        bgColor: 'bg-blue-50',
        threshold: 10,
        current: totalRecipes,
        unlocked: totalRecipes >= 10,
        rarity: 'uncommon'
      },
      {
        id: 'food_lover',
        title: 'Food Lover',
        description: 'Mark 5 recipes as favorites',
        icon: Heart,
        color: 'text-red-500',
        bgColor: 'bg-red-50',
        threshold: 5,
        current: favoriteCount,
        unlocked: favoriteCount >= 5,
        rarity: 'common'
      },
      {
        id: 'master_chef',
        title: 'Master Chef',
        description: 'Save 25+ recipes',
        icon: Crown,
        color: 'text-purple-500',
        bgColor: 'bg-purple-50',
        threshold: 25,
        current: totalRecipes,
        unlocked: totalRecipes >= 25,
        rarity: 'rare'
      },
      {
        id: 'speed_demon',
        title: 'Speed Demon',
        description: 'Collect 5 quick meals (under 30 mins)',
        icon: Zap,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-50',
        threshold: 5,
        current: quickMeals,
        unlocked: quickMeals >= 5,
        rarity: 'uncommon'
      },
      {
        id: 'cooking_enthusiast',
        title: 'Cooking Enthusiast',
        description: 'Cook recipes 10 times total',
        icon: Flame,
        color: 'text-orange-500',
        bgColor: 'bg-orange-50',
        threshold: 10,
        current: totalCookCount,
        unlocked: totalCookCount >= 10,
        rarity: 'uncommon'
      }
    ]

    setAchievements(allAchievements)
    setUnlockedAchievements(allAchievements.filter(achievement => achievement.unlocked))
  }

  const getRarityBadge = (rarity) => {
    const rarityConfig = {
      common: { color: 'bg-gray-100 text-gray-700', label: 'Common' },
      uncommon: { color: 'bg-blue-100 text-blue-700', label: 'Uncommon' },
      rare: { color: 'bg-purple-100 text-purple-700', label: 'Rare' },
      legendary: { color: 'bg-yellow-100 text-yellow-700', label: 'Legendary' }
    }
    
    return rarityConfig[rarity] || rarityConfig.common
  }

  const calculateOverallProgress = () => {
    if (achievements.length === 0) return 0
    return Math.round((unlockedAchievements.length / achievements.length) * 100)
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overall Progress */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-amber-500" />
            Cooking Achievements
            <Badge variant="secondary">{unlockedAchievements.length}/{achievements.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Progress</span>
              <span>{calculateOverallProgress()}%</span>
            </div>
            <Progress value={calculateOverallProgress()} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Achievement Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {achievements.map((achievement) => {
          const Icon = achievement.icon
          const rarity = getRarityBadge(achievement.rarity)
          const progress = Math.min((achievement.current / achievement.threshold) * 100, 100)
          
          return (
            <Card 
              key={achievement.id} 
              className={`transition-all duration-200 ${
                achievement.unlocked 
                  ? 'border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50' 
                  : 'opacity-75 hover:opacity-100'
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-full ${achievement.bgColor} ${achievement.unlocked ? '' : 'grayscale'}`}>
                    <Icon className={`h-5 w-5 ${achievement.color}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-sm">{achievement.title}</h3>
                        <p className="text-xs text-gray-600">{achievement.description}</p>
                      </div>
                      
                      {achievement.unlocked && (
                        <Star className="h-4 w-4 text-amber-500 flex-shrink-0" fill="currentColor" />
                      )}
                    </div>
                    
                    <div className="mt-2 space-y-1">
                      <Badge className={`text-xs ${rarity.color}`} variant="secondary">
                        {rarity.label}
                      </Badge>
                      
                      {!achievement.unlocked && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Progress</span>
                            <span>{achievement.current}/{achievement.threshold}</span>
                          </div>
                          <Progress value={progress} className="h-1" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recent Unlock Notification (if any) */}
      {unlockedAchievements.length > 0 && (
        <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-600" />
              <span className="font-medium text-amber-800">
                🎉 You've unlocked {unlockedAchievements.length} achievement{unlockedAchievements.length !== 1 ? 's' : ''}!
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
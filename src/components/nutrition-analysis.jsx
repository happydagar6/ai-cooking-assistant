"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Activity, 
  Zap, 
  Heart, 
  Utensils, 
  TrendingUp, 
  AlertCircle,
  Sparkles,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react'
import { useNutrition, useNutritionLabel } from '@/hooks/use-nutrition'

export function NutritionAnalysis({ recipe, className = "" }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const { 
    nutrition, 
    isLoading, 
    hasNutrition, 
    analyzeNutrition, 
    isAnalyzing 
  } = useNutrition(recipe.id)
  
  const nutritionLabel = useNutritionLabel(nutrition)

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 animate-pulse" />
            <CardTitle>Loading Nutrition...</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!hasNutrition) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Activity className="h-5 w-5 flex-shrink-0" />
              <CardTitle className="text-lg">Nutrition Analysis</CardTitle>
              <Badge variant="secondary" className="text-xs">AI-Powered</Badge>
            </div>
            <Button 
              onClick={() => analyzeNutrition()} 
              disabled={isAnalyzing}
              size="sm"
              className="w-full sm:w-auto text-xs sm:text-sm whitespace-nowrap"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  <span className="hidden sm:inline">Analyzing...</span>
                  <span className="sm:hidden">Analyzing</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Analyze Nutrition</span>
                  <span className="sm:hidden">Analyze</span>
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Get detailed nutritional information powered by AI analysis of ingredients and cooking methods.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Activity className="h-5 w-5 flex-shrink-0" />
            <CardTitle className="text-lg">Nutrition Analysis</CardTitle>
            <Badge 
              variant={nutrition.health_score >= 7 ? "default" : "secondary"}
              className="flex items-center gap-1 text-xs sm:text-sm"
            >
              <Heart className="h-3 w-3" />
              {nutrition.health_score}/10
            </Badge>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={() => setIsExpanded(!isExpanded)} 
              variant="outline"
              size="sm"
              className="text-xs sm:text-sm"
            >
              {isExpanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span className="hidden xs:inline ml-1">{isExpanded ? 'Collapse' : 'Details'}</span>
            </Button>
            <Button 
              onClick={() => analyzeNutrition(true)} 
              disabled={isAnalyzing}
              variant="outline"
              size="sm"
              className="text-xs sm:text-sm"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 gap-1 sm:gap-0">
            <TabsTrigger value="overview" className="text-xs sm:text-sm px-2 sm:px-4">Overview</TabsTrigger>
            <TabsTrigger value="detailed" className="text-xs sm:text-sm px-2 sm:px-4">Detailed</TabsTrigger>
            <TabsTrigger value="insights" className="text-xs sm:text-sm px-2 sm:px-4">Insights</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <NutritionOverview nutrition={nutrition} />
          </TabsContent>
          
          <TabsContent value="detailed" className="space-y-4">
            {nutritionLabel && <NutritionLabel nutritionLabel={nutritionLabel} />}
          </TabsContent>
          
          <TabsContent value="insights" className="space-y-4">
            <NutritionInsights nutrition={nutrition} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

function NutritionOverview({ nutrition }) {
  const macros = nutrition.nutrition_data || {}
  
  return (
    <div className="space-y-4">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-3 bg-orange-50 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">{macros.calories || 0}</div>
          <div className="text-sm text-muted-foreground">Calories</div>
        </div>
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{macros.protein || 0}g</div>
          <div className="text-sm text-muted-foreground">Protein</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{macros.carbs || 0}g</div>
          <div className="text-sm text-muted-foreground">Carbs</div>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{macros.fat || 0}g</div>
          <div className="text-sm text-muted-foreground">Fat</div>
        </div>
      </div>

      {/* Dietary Tags */}
      {nutrition.dietary_tags && nutrition.dietary_tags.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">Dietary Information</h4>
          <div className="flex flex-wrap gap-2">
            {nutrition.dietary_tags.map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function NutritionLabel({ nutritionLabel }) {
  return (
    <div className="bg-white border-2 border-black p-4 space-y-2 font-mono text-sm">
      <div className="text-lg font-bold border-b-4 border-black pb-1">
        Nutrition Facts
      </div>
      <div className="text-sm">
        Serving size: {nutritionLabel.servingSize}
      </div>
      
      <div className="border-b-8 border-black py-2">
        <div className="flex justify-between items-baseline">
          <span className="text-2xl font-bold">Calories</span>
          <span className="text-2xl font-bold">{nutritionLabel.calories}</span>
        </div>
      </div>
      
      <div className="space-y-1">
        <NutritionRow 
          label="Total Fat" 
          value={`${nutritionLabel.totalFat.value}g`}
          dailyValue={nutritionLabel.totalFat.dailyValue}
        />
        <NutritionRow 
          label="Cholesterol" 
          value={`${nutritionLabel.cholesterol.value}mg`}
          dailyValue={nutritionLabel.cholesterol.dailyValue}
          indent
        />
        <NutritionRow 
          label="Sodium" 
          value={`${nutritionLabel.sodium.value}mg`}
          dailyValue={nutritionLabel.sodium.dailyValue}
        />
        <NutritionRow 
          label="Total Carbohydrate" 
          value={`${nutritionLabel.totalCarbs.value}g`}
          dailyValue={nutritionLabel.totalCarbs.dailyValue}
        />
        <NutritionRow 
          label="Dietary Fiber" 
          value={`${nutritionLabel.dietaryFiber.value}g`}
          dailyValue={nutritionLabel.dietaryFiber.dailyValue}
          indent
        />
        <NutritionRow 
          label="Sugars" 
          value={`${nutritionLabel.sugars}g`}
          indent
        />
        <NutritionRow 
          label="Protein" 
          value={`${nutritionLabel.protein.value}g`}
          dailyValue={nutritionLabel.protein.dailyValue}
        />
      </div>
    </div>
  )
}

function NutritionRow({ label, value, dailyValue, indent = false }) {
  return (
    <div className={`flex justify-between border-b border-gray-300 py-1 ${indent ? 'pl-4' : ''}`}>
      <span className={indent ? 'text-sm' : ''}>{label}</span>
      <div className="flex gap-2">
        <span>{value}</span>
        {dailyValue && <span className="font-bold">{dailyValue}%</span>}
      </div>
    </div>
  )
}

function NutritionInsights({ nutrition }) {
  return (
    <div className="space-y-4">
      {/* Health Highlights */}
      {nutrition.highlights && nutrition.highlights.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            Health Highlights
          </h4>
          <ul className="space-y-1">
            {nutrition.highlights.map((highlight, index) => (
              <li key={index} className="text-sm text-green-700 flex items-start gap-2">
                <span className="text-green-500 mt-1">•</span>
                {highlight}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Health Concerns */}
      {nutrition.concerns && nutrition.concerns.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            Considerations
          </h4>
          <ul className="space-y-1">
            {nutrition.concerns.map((concern, index) => (
              <li key={index} className="text-sm text-amber-700 flex items-start gap-2">
                <span className="text-amber-500 mt-1">•</span>
                {concern}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Healthy Suggestions */}
      {nutrition.healthy_suggestions && nutrition.healthy_suggestions.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-500" />
            Make it Healthier
          </h4>
          <ul className="space-y-1">
            {nutrition.healthy_suggestions.map((suggestion, index) => (
              <li key={index} className="text-sm text-blue-700 flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
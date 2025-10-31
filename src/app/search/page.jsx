"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  ChefHat, 
  Clock, 
  Users, 
  Utensils, 
  Loader2, 
  Bookmark, 
  BookmarkCheck, 
  Sparkles, 
  Search,
  Mic,
  Zap,
  Heart,
  Star,
  TrendingUp,
  Filter,
  ArrowRight
} from "lucide-react"
import { VoiceSearchInput } from "@/components/voice-search-input"
import { BackNavigation } from "@/components/back-navigation"
import { FavoriteButton } from "@/components/favorite-button"
import { showToast, recipeToasts } from "@/lib/toast"
import { useAuth } from "@/lib/auth-context"
import ProtectedRoute from "@/components/protected-route"
import Navigation from "@/components/navigation"
import { useRouter } from "next/navigation"

// ✨ Import optimized save recipe mutation for instant updates
import { useSaveRecipeMutation } from "@/hooks/use-optimized-queries"

function SearchPageContent() {
  const [isLoading, setIsLoading] = useState(false)
  const [recipes, setRecipes] = useState([])
  const [savingRecipes, setSavingRecipes] = useState(new Set())
  const { user } = useAuth()
  const router = useRouter()

  // ✨ Use optimized save recipe mutation for instant dashboard updates
  const saveRecipeMutation = useSaveRecipeMutation(user?.id)

  const handleSearch = async (query) => {
    if (!query.trim()) return; // Ignore empty queries

    setIsLoading(true);
    const loadingToast = showToast.loading('AI is crafting perfect recipes...')

    try {
      const response = await fetch("/api/recipes", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ query }),
      })
      const data = await response.json()
      
      showToast.dismiss(loadingToast)
      
      if(data.recipes && data.recipes.length > 0){
        setRecipes(data.recipes)
        recipeToasts.generated()
      } else {
        setRecipes([])
        showToast.info('No recipes found. Try a different search term.')
      }
    } catch (error) {
      console.error("Search error:", error)
      showToast.dismiss(loadingToast)
      recipeToasts.generateError()
      setRecipes([]);
    }
    setIsLoading(false);
  }

  // Function to handle "Start Cooking" - saves recipe first if it's generated
  const handleStartCooking = async (recipe, index) => {
    if (!user) {
      showToast.error('Please sign in to start cooking');
      return;
    }

    // Check if recipe has a valid UUID (not a temporary ID)
    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(recipe.id);
    
    // ✨ FIX: Only save if it's truly unsaved - check more carefully
    const needsSaving = recipe.is_generated && !recipe.is_saved && !isValidUUID;
    
    if (needsSaving) {
      setSavingRecipes(prev => new Set([...prev, recipe.id]));
      const loadingToast = showToast.loading('Preparing recipe for cooking...')
      
      try {
        // Clean the recipe data before saving
        const cleanRecipe = {
          title: recipe.title,
          description: recipe.description,
          prep_time: recipe.prep_time,
          cook_time: recipe.cook_time,
          servings: recipe.servings,
          difficulty: recipe.difficulty,
          cuisine_type: recipe.cuisine_type,
          dietary_tags: recipe.dietary_tags || [],
          ingredients: recipe.ingredients,
          instructions: recipe.instructions,
          is_public: false
        };

        // ✨ Use mutation for cache updates, then navigate to cooking
        const savedRecipe = await saveRecipeMutation.mutateAsync(cleanRecipe);
        
        showToast.dismiss(loadingToast);
        
        // Update the recipe in state to show it's saved
        setRecipes(prev => prev.map(r => 
          r.id === recipe.id 
            ? { ...r, is_generated: false, is_saved: true, id: savedRecipe.id }
            : r
        ));
        
        // Navigate to cooking page with the real recipe ID
        router.push(`/cook/${savedRecipe.id}`);
        
      } catch (error) {
        console.error('Save recipe error:', error);
        showToast.dismiss(loadingToast);
        
        // ✨ FIX: Better error handling for duplicate requests
        if (error.message.includes('Duplicate request')) {
          showToast.error('Please wait a moment before saving again.');
        } else {
          showToast.error('Failed to prepare recipe for cooking. Please try again.');
        }
      } finally {
        setSavingRecipes(prev => {
          const newSet = new Set(prev);
          newSet.delete(recipe.id);
          return newSet;
        });
      }
    } else {
      // Recipe is already saved with valid UUID, navigate directly
      router.push(`/cook/${recipe.id}`);
    }
  }

  const handleSaveRecipe = async (recipe) => {
    if (!user) {
      showToast.error('Please sign in to save recipes');
      return;
    }

    setSavingRecipes(prev => new Set([...prev, recipe.id]));
    const loadingToast = showToast.loading('Saving recipe for later...')
    
    // Clean the recipe data before saving
    const cleanRecipe = {
      title: recipe.title,
      description: recipe.description,
      prep_time: recipe.prep_time,
      cook_time: recipe.cook_time,
      servings: recipe.servings,
      difficulty: recipe.difficulty,
      cuisine_type: recipe.cuisine_type,
      dietary_tags: recipe.dietary_tags || [],
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      is_public: false
    };

    // ✨ Use mutation for instant cache updates
    saveRecipeMutation.mutate(cleanRecipe, {
      onSuccess: (savedRecipe) => {
        showToast.dismiss(loadingToast);
        // ✨ FIX: Update the local recipe list with the real saved recipe ID
        setRecipes(prev => prev.map(r => 
          r.id === recipe.id 
            ? { ...r, is_generated: false, is_saved: true, id: savedRecipe.id }
            : r
        ));
        showToast.success('Recipe saved to your collection! ✨ Available instantly in My Recipes');
        setSavingRecipes(prev => {
          const newSet = new Set(prev);
          newSet.delete(recipe.id);
          return newSet;
        });
      },
      onError: (error) => {
        console.error('Save recipe error:', error);
        showToast.dismiss(loadingToast);
        showToast.error(error.message || 'Failed to save recipe. Please try again.');
        setSavingRecipes(prev => {
          const newSet = new Set(prev);
          newSet.delete(recipe.id);
          return newSet;
        });
      }
    });
  }

  // Function to get color based on difficulty
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "easy":
        return "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200"
      case "medium":
        return "bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border-yellow-200"
      case "hard":
        return "bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border-red-200"
      default:
        return "bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-gray-200"
    }
  }

  const quickSuggestions = [
    { text: "Quick breakfast with eggs", icon: "🥚", color: "from-yellow-400 to-orange-400" },
    { text: "Healthy dinner for two", icon: "🥗", color: "from-green-400 to-emerald-400" },
    { text: "Vegetarian pasta dish", icon: "🍝", color: "from-red-400 to-pink-400" },
    { text: "Something with chicken", icon: "🍗", color: "from-amber-400 to-yellow-400" },
    { text: "Easy dessert recipe", icon: "🍰", color: "from-purple-400 to-pink-400" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 flex-grow">
        {/* Hero Search Section */}
        <div className="relative mb-12">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-amber-500/5 rounded-3xl" />
          <div className="absolute top-4 right-4 opacity-20">
            <Sparkles className="h-32 w-32 text-orange-500" />
          </div>
          
          <div className="relative max-w-4xl mx-auto text-center py-16 px-8">
            {/* Hero Badge */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 px-6 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              AI-Powered Recipe Discovery
            </div>
            
            {/* Hero Title */}
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              What Sounds{" "}
              <span className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                Delicious
              </span>{" "}
              Today?
            </h1>
            
            {/* Hero Description */}
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Tell me your ingredients, dietary preferences, or what you&apos;re craving. I&apos;ll create the perfect recipe just for you.
            </p>

            {/* Enhanced Search Input */}
            <div className="max-w-2xl mx-auto mb-8">
              <VoiceSearchInput
                onSearch={handleSearch}
                placeholder="Try: 'I have chicken and rice' or 'quick healthy dinner'"
                isLoading={isLoading}
                className="h-16 text-lg shadow-2xl border-2 border-orange-200/50 bg-white/80 backdrop-blur-sm rounded-2xl"
              />
            </div>

            {/* Quick Action Chips */}
            <div className="flex flex-wrap gap-3 justify-center mb-8">
              {quickSuggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  onClick={() => handleSearch(suggestion.text)}
                  className="group bg-white/70 backdrop-blur-sm hover:bg-white hover:shadow-lg transition-all duration-300 rounded-xl border-2 border-gray-200/50 hover:border-orange-300"
                >
                  <span className="mr-2 text-lg">{suggestion.icon}</span>
                  <span className="text-gray-700 font-medium">{suggestion.text}</span>
                  <ArrowRight className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </Button>
              ))}
            </div>

            {/* Voice Hint */}
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <Mic className="h-4 w-4" />
              <span>Click the mic button or type your request</span>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-20">
            <div className="relative inline-block">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-400 to-amber-400 rounded-full flex items-center justify-center mb-6">
                <ChefHat className="h-8 w-8 text-white animate-bounce" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full animate-ping" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Crafting Perfect Recipes</h3>
            <p className="text-gray-600">Our AI chef is selecting the best recipes for you...</p>
          </div>
        )}

        {/* Results Section */}
        {recipes.length > 0 && !isLoading && (
          <div className="mb-12">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl flex items-center justify-center">
                  <Star className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Perfect Matches</h2>
                  <p className="text-gray-600">AI-curated recipes just for you</p>
                </div>
              </div>
              <Badge 
                variant="secondary" 
                className="bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 px-4 py-2 text-sm font-medium"
              >
                {recipes.length} recipes found
              </Badge>
            </div>

            {/* Recipe Grid */}
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
              {recipes.map((recipe, index) => (
                <Card 
                  key={recipe.id || index} 
                  className="group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-white/70 backdrop-blur-sm hover:bg-white hover:scale-105"
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <CardTitle className="text-xl font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors duration-300">
                          {recipe.title}
                        </CardTitle>
                        <CardDescription className="text-gray-600 leading-relaxed">
                          {recipe.description}
                        </CardDescription>
                      </div>
                      
                      {/* Add Favorite Button for saved recipes */}
                      {recipe.id && !recipe.id.startsWith('temp-') && (
                        <FavoriteButton 
                          recipeId={recipe.id} 
                          size="sm"
                          className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        />
                      )}
                    </div>
                    
                    {/* Difficulty Badge */}
                    <div className="flex items-center gap-2">
                      <Badge className={`${getDifficultyColor(recipe.difficulty)} px-3 py-1 font-medium capitalize`}>
                        {recipe.difficulty}
                      </Badge>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`h-3 w-3 ${i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                          />
                        ))}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    {/* Recipe Stats */}
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-6 bg-gray-50/50 rounded-xl p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                          <Clock className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {(recipe.prep_time || recipe.prepTime || 0) + (recipe.cook_time || recipe.cookTime || 0)}m
                          </div>
                          <div className="text-xs text-gray-500">Total time</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-green-100 to-green-200 rounded-lg flex items-center justify-center">
                          <Users className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{recipe.servings || 'N/A'}</div>
                          <div className="text-xs text-gray-500">Servings</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-100 to-purple-200 rounded-lg flex items-center justify-center">
                          <Utensils className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 text-xs">{recipe.cuisine_type || 'Various'}</div>
                          <div className="text-xs text-gray-500">Cuisine</div>
                        </div>
                      </div>
                    </div>

                    {/* Key Ingredients */}
                    <div className="mb-6">
                      <p className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-orange-500" />
                        Key Ingredients
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {recipe.ingredients?.slice(0, 3).map((ingredient, index) => (
                          <Badge 
                            key={index} 
                            variant="secondary" 
                            className="bg-gradient-to-r from-orange-50 to-amber-50 text-orange-700 border-orange-200 text-xs font-medium px-3 py-1"
                          >
                            {typeof ingredient === 'string' ? ingredient : ingredient.name}
                          </Badge>
                        ))}
                        {recipe.ingredients?.length > 3 && (
                          <Badge 
                            variant="secondary" 
                            className="bg-gradient-to-r from-gray-50 to-gray-100 text-gray-600 text-xs"
                          >
                            +{recipe.ingredients.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <Button 
                        className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 gap-2"
                        onClick={() => handleStartCooking(recipe, index)}
                        disabled={savingRecipes.has(recipe.id)}
                      >
                        {savingRecipes.has(recipe.id) ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Preparing...
                          </>
                        ) : (
                          <>
                            <ChefHat className="h-4 w-4" />
                            Start Cooking
                          </>
                        )}
                      </Button>
                      
                      {recipe.is_generated && !recipe.is_saved && (
                        <Button
                          variant="outline" 
                          onClick={() => handleSaveRecipe(recipe)}
                          disabled={savingRecipes.has(recipe.id)}
                          className="gap-2 border-2 hover:bg-orange-50 hover:border-orange-300 transition-all duration-300"
                        >
                          {savingRecipes.has(recipe.id) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Bookmark className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      
                      {recipe.is_saved && (
                        <Button
                          variant="outline" 
                          disabled
                          className="gap-2 border-green-200 bg-green-50"
                        >
                          <BookmarkCheck className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {recipes.length === 0 && !isLoading && (
          <div className="text-center py-20">
            <div className="relative inline-block mb-8">
              <div className="w-24 h-24 bg-gradient-to-r from-orange-100 to-amber-100 rounded-full flex items-center justify-center">
                <Search className="h-12 w-12 text-orange-600" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to Discover Amazing Recipes?</h3>
            <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
              Use the search above, try voice input, or click one of the suggestion chips to get started
            </p>
            <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Mic className="h-5 w-5 text-orange-500" />
                <span>Voice Search</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-500" />
                <span>AI-Powered</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                <span>Personalized</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default function SearchPage() {
  return (
    <ProtectedRoute redirectTo="/search">
      <SearchPageContent />
    </ProtectedRoute>
  );
}

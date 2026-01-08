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
import { AddToCollectionButton } from "@/components/add-to-collection-button"

import { showToast, recipeToasts } from "@/lib/toast"
import { useAuth } from "@/lib/auth-context"
import ProtectedRoute from "@/components/protected-route"
import Navigation from "@/components/navigation"
import { useRouter } from "next/navigation"

// ✨ Import optimized save recipe mutation for instant updates
import { useSaveRecipeMutation } from "@/hooks/use-optimized-queries"

function SearchPageContent() {
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [recipes, setRecipes] = useState([])
  const [savingRecipes, setSavingRecipes] = useState(new Set())
  const { user } = useAuth()
  const router = useRouter()

  // ✨ Use optimized save recipe mutation for instant dashboard updates
  const saveRecipeMutation = useSaveRecipeMutation(user?.id)

  const handleSearch = async (query) => {
    if (!query.trim()) return; // Ignore empty queries

    setSearchQuery(query)
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
        return "bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 border-emerald-200"
      case "medium":
        return "bg-gradient-to-r from-cyan-100 to-teal-100 text-cyan-700 border-cyan-200"
      case "hard":
        return "bg-gradient-to-r from-slate-200 to-slate-300 text-slate-700 border-slate-300"
      default:
        return "bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 border-slate-200"
    }
  }

  const quickSuggestions = [
    { text: "Quick breakfast with eggs", icon: "🥚", color: "from-slate-400 to-slate-500" },
    { text: "Healthy dinner for two", icon: "🥗", color: "from-teal-400 to-emerald-400" },
    { text: "Vegetarian pasta dish", icon: "🍝", color: "from-cyan-400 to-teal-400" },
    { text: "Something with chicken", icon: "🍗", color: "from-slate-400 to-slate-500" },
    { text: "Easy dessert recipe", icon: "🍰", color: "from-teal-400 to-cyan-400" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <Navigation />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 flex-grow">
        {/* Hero Search Section */}
        <div className="relative mb-8 sm:mb-12">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-400/5 to-teal-400/5 rounded-2xl sm:rounded-3xl" />
          <div className="absolute top-2 sm:top-4 right-2 sm:right-4 opacity-10 sm:opacity-20">
            <Sparkles className="h-20 sm:h-32 w-20 sm:w-32 text-slate-600" />
          </div>
          
          <div className="relative max-w-4xl mx-auto text-center py-8 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8">
            {/* Hero Badge */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-slate-200 to-teal-100 text-slate-700 px-4 sm:px-6 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium mb-4 sm:mb-6">
              <Sparkles className="h-3 sm:h-4 w-3 sm:w-4" />
              AI-Powered Recipe Discovery
            </div>
            
            {/* Hero Title */}
            <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-slate-900 mb-4 sm:mb-6 leading-tight">
              What Sounds{" "}
              <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                Delicious
              </span>{" "}
              Today?
            </h1>
            
            {/* Hero Description */}
            <p className="text-base sm:text-lg lg:text-xl text-slate-600 mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed">
              Tell me your ingredients, dietary preferences, or what you&apos;re craving. I&apos;ll create the perfect recipe just for you.
            </p>

            {/* Enhanced Search Input */}
            <div className="max-w-2xl mx-auto mb-6 sm:mb-8">
              <VoiceSearchInput
                onSearch={handleSearch}
                placeholder="Try: 'I have chicken and rice' or 'quick healthy dinner'"
                isLoading={isLoading}
                className="h-14 sm:h-16 text-base sm:text-lg shadow-lg border-2 border-slate-200/50 bg-white/90 backdrop-blur-sm rounded-2xl"
              />
            </div>

            {/* Quick Action Chips */}
            <div className="flex flex-wrap gap-2 sm:gap-3 justify-center mb-6 sm:mb-8">
              {quickSuggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  onClick={() => handleSearch(suggestion.text)}
                  className="group bg-white/70 backdrop-blur-sm hover:bg-white hover:shadow-md transition-all duration-300 rounded-lg sm:rounded-xl border-2 border-slate-200/50 hover:border-teal-300 text-xs sm:text-sm"
                >
                  <span className="mr-1.5 sm:mr-2 text-base sm:text-lg">{suggestion.icon}</span>
                  <span className="text-slate-700 font-medium hidden sm:inline">{suggestion.text}</span>
                  <span className="text-slate-700 font-medium inline sm:hidden">{suggestion.text.split(' ').slice(0, 2).join(' ')}</span>
                  <ArrowRight className="ml-1.5 sm:ml-2 h-3 sm:h-4 w-3 sm:w-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </Button>
              ))}
            </div>

            {/* Voice Hint */}
            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-slate-500">
              <Mic className="h-4 w-4" />
              <span>Click the mic button or type your request</span>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12 sm:py-20">
            <div className="relative inline-block">
              <div className="w-12 sm:w-16 h-12 sm:h-16 bg-gradient-to-r from-slate-600 to-teal-600 rounded-full flex items-center justify-center mb-4 sm:mb-6">
                <ChefHat className="h-6 sm:h-8 w-6 sm:w-8 text-white animate-bounce" />
              </div>
              <div className="absolute -top-2 -right-2 w-5 sm:w-6 h-5 sm:h-6 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full animate-ping" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2">Crafting Perfect Recipes</h3>
            <p className="text-sm sm:text-base text-slate-600">Our AI chef is selecting the best recipes for you...</p>
          </div>
        )}

        {/* Results Section */}
        {recipes.length > 0 && !isLoading && (
          <div className="mb-8 sm:mb-12">
            {/* Results Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
              <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <div className="w-9 sm:w-10 h-9 sm:h-10 bg-gradient-to-r from-slate-600 to-teal-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                  <Star className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Perfect Matches</h2>
                  <p className="text-xs sm:text-sm text-slate-600">AI-curated recipes just for you</p>
                </div>
              </div>
              <Badge 
                variant="secondary" 
                className="bg-gradient-to-r from-slate-200 to-teal-100 text-slate-700 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium whitespace-nowrap"
              >
                {recipes.length} recipes
              </Badge>
            </div>

            {/* Recipe Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {recipes.map((recipe, index) => (
                <Card 
                  key={recipe.id || index} 
                  className="group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-white/70 backdrop-blur-sm hover:bg-white hover:scale-100 sm:hover:scale-105 flex flex-col h-full"
                >
                  <CardHeader className="pb-3 sm:pb-4">
                    <div className="flex items-start justify-between gap-2 mb-2 sm:mb-3">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg sm:text-xl font-bold text-slate-900 mb-1 sm:mb-2 group-hover:text-teal-600 transition-colors duration-300 line-clamp-2">
                          {recipe.title}
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-2">
                          {recipe.description}
                        </CardDescription>
                      </div>
                      
                      {/* Add Favorite Button for saved recipes */}
                      {recipe.id && !recipe.id.startsWith('temp-') && (
                        <FavoriteButton 
                          recipeId={recipe.id} 
                          size="sm"
                          className="ml-2 opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 flex-shrink-0"
                        />
                      )}
                    </div>
                    
                    {/* Difficulty Badge */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={`${getDifficultyColor(recipe.difficulty)} px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm font-medium capitalize`}>
                        {recipe.difficulty}
                      </Badge>
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`h-2.5 sm:h-3 w-2.5 sm:w-3 ${i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                          />
                        ))}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0 flex-1 flex flex-col">
                    {/* Recipe Stats */}
                    <div className="flex items-center justify-between text-xs sm:text-sm text-slate-600 mb-4 sm:mb-6 bg-slate-50/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 sm:w-8 h-7 sm:h-8 bg-gradient-to-r from-teal-100 to-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Clock className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-teal-600" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-900 text-xs sm:text-sm">
                            {(recipe.prep_time || recipe.prepTime || 0) + (recipe.cook_time || recipe.cookTime || 0)}m
                          </div>
                          <div className="text-xs text-slate-500">Total time</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 sm:w-8 h-7 sm:h-8 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Users className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-emerald-600" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-900 text-xs sm:text-sm">{recipe.servings || 'N/A'}</div>
                          <div className="text-xs text-slate-500">Servings</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-cyan-100 to-teal-100 rounded-lg flex items-center justify-center">
                          <Utensils className="h-4 w-4 text-cyan-600" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-900 text-xs">{recipe.cuisine_type || 'Various'}</div>
                          <div className="text-xs text-slate-500">Cuisine</div>
                        </div>
                      </div>
                    </div>

                    {/* Key Ingredients */}
                    <div className="mb-6">
                      <p className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-teal-600" />
                        Key Ingredients
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {recipe.ingredients?.slice(0, 3).map((ingredient, index) => (
                          <Badge 
                            key={index} 
                            variant="secondary" 
                            className="bg-gradient-to-r from-slate-100 to-teal-50 text-slate-700 border-slate-200 text-xs font-medium px-3 py-1"
                          >
                            {typeof ingredient === 'string' ? ingredient : ingredient.name}
                          </Badge>
                        ))}
                        {recipe.ingredients?.length > 3 && (
                          <Badge 
                            variant="secondary" 
                            className="bg-gradient-to-r from-slate-50 to-slate-100 text-slate-600 text-xs"
                          >
                            +{recipe.ingredients.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 sm:gap-3 mt-auto">
                      <Button 
                        className="flex-1 bg-gradient-to-r from-slate-600 to-teal-600 hover:from-slate-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 gap-1.5 sm:gap-2 text-sm sm:text-base min-h-10 sm:min-h-11"
                        onClick={() => handleStartCooking(recipe, index)}
                        disabled={savingRecipes.has(recipe.id)}
                      >
                        {savingRecipes.has(recipe.id) ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
                            <span className="hidden sm:inline">Preparing...</span>
                          </>
                        ) : (
                          <>
                            <ChefHat className="h-4 w-4 flex-shrink-0" />
                            <span>Cook</span>
                          </>
                        )}
                      </Button>
                      
                      {recipe.is_generated && !recipe.is_saved && (
                        <Button
                          variant="outline" 
                          onClick={() => handleSaveRecipe(recipe)}
                          disabled={savingRecipes.has(recipe.id)}
                          className="gap-1.5 sm:gap-2 border-2 hover:bg-teal-50 hover:border-teal-300 transition-all duration-300 min-h-10 sm:min-h-11"
                          title="Save recipe"
                        >
                          {savingRecipes.has(recipe.id) ? (
                            <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
                          ) : (
                            <Bookmark className="h-4 w-4 flex-shrink-0" />
                          )}
                          <span className="hidden sm:inline text-sm">Save</span>
                        </Button>
                      )}
                      
                      {recipe.is_saved && (
                        <>
                          <Button
                            variant="outline" 
                            disabled
                            className="gap-1.5 sm:gap-2 border-teal-200 bg-teal-50 min-h-10 sm:min-h-11"
                            title="Recipe saved"
                          >
                            <BookmarkCheck className="h-4 w-4 text-teal-600" />
                          </Button>
                          
                          {/* Add to Collection Button - only show for saved recipes */}
                          {recipe.id && !recipe.id.startsWith('temp-') && (
                            <AddToCollectionButton recipeId={recipe.id} />
                          )}
                        </>
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
              <div className="w-24 h-24 bg-gradient-to-r from-slate-200 to-teal-100 rounded-full flex items-center justify-center">
                <Search className="h-12 w-12 text-slate-600" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-4">Ready to Discover Amazing Recipes?</h3>
            <p className="text-lg text-slate-600 mb-8 max-w-md mx-auto">
              Use the search above, try voice input, or click one of the suggestion chips to get started
            </p>
            <div className="flex items-center justify-center gap-6 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <Mic className="h-5 w-5 text-teal-600" />
                <span>Voice Search</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-cyan-600" />
                <span>AI-Powered</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-slate-600" />
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

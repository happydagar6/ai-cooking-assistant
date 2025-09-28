"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ChefHat, Clock, Users, Utensils, Loader2, Bookmark, BookmarkCheck } from "lucide-react"
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
    const loadingToast = showToast.loading('Generating recipes...')

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
        return "bg-green-100 text-green-800 border-green-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "hard":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex flex-col">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 flex-grow">
        {/* Back Navigation */}
        <BackNavigation showBackButton={true} showHomeButton={true} />
        
        {/* Search Section */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold mb-2">What would you like to cook?</h2>
            <p className="text-muted-foreground">Tell me what ingredients you have or what you're craving</p>
          </div>

          <div className="mb-4">
            <VoiceSearchInput
              onSearch={handleSearch}
              placeholder="e.g., 'I have eggs and bread' or 'something quick and healthy'"
              isLoading={isLoading}
            />
          </div>

          {/* Quick Suggestions */}
          <div className="mt-6">
            <p className="text-sm text-muted-foreground mb-3">Try these suggestions:</p>
            <div className="flex flex-wrap gap-2">
              {[
                "Quick breakfast with eggs",
                "Healthy dinner for two",
                "Vegetarian pasta dish",
                "Something with chicken",
                "Easy dessert recipe",
              ].map((suggestion) => (
                <Button
                  key={suggestion}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSearch(suggestion)}
                  className="text-xs"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Finding perfect recipes for you...</p>
          </div>
        )}

        {/* Results */}
        {recipes.length > 0 && !isLoading && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold">Recipe Suggestions</h3>
              <Badge variant="secondary">{recipes.length} recipes found</Badge>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recipes.map((recipe, index) => (
                <Card key={recipe.id || index} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{recipe.title}</CardTitle>
                        <CardDescription className="text-sm">{recipe.description}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getDifficultyColor(recipe.difficulty)} variant="outline">
                          {recipe.difficulty}
                        </Badge>
                        
                        {/* Add Favorite Button for saved recipes */}
                        {recipe.id && !recipe.id.startsWith('temp-') && (
                          <FavoriteButton 
                            recipeId={recipe.id} 
                            size="sm"
                            className="ml-1"
                          />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {(recipe.prep_time || recipe.prepTime || 0) + (recipe.cook_time || recipe.cookTime || 0)}m
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {recipe.servings || 'N/A'}
                      </div>
                      <div className="flex items-center gap-1">
                        <Utensils className="h-4 w-4" />
                        {recipe.cuisine_type || recipe.cuisineType || 'Various'}
                      </div>
                    </div>

                    <Separator className="mb-4" />

                    <div className="mb-4">
                      <p className="text-sm font-medium mb-2">Key Ingredients:</p>
                      <div className="flex flex-wrap gap-1">
                        {recipe.ingredients?.slice(0, 3).map((ingredient, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {typeof ingredient === 'string' ? ingredient : ingredient.name}
                          </Badge>
                        ))}
                        {recipe.ingredients?.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{recipe.ingredients.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        className="flex-1 gap-2"
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
                          size="sm"
                          onClick={() => handleSaveRecipe(recipe)}
                          disabled={savingRecipes.has(recipe.id)}
                          className="gap-1"
                        >
                          {savingRecipes.has(recipe.id) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Bookmark className="h-4 w-4" />
                          )}
                          {savingRecipes.has(recipe.id) ? 'Saving...' : 'Save for Later'}
                        </Button>
                      )}
                      
                      {recipe.is_saved && (
                        <Button
                          variant="outline" 
                          size="sm"
                          disabled
                          className="gap-1"
                        >
                          <BookmarkCheck className="h-4 w-4 text-green-600" />
                          Saved
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
          <div className="text-center py-12">
            <ChefHat className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ready to find your next recipe?</h3>
            <p className="text-muted-foreground mb-4">
              Use the search above or try voice input to tell me what you want to cook
            </p>
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

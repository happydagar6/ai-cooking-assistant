"use client";

import React, { useState, useMemo, useCallback, Suspense } from "react";
import dynamic from "next/dynamic";
import { useTouchGestures } from "@/hooks/use-touch-gestures";
import { PullToRefreshIndicator } from "@/components/pull-to-refresh";
import { FavoriteButton } from "@/components/favorite-button";
import { useAuth } from "@/lib/auth-context";

// ⚡ Lazy load analytics dashboard - only load when analytics tab is visible
const AnalyticsDashboard = dynamic(
  () => import('@/components/analytics-dashboard').then(mod => ({ 
    default: mod.AnalyticsDashboard 
  })),
  { 
    loading: () => (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    ),
    ssr: false
  }
)

const SmartSuggestions = dynamic(
  () => import('@/components/smart-suggestions'),
  { 
    loading: () => <div className="h-48 bg-gray-200 rounded animate-pulse"></div>,
    ssr: false
  }
)

const CookingAchievements = dynamic(
  () => import('@/components/cooking-achievements'),
  { 
    loading: () => <div className="h-48 bg-gray-200 rounded animate-pulse"></div>,
    ssr: false
  }
)

// ✨ OPTIMIZED: Import React Query hooks for caching
import { 
  useUserRecipes, 
  useDeleteRecipeMutation 
} from "@/hooks/use-optimized-queries";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  ChefHat,
  Clock,
  Users,
  Utensils,
  Loader2,
  Trash2,
  Filter,
  Search,
  X,
  Heart,
  Zap,
  History,
  Grid,
} from "lucide-react";
import Link from "next/link";
import ProtectedRoute from "@/components/protected-route";
import Navigation from "@/components/navigation";
import { BackNavigation } from "@/components/back-navigation";
import { DeleteConfirmationDialog } from "@/components/confirmation-dialog";
import { showToast, recipeToasts } from "@/lib/toast";

// 🎯 PAGINATION CONSTANTS - Controls how many recipes to show
const INITIAL_LOAD = 6;      // Show 6 recipes initially for quick load
const RECIPES_PER_LOAD = 12; // Load 12 more when "Load More" is clicked
const SEARCH_LIMIT = 50;     // Max recipes to show in search results

function DashboardContent() {
  // ✨ OPTIMIZED: Get user from auth context
  const { user } = useAuth();
  const userId = user?.id;

  // ✨ OPTIMIZED: Use React Query hooks instead of manual state management
  const {
    data: recipes = [],
    isLoading,
    error,
    refetch: refetchRecipes
  } = useUserRecipes(userId);

  // ✨ OPTIMIZED: Use mutation hook for deletions with optimistic updates
  const deleteRecipeMutation = useDeleteRecipeMutation(userId);

  // UI state for filters and dialogs
  const [deletingRecipes, setDeletingRecipes] = useState(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState(null);

  // 🔍 SEARCH-FIRST: Enhanced search state with debouncing
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  // 📑 CATEGORY TABS: Active tab management
  const [activeTab, setActiveTab] = useState("recent");
  
  // 🎯 SMART PAGINATION: Separate pagination state for each tab
  const [paginationState, setPaginationState] = useState({
    recent: { page: 1, hasMore: true },
    favorites: { page: 1, hasMore: true },
    quick: { page: 1, hasMore: true },
    all: { page: 1, hasMore: true }
  });

  // Original filter states (now work within each tab)
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [cuisineFilter, setCuisineFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");

  // 🧠 SMART CATEGORIZATION: Organize recipes into meaningful categories
  const categorizedRecipes = useMemo(() => {
    if (!recipes || recipes.length === 0) return {
      recent: [], favorites: [], quick: [], all: []
    };

    // Base filter function (applies difficulty, cuisine, time filters)
    const applyBaseFilters = (recipeList) => {
      return recipeList.filter((recipe) => {
        // Difficulty filter
        const matchesDifficulty =
          difficultyFilter === "all" || recipe.difficulty === difficultyFilter;

        // Cuisine filter  
        const matchesCuisine =
          cuisineFilter === "all" || recipe.cuisine_type === cuisineFilter;

        // Time filter
        const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0);
        let matchesTime = true;
        if (timeFilter === "quick") {
          matchesTime = totalTime <= 30;
        } else if (timeFilter === "medium") {
          matchesTime = totalTime > 30 && totalTime <= 60;
        } else if (timeFilter === "long") {
          matchesTime = totalTime > 60;
        }

        return matchesDifficulty && matchesCuisine && matchesTime;
      });
    };

    // 📅 Recent: Last 20 recipes, most recent first
    const recent = applyBaseFilters(
      [...recipes]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 20)
    );

    // ❤️ Favorites: Recipes marked as favorites
    const favorites = applyBaseFilters(
      recipes.filter(recipe => recipe.is_favorite === true)
    );

    // ⚡ Quick: Recipes that take 30 minutes or less
    const quick = applyBaseFilters(
      recipes.filter(recipe => {
        const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0);
        return totalTime <= 30;
      })
    );

    // 📚 All: All recipes with base filters applied
    const all = applyBaseFilters(recipes);

    return { recent, favorites, quick, all };
  }, [recipes, difficultyFilter, cuisineFilter, timeFilter]);

  // 🔍 SEARCH-FIRST: When user searches, show all matching results
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];

    return recipes.filter((recipe) => {
      const matchesSearch =
        recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipe.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipe.ingredients?.some((ingredient) =>
          (typeof ingredient === "string" ? ingredient : ingredient.name)
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
        );
      return matchesSearch;
    }).slice(0, SEARCH_LIMIT); // Limit search results for performance
  }, [recipes, searchTerm]);

  // 🎯 SMART PAGINATION: Get recipes to display based on current tab and pagination
  const getDisplayedRecipes = useCallback((category) => {
    const categoryRecipes = categorizedRecipes[category] || [];
    const currentPage = paginationState[category]?.page || 1;
    
    // For recent tab, show fewer initially (6), others show 12
    const initialCount = category === 'recent' ? INITIAL_LOAD : RECIPES_PER_LOAD;
    const recipesPerPage = category === 'recent' && currentPage === 1 
      ? INITIAL_LOAD 
      : RECIPES_PER_LOAD;
    
    const totalToShow = category === 'recent' && currentPage === 1
      ? initialCount
      : initialCount + (currentPage - 1) * RECIPES_PER_LOAD;
      
    return categoryRecipes.slice(0, totalToShow);
  }, [categorizedRecipes, paginationState]);

  // 📊 CATEGORY STATS: Calculate counts for tab badges
  const categoryStats = useMemo(() => {
    return {
      recent: categorizedRecipes.recent.length,
      favorites: categorizedRecipes.favorites.length, 
      quick: categorizedRecipes.quick.length,
      all: categorizedRecipes.all.length
    };
  }, [categorizedRecipes]);

  // 🎯 CURRENT RECIPES: What to actually show on screen
  const currentRecipes = useMemo(() => {
    // If user is searching, show search results (overrides everything)
    if (searchTerm.trim()) {
      return searchResults;
    }
    
    // Otherwise show recipes for the active tab with pagination
    return getDisplayedRecipes(activeTab);
  }, [searchTerm, searchResults, activeTab, getDisplayedRecipes]);

  // 🔄 LOAD MORE: Check if current tab has more recipes to load
  const hasMoreRecipes = useMemo(() => {
    if (searchTerm.trim()) return false; // No "load more" for search
    
    const categoryRecipes = categorizedRecipes[activeTab] || [];
    const currentPage = paginationState[activeTab]?.page || 1;
    const currentlyShowing = getDisplayedRecipes(activeTab).length;
    
    return currentlyShowing < categoryRecipes.length;
  }, [searchTerm, activeTab, categorizedRecipes, paginationState, getDisplayedRecipes]);

  // 🔄 LOAD MORE: Smart pagination for current tab
  const loadMore = useCallback(() => {
    if (searchTerm.trim() || !hasMoreRecipes) return; // Don't paginate search results
    
    setPaginationState(prev => ({
      ...prev,
      [activeTab]: {
        page: (prev[activeTab]?.page || 1) + 1,
        loading: true
      }
    }));

    // Simulate loading delay for better UX
    setTimeout(() => {
      setPaginationState(prev => ({
        ...prev,
        [activeTab]: {
          ...prev[activeTab],
          loading: false
        }
      }));
    }, 300);
  }, [searchTerm, hasMoreRecipes, activeTab]);

  // 🎯 TAB CHANGE: Handle category tab switching
  const handleTabChange = useCallback((newTab) => {
    setActiveTab(newTab);
    
    // Initialize pagination for tab if not exists
    if (!paginationState[newTab]) {
      setPaginationState(prev => ({
        ...prev,
        [newTab]: { page: 1, loading: false }
      }));
    }
  }, [paginationState]);

  // Get unique values for filter options
  const uniqueCuisines = useMemo(() => {
    if (!recipes || recipes.length === 0) return [];
    const cuisines = recipes.map((r) => r.cuisine_type).filter(Boolean);
    return [...new Set(cuisines)].sort();
  }, [recipes]);

  // ✨ OPTIMIZED: Touch gesture controls with React Query refetch
  const {
    gestureHandlers,
    isPulling,
    pullDistance,
    isRefreshing,
    pullProgress,
  } = useTouchGestures({
    onPullToRefresh: async () => {
      // ✨ OPTIMIZED: Use React Query refetch instead of manual API call
      await refetchRecipes();
      showToast.success("Recipes Refreshed", "Recipe list updated from cache or server");
    },
    enabled: !isLoading,
  });

  const handleDeleteClick = (recipe) => {
    setRecipeToDelete(recipe);
    setDeleteDialogOpen(true);
  };

  // ✨ OPTIMIZED: Delete recipe with React Query mutation and optimistic updates
  const handleDeleteRecipe = async () => {
    if (!recipeToDelete) return;

    const recipeId = recipeToDelete.id;
    const recipeName = recipeToDelete.title;

    setDeletingRecipes((prev) => new Set([...prev, recipeId]));
    setDeleteDialogOpen(false);

    const toastId = showToast.loading(`Deleting "${recipeName}"...`);

    try {
      // ✨ OPTIMIZED: Use React Query mutation with automatic cache updates
      await deleteRecipeMutation.mutateAsync(recipeId);
      
      // Success handled automatically by mutation's onSuccess
      recipeToasts.deleteSuccess(recipeName, toastId);
    } catch (error) {
      console.error("Delete recipe error:", error);
      recipeToasts.deleteError(recipeName, toastId);
    } finally {
      setDeletingRecipes((prev) => {
        const newSet = new Set(prev);
        newSet.delete(recipeId);
        return newSet;
      });
      setRecipeToDelete(null);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800 border-green-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "hard":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // ✨ OPTIMIZED: Better loading states and error handling
  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <h2 className="text-xl font-semibold">Unable to load recipes</h2>
            <p className="text-sm mt-2">Please check your connection and try again</p>
          </div>
          <Button onClick={() => refetchRecipes()} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading your saved recipes...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PullToRefreshIndicator
        isPulling={isPulling}
        isRefreshing={isRefreshing}
        pullProgress={pullProgress}
        pullDistance={pullDistance}
      />
      <div 
        className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 gesture-container flex flex-col"
        {...gestureHandlers}
        style={{
          paddingTop: isPulling ? Math.min(pullDistance, 80) : 0,
          transition: !isPulling ? 'padding-top 0.3s ease-out' : 'none'
        }}
      >
      <Navigation />
      <main className="container mx-auto px-4 py-8 flex-grow">
        <BackNavigation
          showHomeButton={true}
          showBackButton={false}
          homeLabel="Back to Home"
        />

        {/* Search and Filter Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search recipes, ingredients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => setSearchTerm("")}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div className="flex gap-2 flex-wrap">
              {/* Difficulty Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Difficulty
                    {difficultyFilter !== "all" && (
                      <Badge variant="secondary" className="ml-1 h-4 text-xs">
                        {difficultyFilter}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Filter by Difficulty</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setDifficultyFilter("all")}>
                    All Difficulties
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setDifficultyFilter("easy")}>
                    Easy
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setDifficultyFilter("medium")}
                  >
                    Medium
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setDifficultyFilter("hard")}>
                    Hard
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Cuisine Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Utensils className="h-4 w-4" />
                    Cuisine
                    {cuisineFilter !== "all" && (
                      <Badge variant="secondary" className="ml-1 h-4 text-xs">
                        {cuisineFilter}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Filter by Cuisine</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setCuisineFilter("all")}>
                    All Cuisines
                  </DropdownMenuItem>
                  {uniqueCuisines.map((cuisine) => (
                    <DropdownMenuItem
                      key={cuisine}
                      onClick={() => setCuisineFilter(cuisine)}
                    >
                      {cuisine}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Time Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Clock className="h-4 w-4" />
                    Time
                    {timeFilter !== "all" && (
                      <Badge variant="secondary" className="ml-1 h-4 text-xs">
                        {timeFilter === "quick"
                          ? "≤30m"
                          : timeFilter === "medium"
                          ? "30-60m"
                          : ">{60}m"}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Filter by Cooking Time</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setTimeFilter("all")}>
                    Any Time
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTimeFilter("quick")}>
                    Quick (≤30 min)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTimeFilter("medium")}>
                    Medium (30-60 min)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTimeFilter("long")}>
                    Long ({">"}60 min)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Clear All Filters */}
              {(searchTerm ||
                difficultyFilter !== "all" ||
                cuisineFilter !== "all" ||
                timeFilter !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setDifficultyFilter("all");
                    setCuisineFilter("all");
                    setTimeFilter("all");
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-5 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            My Recipe Collection
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Your saved recipes are ready when you are. Start cooking or discover
            new favorites!
          </p>
        </div>

        {/* 🎯 SMART CATEGORY TABS: Show different recipe collections */}
        {!searchTerm.trim() && (
          <div className="mb-6">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-4">
                <TabsTrigger value="recent" className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  <span>Recent</span>
                  {categoryStats.recent > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 text-xs">
                      {categoryStats.recent}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="favorites" className="flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  <span>Favorites</span>
                  {categoryStats.favorites > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 text-xs">
                      {categoryStats.favorites}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="quick" className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  <span>Quick</span>
                  {categoryStats.quick > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 text-xs">
                      {categoryStats.quick}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="all" className="flex items-center gap-2">
                  <Grid className="h-4 w-4" />
                  <span>All</span>
                  {categoryStats.all > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 text-xs">
                      {categoryStats.all}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        )}

        {/* Analytics Dashboard Section - Lazy loaded */}
        <section className="mb-8" id="analytics-section">
          <Suspense fallback={
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          }>
            <AnalyticsDashboard />
          </Suspense>
        </section>

        {/* Smart Suggestions Section - Lazy loaded */}
        <section className="mb-8">
          <Suspense fallback={<div className="h-48 bg-gray-200 rounded animate-pulse"></div>}>
            <SmartSuggestions recipes={recipes} />
          </Suspense>
        </section>

        {/* Cooking Achievements Section - Lazy loaded */}
        <section className="mb-12">
          <Suspense fallback={<div className="h-48 bg-gray-200 rounded animate-pulse"></div>}>
            <CookingAchievements recipes={recipes} />
          </Suspense>
        </section>

        {recipes.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold">
                {searchTerm.trim() ? (
                  `Search Results (${currentRecipes.length} found)`
                ) : (
                  <>
                    {activeTab === 'recent' && 'Recent Recipes'}
                    {activeTab === 'favorites' && 'Favorite Recipes'} 
                    {activeTab === 'quick' && 'Quick Recipes (≤30 min)'}
                    {activeTab === 'all' && 'All Saved Recipes'}
                    {currentRecipes.length !== categoryStats[activeTab] && (
                      <span className="text-muted-foreground text-lg ml-2">
                        (Showing {currentRecipes.length} of {categoryStats[activeTab]})
                      </span>
                    )}
                  </>
                )}
              </h3>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {currentRecipes.length} recipe{currentRecipes.length !== 1 ? 's' : ''}
                </Badge>
                {!searchTerm.trim() && currentRecipes.length !== recipes.length && (
                  <Badge variant="outline">
                    {recipes.length} total
                  </Badge>
                )}
              </div>
            </div>

            {currentRecipes.length > 0 ? (
              <>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {currentRecipes.map((recipe) => (
                  <Card
                    key={recipe.id}
                    className="hover:shadow-lg transition-shadow"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-2">
                            {recipe.title}
                          </CardTitle>
                          <CardDescription className="text-sm">
                            {recipe.description}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={getDifficultyColor(recipe.difficulty)}
                            variant="outline"
                          >
                            {recipe.difficulty}
                          </Badge>
                          
                          {/* Add Favorite Button */}
                          <FavoriteButton 
                            recipeId={recipe.id} 
                            size="sm"
                            className="ml-1"
                          />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {(recipe.prep_time || 0) + (recipe.cook_time || 0)}m
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {recipe.servings || "N/A"}
                        </div>
                        <div className="flex items-center gap-1">
                          <Utensils className="h-4 w-4" />
                          {recipe.cuisine_type || "Various"}
                        </div>
                      </div>

                      <Separator className="mb-4" />

                      <div className="mb-4">
                        <p className="text-sm font-medium mb-2">
                          Key Ingredients:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {recipe.ingredients
                            ?.slice(0, 3)
                            .map((ingredient, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="text-xs"
                              >
                                {typeof ingredient === "string"
                                  ? ingredient
                                  : ingredient.name}
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
                        <Link href={`/cook/${recipe.id}`} className="flex-1">
                          <Button className="w-full gap-2">
                            <ChefHat className="h-4 w-4" />
                            Start Cooking
                          </Button>
                        </Link>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteClick(recipe)}
                          disabled={deletingRecipes.has(recipe.id)}
                          className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          {deletingRecipes.has(recipe.id) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {/* 🔄 LOAD MORE: Smart pagination button */}
              {hasMoreRecipes && !searchTerm.trim() && (
                <div className="mt-8 text-center">
                  <Button
                    onClick={loadMore}
                    variant="outline" 
                    className="gap-2 px-8"
                    disabled={paginationState[activeTab]?.loading}
                  >
                    {paginationState[activeTab]?.loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading more...
                      </>
                    ) : (
                      <>
                        <Grid className="h-4 w-4" />
                        Load More Recipes
                      </>
                    )}
                  </Button>
                </div>
              )}
              </>
            ) : (
              <div className="text-center py-12">
                <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No recipes match your filters
                </h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search terms or filters to find recipes.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setDifficultyFilter("all");
                    setCuisineFilter("all");
                    setTimeFilter("all");
                  }}
                >
                  Clear All Filters
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <ChefHat className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No recipes saved yet</h3>
            <p className="text-muted-foreground mb-4">
              Start by searching for recipes and save your favorites!
            </p>
            <Link href="/search">
              <Button className="gap-2">
                <ChefHat className="h-4 w-4" />
                Find Recipes
              </Button>
            </Link>
          </div>
        )}

        <DeleteConfirmationDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleDeleteRecipe}
          title="Delete Recipe"
          description={
            recipeToDelete
              ? `Are you sure you want to delete "${recipeToDelete.title}"? This action cannot be undone.`
              : ""
          }
        />
      </main>
      </div>
    </>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute redirectTo="/dashboard">
      <DashboardContent />
    </ProtectedRoute>
  );
}

/**
 * SMART RECOMMENDATION SERVICE
 * =================================
 * Provides intelligent recipe recommendations based on:
 * - User preferences and behavior
 * - Time constraints
 * - Available ingredients
 * - Trending recipes
 * - Similarity algorithms
 * 
 * Performance optimized with caching and efficient queries
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export class RecommendationService {
  
  /**
   * ==================================
   * "WHAT'S FOR DINNER?" RECOMMENDATION
   * ==================================
   * Smart recommendation based on time, preferences, and context
   */
  static async getWhatsForDinner(userId, context = {}) {
    try {
      const {
        timeAvailable = 60, // minutes
        mealType = 'dinner',
        servings = 2,
      } = context;

      // 1. Get user preferences
      const userPrefs = await this.getUserPreferences(userId);
      
      // 2. Check cache first
      const cached = await this.getCachedRecommendation(
        userId,
        'whats_for_dinner',
        { timeAvailable, mealType }
      );
      
      if (cached) {
        return this.enrichRecipesWithScores(cached.recipe_ids);
      }

      // 3. Get user's recent cooking history (last 30 days)
      const { data: recentRecipes } = await supabase
        .from('recipe_interactions')
        .select('recipe_id')
        .eq('user_id', userId)
        .eq('interaction_type', 'cook')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .limit(20);

      const recentRecipeIds = recentRecipes?.map(r => r.recipe_id) || [];

      // 4. Build smart query
      let query = supabase
        .from('recipes')
        .select(`
          id, title, description, cuisine_type, difficulty,
          prep_time, cook_time, servings, ingredients, dietary_tags,
          recipe_scores!inner(popularity_score, quality_score, cook_count)
        `)
        .lte('prep_time', Math.floor(timeAvailable * 0.4)) // 40% of time for prep
        .lte('cook_time', Math.floor(timeAvailable * 0.6)); // 60% of time for cooking

      // Filter by dietary restrictions
      if (userPrefs?.dietary_restrictions?.length > 0) {
        query = query.contains('dietary_tags', userPrefs.dietary_restrictions);
      }

      // Filter by preferred difficulty
      if (userPrefs?.preferred_difficulty) {
        query = query.eq('difficulty', userPrefs.preferred_difficulty);
      }

      // Exclude recently cooked recipes (variety)
      if (recentRecipeIds.length > 0) {
        query = query.not('id', 'in', `(${recentRecipeIds.join(',')})`);
      }

      // Order by quality and popularity
      query = query
        .order('quality_score', { foreignTable: 'recipe_scores', ascending: false })
        .order('popularity_score', { foreignTable: 'recipe_scores', ascending: false })
        .limit(20);

      const { data: candidates, error } = await query;

      if (error) throw error;

      // 5. Apply ML-style scoring algorithm
      const scoredRecipes = this.scoreRecipesForUser(candidates, userPrefs, context);
      
      // 6. Get top 3 recommendations with different reasons
      const recommendations = this.selectDiverseRecommendations(scoredRecipes, 3);

      // 7. Cache recommendations (expires in 1 hour)
      await this.cacheRecommendation(
        userId,
        'whats_for_dinner',
        recommendations.map(r => r.id),
        { timeAvailable, mealType },
        60 * 60 // 1 hour
      );

      return recommendations;
    } catch (error) {
      console.error('Error getting dinner recommendation:', error);
      return await this.getFallbackRecommendations(userId, 3);
    }
  }

  /**
   * ==================================
   * SIMILAR RECIPES
   * ==================================
   * Find recipes similar to a given recipe
   */
  static async getSimilarRecipes(recipeId, userId = null, limit = 6) {
    try {
      // 1. Get the base recipe
      const { data: baseRecipe } = await supabase
        .from('recipes')
        .select('cuisine_type, difficulty, prep_time, cook_time, ingredients, dietary_tags')
        .eq('id', recipeId)
        .single();

      if (!baseRecipe) return [];

      // 2. Calculate similarity scores
      const { data: candidates } = await supabase
        .from('recipes')
        .select(`
          id, title, description, cuisine_type, difficulty,
          prep_time, cook_time, servings, ingredients, dietary_tags,
          recipe_scores(popularity_score, cook_count)
        `)
        .neq('id', recipeId) // Exclude the base recipe
        .limit(100); // Get more candidates for better filtering

      if (!candidates) return [];

      // 3. Score candidates based on similarity
      const scoredCandidates = candidates.map(recipe => {
        let similarityScore = 0;

        // Same cuisine type: +30 points
        if (recipe.cuisine_type === baseRecipe.cuisine_type) {
          similarityScore += 30;
        }

        // Same difficulty: +20 points
        if (recipe.difficulty === baseRecipe.difficulty) {
          similarityScore += 20;
        }

        // Similar cooking time (±15 minutes): +15 points
        const timeDiff = Math.abs(
          (recipe.prep_time + recipe.cook_time) -
          (baseRecipe.prep_time + baseRecipe.cook_time)
        );
        if (timeDiff <= 15) {
          similarityScore += 15;
        }

        // Shared ingredients: +2 points per ingredient
        const baseIngredients = this.extractIngredientNames(baseRecipe.ingredients);
        const recipeIngredients = this.extractIngredientNames(recipe.ingredients);
        const sharedIngredients = baseIngredients.filter(ing =>
          recipeIngredients.includes(ing)
        );
        similarityScore += sharedIngredients.length * 2;

        // Shared dietary tags: +5 points per tag
        const sharedTags = baseRecipe.dietary_tags?.filter(tag =>
          recipe.dietary_tags?.includes(tag)
        ) || [];
        similarityScore += sharedTags.length * 5;

        // Boost by popularity: +10% of popularity score
        const popularityBoost = (recipe.recipe_scores?.popularity_score || 0) * 0.1;
        similarityScore += popularityBoost;

        return {
          ...recipe,
          similarityScore,
          sharedIngredients: sharedIngredients.length,
        };
      });

      // 4. Sort by similarity score and return top results
      return scoredCandidates
        .sort((a, b) => b.similarityScore - a.similarityScore)
        .slice(0, limit);

    } catch (error) {
      console.error('Error finding similar recipes:', error);
      return [];
    }
  }

  /**
   * ==================================
   * TRENDING RECIPES
   * ==================================
   * Get currently trending recipes
   */
  static async getTrendingRecipes(limit = 12) {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select(`
          id, title, description, cuisine_type, difficulty,
          prep_time, cook_time, servings, ingredients, dietary_tags,
          recipe_scores!inner(trending_score, view_count, cook_count)
        `)
        .order('trending_score', { foreignTable: 'recipe_scores', ascending: false })
        .order('view_count', { foreignTable: 'recipe_scores', ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching trending recipes:', error);
      return [];
    }
  }

  /**
   * ==================================
   * POPULAR RECIPES
   * ==================================
   * Get all-time popular recipes
   */
  static async getPopularRecipes(limit = 12) {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select(`
          id, title, description, cuisine_type, difficulty,
          prep_time, cook_time, servings, ingredients, dietary_tags,
          recipe_scores!inner(popularity_score, cook_count, favorite_count)
        `)
        .order('popularity_score', { foreignTable: 'recipe_scores', ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching popular recipes:', error);
      return [];
    }
  }

  /**
   * ==================================
   * COMPLETE MEAL SUGGESTIONS
   * ==================================
   * Suggest appetizer + main + dessert combinations
   */
  static async getCompleteMealSuggestion(userId, context = {}) {
    try {
      const {
        occasion = 'casual', // 'date_night', 'family_dinner', 'party', 'casual'
        totalTime = 120, // Total time available
        servings = 4,
      } = context;

      const userPrefs = await this.getUserPreferences(userId);

      // Time allocation: 20% appetizer, 60% main, 20% dessert
      const appetizerTime = totalTime * 0.2;
      const mainTime = totalTime * 0.6;
      const dessertTime = totalTime * 0.2;

      // Get main course (most important)
      const mainCourses = await this.getRecipesByType(
        'main',
        mainTime,
        servings,
        userPrefs
      );

      if (!mainCourses || mainCourses.length === 0) {
        return null;
      }

      const selectedMain = mainCourses[0];

      // Get complementary appetizer
      const appetizers = await this.getComplementaryRecipe(
        selectedMain,
        'appetizer',
        appetizerTime,
        servings,
        userPrefs
      );

      // Get complementary dessert
      const desserts = await this.getComplementaryRecipe(
        selectedMain,
        'dessert',
        dessertTime,
        servings,
        userPrefs
      );

      return {
        occasion,
        main: selectedMain,
        appetizer: appetizers?.[0] || null,
        dessert: desserts?.[0] || null,
        totalPrepTime: (appetizers?.[0]?.prep_time || 0) + selectedMain.prep_time + (desserts?.[0]?.prep_time || 0),
        totalCookTime: (appetizers?.[0]?.cook_time || 0) + selectedMain.cook_time + (desserts?.[0]?.cook_time || 0),
        servings,
      };
    } catch (error) {
      console.error('Error creating meal suggestion:', error);
      return null;
    }
  }

  /**
   * ==================================
   * PERSONALIZED FEED
   * ==================================
   * Generate personalized recipe feed based on history
   */
  static async getPersonalizedFeed(userId, page = 1, limit = 12) {
    try {
      const userPrefs = await this.getUserPreferences(userId);
      
      // Get user's interaction history
      const { data: interactions } = await supabase
        .from('recipe_interactions')
        .select('recipe_id, interaction_type, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);

      // Analyze user behavior patterns
      const behaviorProfile = this.analyzeUserBehavior(interactions);

      // Build personalized query
      let query = supabase
        .from('recipes')
        .select(`
          id, title, description, cuisine_type, difficulty,
          prep_time, cook_time, servings, ingredients, dietary_tags,
          recipe_scores(popularity_score, quality_score, trending_score)
        `);

      // Apply preference filters
      if (userPrefs?.dietary_restrictions?.length > 0) {
        query = query.contains('dietary_tags', userPrefs.dietary_restrictions);
      }

      if (userPrefs?.favorite_cuisines?.length > 0) {
        query = query.in('cuisine_type', userPrefs.favorite_cuisines);
      }

      if (behaviorProfile.preferredDifficulty) {
        query = query.eq('difficulty', behaviorProfile.preferredDifficulty);
      }

      if (userPrefs?.average_cooking_time) {
        query = query.lte(
          'cook_time',
          userPrefs.average_cooking_time
        );
      }

      // Pagination
      const offset = (page - 1) * limit;
      query = query
        .range(offset, offset + limit - 1)
        .order('trending_score', { foreignTable: 'recipe_scores', ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error generating personalized feed:', error);
      return [];
    }
  }

  /**
   * ==================================
   * TRACK INTERACTION
   * ==================================
   * Record user interaction for future recommendations
   */
  static async trackInteraction(userId, recipeId, interactionType, metadata = {}) {
    try {
      const { error } = await supabase
        .from('recipe_interactions')
        .insert({
          user_id: userId,
          recipe_id: recipeId,
          interaction_type: interactionType,
          interaction_metadata: metadata,
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error tracking interaction:', error);
      return false;
    }
  }

  /**
   * ==================================
   * HELPER METHODS
   * ==================================
   */

  // Get or create user preferences
  static async getUserPreferences(userId) {
    try {
      let { data: prefs } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Create default preferences if not exists
      if (!prefs) {
        const { data: newPrefs } = await supabase
          .from('user_preferences')
          .insert({ user_id: userId })
          .select()
          .single();
        prefs = newPrefs;
      }

      return prefs;
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return null;
    }
  }

  // Score recipes for specific user
  static scoreRecipesForUser(recipes, userPrefs, context) {
    return recipes.map(recipe => {
      let score = 0;
      let reasons = [];

      // Base score from database
      score += (recipe.recipe_scores?.popularity_score || 0) * 10;
      score += (recipe.recipe_scores?.quality_score || 0) * 10;

      // Cuisine match
      if (userPrefs?.favorite_cuisines?.includes(recipe.cuisine_type)) {
        score += 20;
        reasons.push(`You love ${recipe.cuisine_type} cuisine`);
      }

      // Difficulty match
      if (recipe.difficulty === userPrefs?.preferred_difficulty) {
        score += 15;
        reasons.push('Matches your skill level');
      }

      // Time efficiency
      const totalTime = recipe.prep_time + recipe.cook_time;
      if (context.timeAvailable && totalTime <= context.timeAvailable) {
        const timeEfficiency = 1 - (totalTime / context.timeAvailable);
        score += timeEfficiency * 10;
        if (totalTime <= 30) {
          reasons.push('Quick & easy');
        }
      }

      // High quality
      if (recipe.recipe_scores?.cook_count > 50) {
        score += 10;
        reasons.push('Highly popular');
      }

      return {
        ...recipe,
        recommendationScore: score,
        recommendationReasons: reasons,
      };
    }).sort((a, b) => b.recommendationScore - a.recommendationScore);
  }

  // Select diverse recommendations (different cuisines, difficulties)
  static selectDiverseRecommendations(scoredRecipes, count) {
    const selected = [];
    const usedCuisines = new Set();
    const usedDifficulties = new Set();

    for (const recipe of scoredRecipes) {
      if (selected.length >= count) break;

      // Prefer diversity in first 3 picks
      if (selected.length < 3) {
        if (usedCuisines.has(recipe.cuisine_type) || 
            usedDifficulties.has(recipe.difficulty)) {
          continue;
        }
      }

      selected.push(recipe);
      usedCuisines.add(recipe.cuisine_type);
      usedDifficulties.add(recipe.difficulty);
    }

    // Fill remaining slots if needed
    while (selected.length < count && scoredRecipes.length > selected.length) {
      const remaining = scoredRecipes.filter(r => !selected.includes(r));
      if (remaining.length > 0) {
        selected.push(remaining[0]);
      } else {
        break;
      }
    }

    return selected;
  }

  // Extract ingredient names from various formats
  static extractIngredientNames(ingredients) {
    if (!ingredients) return [];
    
    return ingredients.map(ing => {
      if (typeof ing === 'string') {
        return ing.toLowerCase().trim();
      }
      return (ing.name || ing.ingredient || '').toLowerCase().trim();
    }).filter(Boolean);
  }

  // Analyze user behavior patterns
  static analyzeUserBehavior(interactions) {
    if (!interactions || interactions.length === 0) {
      return { preferredDifficulty: null, preferredCuisines: [] };
    }

    // Count difficulty preferences from cooked recipes
    const difficultyCounts = {};
    const cuisineCounts = {};

    interactions
      .filter(i => i.interaction_type === 'cook')
      .forEach(interaction => {
        // This would need recipe data joined - simplified for now
        // In production, join with recipes table
      });

    return {
      preferredDifficulty: Object.keys(difficultyCounts)[0] || null,
      preferredCuisines: Object.keys(cuisineCounts).slice(0, 3),
    };
  }

  // Cache recommendation
  static async cacheRecommendation(userId, type, recipeIds, context, ttl) {
    try {
      const expiresAt = new Date(Date.now() + ttl * 1000);
      
      await supabase
        .from('recommendation_cache')
        .upsert({
          user_id: userId,
          recommendation_type: type,
          recipe_ids: recipeIds,
          context,
          expires_at: expiresAt.toISOString(),
        }, {
          onConflict: 'user_id,recommendation_type,context'
        });
    } catch (error) {
      console.error('Error caching recommendation:', error);
    }
  }

  // Get cached recommendation
  static async getCachedRecommendation(userId, type, context) {
    try {
      const { data } = await supabase
        .from('recommendation_cache')
        .select('*')
        .eq('user_id', userId)
        .eq('recommendation_type', type)
        .eq('context', context)
        .gt('expires_at', new Date().toISOString())
        .single();

      return data;
    } catch (error) {
      return null;
    }
  }

  // Enrich recipe IDs with full recipe data
  static async enrichRecipesWithScores(recipeIds) {
    try {
      const { data } = await supabase
        .from('recipes')
        .select(`
          id, title, description, cuisine_type, difficulty,
          prep_time, cook_time, servings, ingredients, dietary_tags,
          recipe_scores(popularity_score, quality_score, cook_count)
        `)
        .in('id', recipeIds);

      return data || [];
    } catch (error) {
      console.error('Error enriching recipes:', error);
      return [];
    }
  }

  // Fallback recommendations
  static async getFallbackRecommendations(userId, limit) {
    try {
      const { data } = await supabase
        .from('recipes')
        .select(`
          id, title, description, cuisine_type, difficulty,
          prep_time, cook_time, servings, ingredients, dietary_tags,
          recipe_scores(popularity_score, cook_count)
        `)
        .order('popularity_score', { foreignTable: 'recipe_scores', ascending: false })
        .limit(limit);

      return data || [];
    } catch (error) {
      console.error('Error getting fallback recommendations:', error);
      return [];
    }
  }

  // Get recipes by type (for meal planning)
  static async getRecipesByType(type, maxTime, servings, userPrefs) {
    // This is a simplified version - in production, you'd have a recipe_type field
    // For now, use cuisine and other attributes as proxies
    try {
      let query = supabase
        .from('recipes')
        .select(`
          id, title, description, cuisine_type, difficulty,
          prep_time, cook_time, servings, ingredients, dietary_tags,
          recipe_scores(popularity_score, quality_score)
        `)
        .lte('cook_time', maxTime);

      if (userPrefs?.dietary_restrictions?.length > 0) {
        query = query.contains('dietary_tags', userPrefs.dietary_restrictions);
      }

      query = query
        .order('popularity_score', { foreignTable: 'recipe_scores', ascending: false })
        .limit(10);

      const { data } = await query;
      return data || [];
    } catch (error) {
      console.error('Error getting recipes by type:', error);
      return [];
    }
  }

  // Get complementary recipe for meal planning
  static async getComplementaryRecipe(mainRecipe, type, maxTime, servings, userPrefs) {
    try {
      let query = supabase
        .from('recipes')
        .select(`
          id, title, description, cuisine_type, difficulty,
          prep_time, cook_time, servings, ingredients, dietary_tags,
          recipe_scores(popularity_score, quality_score)
        `)
        .lte('cook_time', maxTime)
        .neq('id', mainRecipe.id); // Don't include the main recipe

      // Try to match cuisine for cohesive meal
      if (mainRecipe.cuisine_type) {
        query = query.eq('cuisine_type', mainRecipe.cuisine_type);
      }

      if (userPrefs?.dietary_restrictions?.length > 0) {
        query = query.contains('dietary_tags', userPrefs.dietary_restrictions);
      }

      query = query
        .order('popularity_score', { foreignTable: 'recipe_scores', ascending: false })
        .limit(5);

      const { data } = await query;
      return data || [];
    } catch (error) {
      console.error('Error getting complementary recipe:', error);
      return [];
    }
  }

  /**
   * ==========================================
   * HYBRID RECOMMENDATION METHODS (NEW)
   * ==========================================
   * Blend internal and external recipes
   */

  /**
   * Get hybrid trending recipes (internal + web)
   */
  static async getHybridTrendingRecipes(limit = 12, options = {}) {
    try {
      const { internal_ratio = 60, external_ratio = 40 } = options;

      // Get internal trending
      const internalTrending = await this.getTrendingRecipes(
        Math.ceil((limit * internal_ratio) / 100)
      );

      // Get external trending from FireCrawl (via API)
      const externalTrending = await this.getWebRecipesByCategory('trending recipes', {
        limit: Math.ceil((limit * external_ratio) / 100),
      });

      // Blend and return
      return this.blendRecipesForDisplay(
        internalTrending,
        externalTrending,
        { internal_ratio, external_ratio }
      );

    } catch (error) {
      console.error('Error getting hybrid trending recipes:', error);
      // Fallback to internal only
      return this.getTrendingRecipes(limit);
    }
  }

  /**
   * Get hybrid popular recipes (internal + web)
   */
  static async getHybridPopularRecipes(limit = 12, options = {}) {
    try {
      const { internal_ratio = 60, external_ratio = 40 } = options;

      // Get internal popular
      const internalPopular = await this.getPopularRecipes(
        Math.ceil((limit * internal_ratio) / 100)
      );

      // Get external popular
      const externalPopular = await this.getWebRecipesByCategory('popular recipes', {
        limit: Math.ceil((limit * external_ratio) / 100),
      });

      // Blend and return
      return this.blendRecipesForDisplay(
        internalPopular,
        externalPopular,
        { internal_ratio, external_ratio }
      );

    } catch (error) {
      console.error('Error getting hybrid popular recipes:', error);
      return this.getPopularRecipes(limit);
    }
  }

  /**
   * Get web recipes by category
   */
  static async getWebRecipesByCategory(category, options = {}) {
    try {
      const { limit = 6 } = options;

      // Query external_recipes table
      let query = supabase
        .from('external_recipes')
        .select('*')
        .eq('is_verified', true)
        .gt('expires_at', new Date().toISOString())
        .order('rating', { ascending: false })
        .limit(limit);

      // Add category-based filters
      if (category.includes('trending')) {
        query = query.order('last_scraped_at', { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(recipe => ({
        id: recipe.id,
        title: recipe.title,
        description: recipe.description,
        cuisine_type: recipe.cuisine_type,
        difficulty: recipe.difficulty,
        prep_time: recipe.prep_time,
        cook_time: recipe.cook_time,
        servings: recipe.servings,
        ingredients: recipe.ingredients,
        dietary_tags: recipe.dietary_tags,
        source_url: recipe.source_url,
        source_domain: recipe.source_domain,
        image: recipe.image_url,
        isExternal: true,
      }));

    } catch (error) {
      console.error('Error getting web recipes by category:', error);
      return [];
    }
  }

  /**
   * Blend internal and external recipes for display
   */
  static blendRecipesForDisplay(internal = [], external = [], ratio = {}) {
    try {
      const { internal_ratio = 60, external_ratio = 40 } = ratio;
      const blended = [];

      // Calculate positions
      const totalSlots = Math.max(internal.length, external.length);
      let inIdx = 0;
      let exIdx = 0;

      // Interleave: mostly internal with external sprinkled in
      for (let i = 0; i < totalSlots * 2; i++) {
        if (blended.length >= 12) break;

        // Calculate if we should add internal or external
        const progress = i / (totalSlots * 2);
        const shouldBeInternal = Math.random() < (internal_ratio / 100);

        if (shouldBeInternal && inIdx < internal.length) {
          blended.push({
            ...internal[inIdx],
            source: 'internal',
            isExternal: false,
          });
          inIdx++;
        } else if (exIdx < external.length) {
          blended.push({
            ...external[exIdx],
            source: 'external',
            isExternal: true,
          });
          exIdx++;
        } else if (inIdx < internal.length) {
          blended.push({
            ...internal[inIdx],
            source: 'internal',
            isExternal: false,
          });
          inIdx++;
        }
      }

      return blended.slice(0, 12);

    } catch (error) {
      console.error('Error blending recipes:', error);
      return internal;
    }
  }

  /**
   * Cache hybrid recommendations
   */
  static async cacheHybridRecommendations(
    userId,
    recommendationType,
    internalIds = [],
    externalIds = [],
    ratio = {}
  ) {
    try {
      const { error } = await supabase
        .from('hybrid_recommendation_cache')
        .insert({
          user_id: userId,
          recommendation_type: recommendationType,
          internal_recipe_ids: internalIds,
          external_recipe_ids: externalIds,
          blend_ratio: ratio,
          expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error caching hybrid recommendations:', error);
    }
  }

  /**
   * Get cached hybrid recommendations
   */
  static async getCachedHybridRecommendations(userId, recommendationType) {
    try {
      const { data, error } = await supabase
        .from('hybrid_recommendation_cache')
        .select('*')
        .eq('user_id', userId)
        .eq('recommendation_type', recommendationType)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // Ignore "no rows" error
      return data;

    } catch (error) {
      console.error('Error getting cached hybrid recommendations:', error);
      return null;
    }
  }

  /**
   * Track external recipe interaction
   */
  static async trackExternalRecipeInteraction(userId, externalRecipeId, interactionType) {
    try {
      const { error } = await supabase
        .from('external_recipe_interactions')
        .insert({
          user_id: userId,
          external_recipe_id: externalRecipeId,
          interaction_type: interactionType,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error tracking external recipe interaction:', error);
    }
  }

}

/**
 * RECIPE NORMALIZATION SERVICE
 * ============================
 * Transforms recipes from different sources into standard format
 * Handles deduplication, validation, and enrichment
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export class RecipeNormalizationService {

  /**
   * Check if recipe already exists (deduplication)
   */
  static async isRecipeDuplicate(sourceUrl) {
    try {
      const { data, error } = await supabase
        .from('external_recipes')
        .select('id')
        .eq('source_url', sourceUrl)
        .single();

      if (error && error.code !== 'PGRST116') { // Not "no rows" error
        throw error;
      }

      return !!data;

    } catch (error) {
      console.error('[Normalization] Duplicate check error:', error);
      return false;
    }
  }

  /**
   * Normalize ingredient list
   */
  static normalizeIngredients(ingredients) {
    if (!Array.isArray(ingredients)) {
      return [];
    }

    return ingredients
      .filter(ing => ing && typeof ing === 'string' && ing.trim().length > 0)
      .map(ing => {
        // Clean up common issues
        return ing
          .trim()
          .replace(/^\d+[\s\.]*/, '') // Remove leading numbers
          .replace(/\s{2,}/g, ' ') // Remove extra spaces
          .toLowerCase();
      })
      .filter((ing, idx, arr) => arr.indexOf(ing) === idx); // Remove duplicates
  }

  /**
   * Normalize instructions
   */
  static normalizeInstructions(instructions) {
    if (!Array.isArray(instructions)) {
      return [];
    }

    return instructions
      .filter(inst => inst && typeof inst === 'string' && inst.trim().length > 0)
      .map((inst, idx) => ({
        stepNumber: idx + 1,
        instruction: inst.trim(),
      }));
  }

  /**
   * Extract cuisine type from title/description
   */
  static extractCuisine(recipe) {
    const cuisines = [
      'italian', 'mexican', 'chinese', 'indian', 'japanese', 'thai', 'french',
      'spanish', 'greek', 'american', 'vietnamese', 'korean', 'mediterranean',
      'middle eastern', 'german', 'british', 'asian', 'latin', 'caribbean',
    ];

    const content = `${recipe.title} ${recipe.description || ''}`.toLowerCase();

    for (const cuisine of cuisines) {
      if (content.includes(cuisine)) {
        return cuisine;
      }
    }

    return 'international';
  }

  /**
   * Extract dietary tags
   */
  static extractDietaryTags(recipe) {
    const tags = [];
    const content = JSON.stringify(recipe).toLowerCase();

    const tagPatterns = {
      'vegetarian': [/vegetarian/, /no meat/i, /meat-free/i],
      'vegan': [/vegan/, /plant-based/i, /plant-based/i],
      'gluten-free': [/gluten[- ]?free/i, /gf\b/, /no gluten/i],
      'dairy-free': [/dairy[- ]?free/i, /lactose[- ]?free/i],
      'keto': [/keto/, /ketogenic/, /low[- ]?carb/i],
      'paleo': [/paleo/, /paleolithic/],
      'low-sodium': [/low[- ]?sodium/i, /low salt/i],
      'low-fat': [/low[- ]?fat/i],
      'high-protein': [/high[- ]?protein/i, /protein-rich/i],
    };

    for (const [tag, patterns] of Object.entries(tagPatterns)) {
      if (patterns.some(pattern => pattern.test(content))) {
        tags.push(tag);
      }
    }

    return tags;
  }

  /**
   * Validate cooking times
   */
  static validateTimes(recipe) {
    const prepTime = Math.max(0, parseInt(recipe.prep_time) || 0);
    const cookTime = Math.max(0, parseInt(recipe.cook_time) || 0);
    const servings = Math.max(1, parseInt(recipe.servings) || 2);

    return {
      prep_time: prepTime,
      cook_time: cookTime,
      total_time: prepTime + cookTime,
      servings,
    };
  }

  /**
   * Validate and clean rating
   */
  static validateRating(recipe) {
    let rating = null;
    let ratingCount = 0;

    if (recipe.rating) {
      const parsed = parseFloat(recipe.rating);
      if (parsed >= 0 && parsed <= 5) {
        rating = parsed;
      }
    }

    if (recipe.rating_count) {
      const parsed = parseInt(recipe.rating_count);
      if (parsed > 0) {
        ratingCount = parsed;
      }
    }

    return { rating, rating_count: ratingCount };
  }

  /**
   * Complete normalization pipeline
   */
  static async normalizeRecipe(rawRecipe) {
    try {
      // Check for duplicates
      if (rawRecipe.source_url) {
        const isDuplicate = await this.isRecipeDuplicate(rawRecipe.source_url);
        if (isDuplicate) {
          return null; // Skip duplicates
        }
      }

      // Time validation
      const times = this.validateTimes(rawRecipe);

      // Rating validation
      const { rating, rating_count } = this.validateRating(rawRecipe);

      // Ingredient normalization
      const ingredients = this.normalizeIngredients(rawRecipe.ingredients);

      // Instruction normalization
      const instructions = this.normalizeInstructions(rawRecipe.instructions);

      // Cuisine extraction
      const cuisine_type = this.extractCuisine(rawRecipe);

      // Dietary tags
      const dietary_tags = this.extractDietaryTags(rawRecipe);

      // Generate content hash
      const content_hash = this.generateContentHash(
        `${rawRecipe.title}${rawRecipe.source_url}`
      );

      return {
        id: rawRecipe.id,
        source_url: rawRecipe.source_url,
        source_domain: new URL(rawRecipe.source_url).hostname,
        title: (rawRecipe.title || 'Untitled Recipe').slice(0, 255),
        description: (rawRecipe.description || '').slice(0, 500),
        image_url: rawRecipe.image_url || null,
        ingredients,
        instructions,
        prep_time: times.prep_time,
        cook_time: times.cook_time,
        servings: times.servings,
        difficulty: rawRecipe.difficulty || 'medium',
        cuisine_type,
        dietary_tags,
        rating,
        rating_count,
        content_hash,
        is_verified: false,
        last_scraped_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

    } catch (error) {
      console.error('[Normalization] Pipeline error:', error);
      return null;
    }
  }

  /**
   * Normalize batch of recipes
   */
  static async normalizeRecipes(rawRecipes) {
    const normalized = [];

    for (const recipe of rawRecipes) {
      const normalized_recipe = await this.normalizeRecipe(recipe);
      if (normalized_recipe) {
        normalized.push(normalized_recipe);
      }
    }

    return normalized;
  }

  /**
   * Generate content hash for deduplication
   */
  static generateContentHash(content) {
    return crypto
      .createHash('sha256')
      .update(content)
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * Blend internal and external recipes
   */
  static blendRecipes(internalRecipes = [], externalRecipes = [], ratio = { internal: 60, external: 40 }) {
    try {
      // Calculate how many of each to include
      const total = internalRecipes.length + externalRecipes.length;
      if (total === 0) return [];

      const internalCount = Math.ceil((total * ratio.internal) / 100);
      const externalCount = Math.ceil((total * ratio.external) / 100);

      // Interleave recipes for variety
      const blended = [];
      let inIdx = 0;
      let exIdx = 0;

      // Alternate between sources
      while (blended.length < Math.min(internalCount + externalCount, 12)) {
        if (inIdx < internalRecipes.length && blended.length < internalCount * 2) {
          blended.push({
            ...internalRecipes[inIdx],
            source: 'internal',
            isExternal: false,
          });
          inIdx++;
        }

        if (exIdx < externalRecipes.length && blended.length < externalCount * 2) {
          blended.push({
            ...externalRecipes[exIdx],
            source: 'external',
            isExternal: true,
          });
          exIdx++;
        }
      }

      return blended;

    } catch (error) {
      console.error('[Normalization] Blend error:', error);
      return [...internalRecipes, ...externalRecipes];
    }
  }

  /**
   * Enrich recipe with additional metadata
   */
  static enrichRecipe(recipe) {
    return {
      ...recipe,
      totalTime: (recipe.prep_time || 0) + (recipe.cook_time || 0),
      difficulty: recipe.difficulty || 'medium',
      sourceLabel: recipe.isExternal 
        ? `View on ${new URL(recipe.source_url).hostname}` 
        : 'Your Recipe',
      displayTitle: recipe.title || 'Untitled Recipe',
      displayImage: recipe.image_url || `/recipe-placeholder.svg`,
      tags: {
        dietary: recipe.dietary_tags || [],
        cuisine: [recipe.cuisine_type || 'International'],
        time: this.getTimeLabel((recipe.prep_time || 0) + (recipe.cook_time || 0)),
      },
    };
  }

  /**
   * Get human-readable time label
   */
  static getTimeLabel(minutes) {
    if (minutes < 20) return '15-20 mins';
    if (minutes < 40) return '20-40 mins';
    if (minutes < 60) return '40-60 mins';
    if (minutes < 120) return '1-2 hours';
    return '2+ hours';
  }
}

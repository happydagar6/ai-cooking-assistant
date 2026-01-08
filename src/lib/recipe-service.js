import { OpenAIService } from "./openai";
import { supabase } from "./supabase";
import { createClient } from '@supabase/supabase-js';
import { ImageOptimizationService } from "./image-optimization-service";
import { ImageStorageService } from "./image-storage-service";

export class RecipeService {
  static async generateRecipes(query, userId = null) {
    try {
      // Get user preferences if logged in
      let userPreferences = {};
      if (userId) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("dietary_preferences, cooking_skill_level")
          .eq("id", userId)
          .single();

        if (profile) {
          userPreferences = {
            dietary: profile.dietary_preferences?.join(", "),
            skill: profile.cooking_skill_level,
          };
        }
      }

      // Generate new recipes using OpenAI
      const result = await OpenAIService.generateRecipe(query, userPreferences);

      // Add temporary IDs for generated recipes (for frontend reference)
      const recipesWithTempIds = result.recipes.map((recipe, index) => ({
        ...recipe,
        id: `temp-${Date.now()}-${index}`,
        is_generated: true // Flag to identify generated (unsaved) recipes
      }));

      return recipesWithTempIds;
    } catch (error) {
      console.error("Recipe generation error:", error);
      throw error;
    }
  }

  // Save recipe to the database
  static async saveRecipe(recipeData, userId) {
    try {
      if (!userId) {
        throw new Error("User ID is required to save recipes");
      }

      // Filter out any fields that might not exist in the database
      const validRecipeData = {
        title: recipeData.title,
        description: recipeData.description,
        prep_time: recipeData.prep_time || 0,
        cook_time: recipeData.cook_time || 0,
        total_time: (recipeData.prep_time || 0) + (recipeData.cook_time || 0),
        servings: recipeData.servings || 1,
        difficulty: recipeData.difficulty || 'easy',
        cuisine_type: recipeData.cuisine_type || 'Various',
        dietary_tags: recipeData.dietary_tags || [],
        ingredients: recipeData.ingredients || [],
        instructions: recipeData.instructions || [],
        is_public: recipeData.is_public || false,
        created_by: userId,
      };

      // Insert recipe into recipes table
      const { data: recipe, error: recipeError } = await supabase
        .from("recipes")
        .insert(validRecipeData)
        .select()
        .single();

      if (recipeError) throw recipeError;

      // Create corresponding entry in user_recipes table to link user to recipe
      const { error: userRecipeError } = await supabase
        .from("user_recipes")
        .insert({
          user_id: userId,
          recipe_id: recipe.id,
          is_favorite: false,
          cook_count: 0,
          saved_at: new Date().toISOString()
        });

      if (userRecipeError) {
        console.error("Error creating user_recipes entry:", userRecipeError);
        // Don't throw here - recipe is saved, just log the issue
      }

      return recipe;
    } catch (error) {
      console.error("Error saving recipe:", error);
      throw error;
    }
  }

  // Save recipe with authenticated Supabase client (for RLS policies)
  // Enhanced with image optimization and async handling
  static async saveRecipeWithAuth(recipeData, userId, authenticatedSupabase) {
    try {
      if (!userId) {
        throw new Error("User ID is required to save recipes");
      }

      if (!authenticatedSupabase) {
        throw new Error("Authenticated Supabase client is required");
      }

      console.log('[RecipeService] Saving recipe:', recipeData.title);

      // Filter out any fields that might not exist in the database
      const validRecipeData = {
        title: recipeData.title,
        description: recipeData.description,
        prep_time: recipeData.prep_time || 0,
        cook_time: recipeData.cook_time || 0,
        total_time: (recipeData.prep_time || 0) + (recipeData.cook_time || 0),
        servings: recipeData.servings || 1,
        difficulty: recipeData.difficulty || 'easy',
        cuisine_type: recipeData.cuisine_type || 'Various',
        dietary_tags: recipeData.dietary_tags || [],
        image_url: recipeData.image_url || null,
        image_storage_path: null, // Will be populated by async optimization
        image_width: null,
        image_height: null,
        image_blurhash: null,
        ingredients: recipeData.ingredients || [],
        instructions: recipeData.instructions || [],
        nutrition: recipeData.nutrition || null,
        created_by: userId,
        is_public: recipeData.is_public || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Insert recipe into recipes table
      const { data: recipe, error: recipeError } = await authenticatedSupabase
        .from("recipes")
        .insert(validRecipeData)
        .select()
        .single();

      if (recipeError) {
        console.error('[RecipeService] Supabase insert error:', recipeError);
        throw recipeError;
      }

      console.log('[RecipeService] Recipe created with ID:', recipe.id);

      // Create corresponding entry in user_recipes table to link user to recipe
      const userRecipeData = {
        user_id: userId,
        recipe_id: recipe.id,
        is_favorite: false,
        personal_notes: null,
        rating: null,
        cook_count: 0,
        last_cooked: null,
        saved_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error: userRecipeError } = await authenticatedSupabase
        .from("user_recipes")
        .insert(userRecipeData);

      if (userRecipeError) {
        console.error("[RecipeService] Error creating user_recipes entry:", userRecipeError);
      }

      // IMPORTANT: Return recipe immediately (don't wait for image optimization)
      // Image optimization happens asynchronously in the background
      // This ensures fast response to the user
      if (recipe.image_url) {
        RecipeService.optimizeRecipeImageAsync(recipe.id, recipe.image_url, userId);
      }

      return recipe;

    } catch (error) {
      console.error("Error saving recipe with auth:", error);
      
      // Handle database unique constraint violations
      if (error.code === '23505') { // PostgreSQL unique violation
        if (error.message.includes('unique_recipe_per_user')) {
          throw new Error(`Recipe "${recipeData.title}" already exists. Please choose a different title.`);
        }
        if (error.message.includes('user_recipes_user_id_recipe_id_key') || 
            error.message.includes('unique_user_recipe')) {
          throw new Error('Recipe is already saved to your collection.');
        }
      }
      
      throw error;
    }
  }

  /**
   * Async image optimization for recipes
   * Runs in the background without blocking the main response
   * Only for internal recipes (external recipes stream from source)
   */
  static async optimizeRecipeImageAsync(recipeId, imageUrl, userId) {
    try {
      // Don't await - fire and forget
      setTimeout(async () => {
        await RecipeService.optimizeAndStoreRecipeImage(recipeId, imageUrl, userId);
      }, 100);
    } catch (error) {
      console.error('[RecipeService] Image optimization scheduling error:', error);
      // Non-critical, don't throw
    }
  }

  /**
   * Download, optimize, and store recipe image
   * Handles retry logic and fallback
   */
  static async optimizeAndStoreRecipeImage(recipeId, imageUrl, userId) {
    let attempt = 0;
    const maxAttempts = 3;

    while (attempt < maxAttempts) {
      try {
        console.log(`[RecipeService] Optimizing image for recipe ${recipeId} (attempt ${attempt + 1})`);

        // Step 1: Validate image URL
        const isValid = await ImageOptimizationService.validateImageUrl(imageUrl);
        if (!isValid) {
          console.warn('[RecipeService] Image URL is not accessible:', imageUrl);
          return;
        }

        // Step 2: Download and validate image
        const imageData = await ImageOptimizationService.optimizeImageFromUrl(imageUrl);
        
        console.log('[RecipeService] Image downloaded:', {
          size: ImageOptimizationService.formatFileSize(imageData.size),
          type: imageData.contentType,
          hash: imageData.fileHash.substring(0, 12) + '...'
        });

        // Step 3: Upload to Supabase Storage
        const storagePath = `internal/${userId}/${recipeId}/${imageData.fileName}`;
        const uploadResult = await ImageStorageService.uploadRecipeImage(
          imageData.buffer,
          recipeId,
          imageData.fileName,
          { contentType: imageData.contentType, storeType: 'internal' }
        );

        console.log('[RecipeService] Image uploaded to storage:', uploadResult.path);

        // Step 4: Save image metadata to database
        const metadata = await ImageStorageService.saveImageMetadata({
          sourceUrl: imageUrl,
          storagePath: uploadResult.path,
          format: 'jpeg',
          originalSize: imageData.size,
          optimizedSize: imageData.size,
          width: 400, // Standard width (would need sharp library for actual dimensions)
          height: 300, // Standard height
          fileHash: imageData.fileHash,
          recipeId,
          recipeType: 'internal'
        });

        console.log('[RecipeService] Image metadata saved');

        // Step 5: Update recipe with storage path
        const { error: updateError } = await supabase
          .from('recipes')
          .update({
            image_storage_path: uploadResult.path,
            image_width: 400,
            image_height: 300,
            updated_at: new Date().toISOString()
          })
          .eq('id', recipeId);

        if (updateError) {
          console.error('[RecipeService] Error updating recipe with storage path:', updateError);
          return;
        }

        console.log('[RecipeService] Recipe updated with optimized image path');
        return; // Success, exit retry loop

      } catch (error) {
        attempt++;
        console.warn(`[RecipeService] Image optimization error (attempt ${attempt}):`, error.message);

        if (attempt >= maxAttempts) {
          console.error('[RecipeService] Image optimization failed after', maxAttempts, 'attempts');
          // Non-critical, don't throw - recipe is already saved
          return;
        }

        // Exponential backoff before retry
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  /**
   * Validate and clean image URL before saving
   */
  static async validateRecipeImageUrl(imageUrl) {
    try {
      if (!imageUrl) return null;

      const isValid = await ImageOptimizationService.validateImageUrl(imageUrl);
      return isValid ? imageUrl : null;

    } catch (error) {
      console.error('[RecipeService] Image URL validation error:', error);
      return null;
    }
  }

  static async getUserRecipes(userId, options = {}) {
    try {
      let query = supabase
        .from("user_recipes")
        .select(
          `id, is_favorite, personal_notes, rating, cook_count, last_cooked,
                saved_at, recipes(id, title, description, prep_time, cook_time, servings,
                difficulty, cuisine_type, dietary_tags, image_url, ingredients,
                instructions)`
        )
        .eq("user_id", userId);

      if (options.favorites_only) {
        query = query.eq("is_favorite", true);
      }
      if (options.search) {
        query = query.ilike("recipes.title", `%${options.search}%`);
      }
      const { data, error } = await query;
      if (error) throw error;

      return data.map((item) => ({
        ...item.recipes,
        user_recipe_data: {
          id: item.id,
          is_favorite: item.is_favorite,
          personal_notes: item.personal_notes,
          rating: item.rating,
          cook_count: item.cook_count,
          last_cooked: item.last_cooked,
          saved_at: item.saved_at,
        },
      }));
    } catch (error) {
      console.error("Get user recipes error:", error);
      throw error;
    }
  }

  static async updateUserRecipe(userId, recipeId, metadata = {}) {
    try {
      const { data, error } = await supabase.from("user_recipes").upsert({
        user_id: userId,
        recipe_id: recipeId,
        ...metadata,
      });
    } catch (error) {
      console.error("Save user recipe error:", error);
      throw error;
    }
  }

  static async removeUserRecipe(userId, recipeId) {
    try {
      const { error } = await supabase
        .from("user_recipes")
        .delete()
        .eq("user_id", userId)
        .eq("recipe_id", recipeId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Remove user recipe error:", error);
      throw error;
    }
  }

  static async getRecipeById(recipeId, userId = null) {
    try {
        
        // Use service role client for admin access to bypass RLS
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );
        
        // First, fetch the recipe with admin client to bypass RLS
        const { data: recipe, error: recipeError } = await supabaseAdmin
            .from("recipes")
            .select("*")
            .eq("id", recipeId)
            .single();
            
        if (recipeError) {
            
            if (recipeError.code === 'PGRST116') {
                throw new Error("Recipe not found in database");
            }
            throw new Error(`Database error: ${recipeError.message}`);
        }
        
        if (!recipe) {
            throw new Error("Recipe not found");
        }
        
        // Ensure user_recipes entry exists for ANY user accessing this recipe
        // This allows users to cook recommended/shared recipes
        if (userId) {
            const { data: existingLink, error: linkError } = await supabaseAdmin
                .from("user_recipes")
                .select("recipe_id")
                .eq("user_id", userId)
                .eq("recipe_id", recipeId);
                
            if (!linkError && (!existingLink || existingLink.length === 0)) {
                // Create user_recipes entry for any recipe the user wants to cook
                const { error: insertError } = await supabaseAdmin
                    .from("user_recipes")
                    .insert({
                        user_id: userId,
                        recipe_id: recipeId,
                        is_favorite: false,
                        cook_count: 0,
                        saved_at: new Date().toISOString()
                    })
                    .select();
                
                if (insertError && insertError.code !== '23505') { // 23505 is unique constraint violation
                    console.warn(`Could not create user_recipes entry: ${insertError.message}`);
                    // Continue anyway - recipe is still accessible
                }
            }
        }

        // Get user specific data if logged in
        let userRecipeData = null;
        if (userId) {
            const { data, error } = await supabaseAdmin
                .from("user_recipes")
                .select("*")
                .eq("user_id", userId)
                .eq("recipe_id", recipeId);
            
            if (!error && data && data.length > 0) {
                userRecipeData = data[0];
            }
        }
        
        return {
            ...recipe,
            user_recipe_data: userRecipeData,
        };
    } catch (error) {
        throw error;
    }
  }

  static async updateRecipe(recipeId, updates, userId){
    try {
        const { data, error } = await supabase
        .from("recipes")
        .eq("created_by", userId)
        .update(updates)
        .eq("id", recipeId)
        .select()
        .single();

        if(error) throw error;
        return data;
    } catch (error) {
        console.error("Update recipe error:", error);
        throw error;
    }
  }

  static async deleteRecipe(recipeId, userId){
    try {
        const { error } = await supabase
        .from("recipes")
        .delete()
        .eq("id", recipeId)
        .eq("created_by", userId);

        if(error) throw error;
        return true;
    } catch (error) {
        console.error("Delete recipe error:", error);
        throw error;
    }
  }

  static async searchPublicRecipes(options = {}){
    try {
        let query = supabase
        .from("recipes")
        .select("*");

        // If filtering by creator, don't filter by is_public
        if (options.created_by) {
            query = query.eq("created_by", options.created_by);
        } else {
            query = query.eq("is_public", true);
        }

        if(options.search){
            query = query.or(`title.ilike.%${options.search}%, description.ilike.%${options.search}%`);
        }

        if(options.cuisine){
            query = query.eq("cuisine_type", options.cuisine);
        }

        if(options.difficulty){
            query = query.eq("difficulty", options.difficulty);
        }

        if(options.max_time){
            query = query.lte("cook_time", options.max_time);
        }

        const { data, error } = await query.limit(options.limit || 20);
        if(error) throw error;
        return data;
    } catch (error) {
        console.error("Search recipes error:", error);
        throw error;
    }
  }

  // Utility method to fix missing user_recipes entries for existing recipes
  static async fixMissingUserRecipeLinks(userId) {
    try {
      // Get all recipes created by this user
      const { data: userCreatedRecipes, error: recipesError } = await supabase
        .from("recipes")
        .select("id, title")
        .eq("created_by", userId);
      
      if (recipesError) throw recipesError;
      
      if (!userCreatedRecipes || userCreatedRecipes.length === 0) {
        return { fixed: 0, total: 0 };
      }
      
      // Get existing user_recipes entries
      const { data: existingLinks, error: linksError } = await supabase
        .from("user_recipes")
        .select("recipe_id")
        .eq("user_id", userId);
      
      if (linksError) throw linksError;
      
      const existingRecipeIds = new Set(existingLinks?.map(link => link.recipe_id) || []);
      
      // Find recipes missing user_recipes entries
      const missingLinks = userCreatedRecipes.filter(recipe => !existingRecipeIds.has(recipe.id));
      
      if (missingLinks.length === 0) {
        return { fixed: 0, total: userCreatedRecipes.length };
      }
      // Create missing user_recipes entries
      const linksToCreate = missingLinks.map(recipe => ({
        user_id: userId,
        recipe_id: recipe.id,
        is_favorite: false,
        cook_count: 0,
        saved_at: new Date().toISOString()
      }));
      
      const { error: insertError } = await supabase
        .from("user_recipes")
        .insert(linksToCreate);
      
      if (insertError) {
        console.error("Error creating missing user_recipes entries:", insertError);
        throw insertError;
      }
      
      return { 
        fixed: missingLinks.length, 
        total: userCreatedRecipes.length,
        fixedRecipes: missingLinks.map(r => r.title)
      };
      
    } catch (error) {
      console.error("Error fixing missing user recipe links:", error);
      throw error;
    }
  }
}

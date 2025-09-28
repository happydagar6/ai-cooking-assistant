import { OpenAIService } from "./openai";
import { supabase } from "./supabase";
import { createClient } from '@supabase/supabase-js';

export class RecipeService {
  static async generateRecipes(query, userId = null) {
    try {
      console.log('Generating fresh recipes for query:', query);

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

      console.log(`Recipe saved successfully: ${recipe.title} (ID: ${recipe.id}) for user: ${userId}`);
      return recipe;
    } catch (error) {
      console.error("Error saving recipe:", error);
      throw error;
    }
  }

  // Save recipe with authenticated Supabase client (for RLS policies)
  static async saveRecipeWithAuth(recipeData, userId, authenticatedSupabase) {
    try {
      if (!userId) {
        throw new Error("User ID is required to save recipes");
      }

      if (!authenticatedSupabase) {
        throw new Error("Authenticated Supabase client is required");
      }

      // Let the database handle duplicates with unique constraints
      // No need for explicit checking - the constraint will prevent duplicates

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
        ingredients: recipeData.ingredients || [],
        instructions: recipeData.instructions || [],
        nutrition: recipeData.nutrition || null,
        created_by: userId,
        is_public: recipeData.is_public || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('Inserting recipe with authenticated client:', validRecipeData);

      // Insert recipe into recipes table
      const { data: recipe, error: recipeError } = await authenticatedSupabase
        .from("recipes")
        .insert(validRecipeData)
        .select()
        .single();

      if (recipeError) {
        console.error('Supabase insert error:', recipeError);
        throw recipeError;
      }
      
      console.log('Recipe inserted successfully:', recipe);

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

      console.log('Inserting user_recipe data:', userRecipeData);

      const { error: userRecipeError } = await authenticatedSupabase
        .from("user_recipes")
        .insert(userRecipeData);

      if (userRecipeError) {
        console.error("Error creating user_recipes entry:", userRecipeError);
        // Don't throw here - recipe is saved, just log the issue
      } else {
        console.log(`User-recipe link created for recipe: ${recipe.id} and user: ${userId}`);
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
        
        // Check user access if userId is provided
        if (userId && recipe.created_by !== userId) {
            // Check if user has access via user_recipes table
            const { data: userRecipeAccess } = await supabaseAdmin
                .from("user_recipes")
                .select("recipe_id")
                .eq("user_id", userId)
                .eq("recipe_id", recipeId)
                .single();
                
            if (!userRecipeAccess) {
                throw new Error("Recipe not found or access denied");
            }
        }
        
        // Ensure user_recipes entry exists for the owner
        if (userId && recipe.created_by === userId) {
            const { data: existingLink } = await supabaseAdmin
                .from("user_recipes")
                .select("recipe_id")
                .eq("user_id", userId)
                .eq("recipe_id", recipeId)
                .single();
                
            if (!existingLink) {
                await supabaseAdmin
                    .from("user_recipes")
                    .insert({
                        user_id: userId,
                        recipe_id: recipeId,
                        is_favorite: false,
                        cook_count: 0,
                        saved_at: recipe.created_at || new Date().toISOString()
                    });
            }
        }

        // Get user specific data if logged in
        let userRecipeData = null;
        if (userId) {
            const { data } = await supabaseAdmin
                .from("user_recipes")
                .select("*")
                .eq("user_id", userId)
                .eq("recipe_id", recipeId)
                .single();
            userRecipeData = data;
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
      console.log(`Fixing missing user_recipes entries for user: ${userId}`);
      
      // Get all recipes created by this user
      const { data: userCreatedRecipes, error: recipesError } = await supabase
        .from("recipes")
        .select("id, title")
        .eq("created_by", userId);
      
      if (recipesError) throw recipesError;
      
      if (!userCreatedRecipes || userCreatedRecipes.length === 0) {
        console.log("No recipes found for user");
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
        console.log("No missing links found");
        return { fixed: 0, total: userCreatedRecipes.length };
      }
      
      console.log(`Found ${missingLinks.length} recipes missing user_recipes entries`);
      
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
      
      console.log(`Successfully created ${missingLinks.length} missing user_recipes entries`);
      
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

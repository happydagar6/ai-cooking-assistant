import { OpenAIService } from "./openai";

export class NutritionService {
  static async analyzeRecipeNutrition(recipe) {
    try {
      // Cache key for nutrition analysis
      const cacheKey = `nutrition-${recipe.id || "temp"}-${recipe.servings}`;

      // Check cache first (in real app, use Redis or database)
      const cached = this.getCachedNutrition(cacheKey);
      if (cached) {
        return cached;
      }

      // Format ingredients for better AI analysis
      const ingredientsText = this.formatIngredientsForAnalysis(
        recipe.ingredients
      );

      const systemPrompt = `You are a professional nutritionist and food scientist. Analyze the given recipe and provide accurate nutritional information. Be precise with calculations based on standard USDA nutritional databases.

Format your response as a valid JSON object with this exact structure:
{
  "nutrition": {
    "calories": number,
    "protein": number,
    "carbs": number,
    "fat": number,
    "fiber": number,
    "sugar": number,
    "sodium": number,
    "cholesterol": number
  },
  "vitamins": {
    "vitaminA": number,
    "vitaminC": number,
    "vitaminD": number,
    "vitaminE": number,
    "vitaminK": number,
    "thiamine": number,
    "riboflavin": number,
    "niacin": number,
    "vitaminB6": number,
    "folate": number,
    "vitaminB12": number
  },
  "minerals": {
    "calcium": number,
    "iron": number,
    "magnesium": number,
    "phosphorus": number,
    "potassium": number,
    "zinc": number
  },
  "healthScore": number,
  "dietaryTags": ["string"],
  "highlights": ["string"],
  "concerns": ["string"],
  "healthySuggestions": ["string"]
}`;

      const userPrompt = `Analyze this recipe for ${recipe.servings} servings:

Title: ${recipe.title}
Ingredients: ${ingredientsText}
Cooking Method: ${
        recipe.instructions
          ?.slice(0, 3)
          ?.map((i) => i.description)
          ?.join(". ") || "Standard cooking"
      }

Provide nutritional analysis per serving. Include:
- Accurate calorie and macronutrient calculations
- Key vitamin and mineral content (in mg/mcg as appropriate)
- Health score (1-10, considering nutrition density, processing level, balance)
- Dietary classifications (vegan, vegetarian, gluten-free, keto-friendly, etc.)
- 3 nutritional highlights (what makes this healthy)
- Any nutritional concerns (high sodium, sugar, etc.)
- 3 suggestions to make it healthier while maintaining taste`;

      const completion = await OpenAIService.generateStructuredNutrition(
        userPrompt,
        systemPrompt
      );
      const nutritionData = this.parseAndValidateNutrition(completion, recipe);

      // Cache the result
      this.cacheNutrition(cacheKey, nutritionData);

      return nutritionData;
    } catch (error) {
      console.error("Nutrition analysis failed:", error);
      throw new Error("Failed to analyze recipe nutrition");
    }
  }

  static formatIngredientsForAnalysis(ingredients) {
    return ingredients
      .map((ingredient) => {
        if (typeof ingredient === "string") {
          return ingredient;
        }
        return `${ingredient.amount || ""} ${ingredient.unit || ""} ${
          ingredient.name || ""
        }`.trim();
      })
      .join(", ");
  }

  static parseAndValidateNutrition(aiResponse, recipe) {
    try {
      // Parse JSON response from AI
      const parsed = JSON.parse(aiResponse);

      // Validate and set defaults
      return {
        recipeId: recipe.id,
        servings: recipe.servings,
        nutrition: {
          calories: Math.round(parsed.nutrition?.calories || 0),
          protein: Math.round((parsed.nutrition?.protein || 0) * 10) / 10,
          carbs: Math.round((parsed.nutrition?.carbs || 0) * 10) / 10,
          fat: Math.round((parsed.nutrition?.fat || 0) * 10) / 10,
          fiber: Math.round((parsed.nutrition?.fiber || 0) * 10) / 10,
          sugar: Math.round((parsed.nutrition?.sugar || 0) * 10) / 10,
          sodium: Math.round(parsed.nutrition?.sodium || 0),
          cholesterol: Math.round(parsed.nutrition?.cholesterol || 0),
        },
        vitamins: parsed.vitamins || {},
        minerals: parsed.minerals || {},
        healthScore: Math.min(10, Math.max(1, parsed.healthScore || 5)),
        dietaryTags: Array.isArray(parsed.dietaryTags)
          ? parsed.dietaryTags
          : [],
        highlights: Array.isArray(parsed.highlights)
          ? parsed.highlights.slice(0, 5)
          : [],
        concerns: Array.isArray(parsed.concerns)
          ? parsed.concerns.slice(0, 3)
          : [],
        healthySuggestions: Array.isArray(parsed.healthySuggestions)
          ? parsed.healthySuggestions.slice(0, 3)
          : [],
        analyzedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Failed to parse nutrition data:", error);
      // Return fallback nutrition data
      return this.getFallbackNutrition(recipe);
    }
  }

  static getFallbackNutrition(recipe) {
    return {
      recipeId: recipe.id,
      servings: recipe.servings,
      nutrition: {
        calories: 300,
        protein: 15,
        carbs: 30,
        fat: 12,
        fiber: 3,
        sugar: 5,
        sodium: 400,
        cholesterol: 20,
      },
      vitamins: {},
      minerals: {},
      healthScore: 6,
      dietaryTags: [],
      highlights: ["Contains essential nutrients"],
      concerns: ["Nutritional analysis unavailable"],
      healthySuggestions: [
        "Add more vegetables",
        "Reduce sodium",
        "Include lean proteins",
      ],
      analyzedAt: new Date().toISOString(),
      isFallback: true,
    };
  }

  static getCachedNutrition(cacheKey) {
    // In production, use Redis or database caching
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem(`nutrition_${cacheKey}`);
      if (cached) {
        const data = JSON.parse(cached);
        // Cache for 24 hours
        if (
          Date.now() - new Date(data.cachedAt).getTime() <
          24 * 60 * 60 * 1000
        ) {
          return data.nutrition;
        }
      }
    }
    return null;
  }

  static cacheNutrition(cacheKey, nutritionData) {
    if (typeof window !== "undefined") {
      const cacheData = {
        nutrition: nutritionData,
        cachedAt: new Date().toISOString(),
      };
      localStorage.setItem(`nutrition_${cacheKey}`, JSON.stringify(cacheData));
    }
  }

  static parseNutritionData(completion) {
    // Legacy method - kept for backward compatibility
    return {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
      healthScore: 7,
      dietaryTags: [],
      vitamins: {},
      minerals: {},
      highlights: [],
    };
  }
  static async generateHealthySuggestions(recipe) {
    try {
      const prompt = `As a nutritionist, suggest 3 specific ways to make this recipe healthier while maintaining its delicious taste:

Recipe: ${recipe.title}
Current ingredients: ${this.formatIngredientsForAnalysis(recipe.ingredients)}

Focus on:
1. Ingredient substitutions (healthier alternatives)
2. Cooking method improvements
3. Portion or serving suggestions

Format as a JSON array of strings: ["suggestion 1", "suggestion 2", "suggestion 3"]`;

      const response = await OpenAIService.provideCookingTips(prompt);

      try {
        const suggestions = JSON.parse(response);
        return Array.isArray(suggestions) ? suggestions : [response];
      } catch {
        // If JSON parsing fails, return the response as a single suggestion
        return [response];
      }
    } catch (error) {
      console.error("Failed to generate healthy suggestions:", error);
      return [
        "Add more colorful vegetables for extra nutrients",
        "Consider using whole grain alternatives",
        "Reduce sodium by using herbs and spices for flavor",
      ];
    }
  }

  static async calculateMealPlanNutrition(recipes) {
    try {
      const nutritionPromises = recipes.map((recipe) =>
        this.analyzeRecipeNutrition(recipe)
      );
      const nutritionData = await Promise.all(nutritionPromises);

      return this.aggregateNutritionData(nutritionData);
    } catch (error) {
      console.error("Failed to calculate meal plan nutrition:", error);
      throw new Error("Failed to analyze meal plan nutrition");
    }
  }

  static aggregateNutritionData(nutritionArray) {
    const totals = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
      cholesterol: 0,
    };

    nutritionArray.forEach((data) => {
      if (data.nutrition) {
        Object.keys(totals).forEach((key) => {
          totals[key] += data.nutrition[key] || 0;
        });
      }
    });

    return {
      totals,
      averageHealthScore:
        nutritionArray.reduce((sum, data) => sum + (data.healthScore || 0), 0) /
        nutritionArray.length,
      combinedDietaryTags: [
        ...new Set(nutritionArray.flatMap((data) => data.dietaryTags || [])),
      ],
      recipeCount: nutritionArray.length,
    };
  }

  static getNutritionLabel(nutritionData) {
    // Generate FDA-style nutrition label data
    const { nutrition } = nutritionData;

    return {
      servingSize: `1 serving (${nutritionData.servings} total)`,
      calories: nutrition.calories,
      totalFat: {
        value: nutrition.fat,
        dailyValue: Math.round((nutrition.fat / 65) * 100),
      },
      sodium: {
        value: nutrition.sodium,
        dailyValue: Math.round((nutrition.sodium / 2300) * 100),
      },
      totalCarbs: {
        value: nutrition.carbs,
        dailyValue: Math.round((nutrition.carbs / 300) * 100),
      },
      dietaryFiber: {
        value: nutrition.fiber,
        dailyValue: Math.round((nutrition.fiber / 25) * 100),
      },
      protein: {
        value: nutrition.protein,
        dailyValue: Math.round((nutrition.protein / 50) * 100),
      },
      cholesterol: {
        value: nutrition.cholesterol,
        dailyValue: Math.round((nutrition.cholesterol / 300) * 100),
      },
    };
  }
}

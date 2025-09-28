"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Calculator,
  Users,
  RotateCcw,
  Minus,
  Plus,
  AlertCircle,
  Check,
} from "lucide-react";
import {
  parseIngredient,
  scaleIngredient,
  formatIngredient,
} from "@/lib/ingredient-parser";
import { smartConvertUnits } from "@/lib/unit-conversions";
import { showToast } from "@/lib/toast";

export function RecipeScalingCalculator({
  recipe,
  onScaledRecipeChange,
  className = "",
}) {
  const [targetServings, setTargetServings] = useState(recipe.servings);
  const [scaleFactor, setScaleFactor] = useState(1);
  const [scaledIngredients, setScaledIngredients] = useState([]);
  const [errors, setErrors] = useState([]);
  const [isCalculating, setIsCalculating] = useState(false);

  // Calculate scale factor when target servings change
  useEffect(() => {
    if (recipe.servings && targetServings > 0) {
      const newScaleFactor = targetServings / recipe.servings;
      setScaleFactor(newScaleFactor);
    }
  }, [targetServings, recipe.servings]);

  // Calculate scaled ingredients when scale factor changes
  useEffect(() => {
    if (!recipe.ingredients || scaleFactor <= 0) return;

    // Prevent duplicate callbacks by debouncing
    const timeoutId = setTimeout(() => {
      setIsCalculating(true);
      const newErrors = [];

      try {
        const scaled = recipe.ingredients.map((ingredient, index) => {
          try {
            // Handle both string and object format ingredients
            let parsed;
            if (typeof ingredient === 'string') {
              // Parse string ingredients normally
              parsed = parseIngredient(ingredient);
            } else if (typeof ingredient === 'object' && ingredient.name) {
              // Handle object format ingredients {name, unit, amount}
              parsed = {
                quantity: parseFloat(ingredient.amount) || 1,
                unit: ingredient.unit || 'piece',
                name: ingredient.name || 'ingredient',
                original: ingredient,
                error: null,
              };
            } else {
              throw new Error('Invalid ingredient format');
            }

            const scaled = scaleIngredient(parsed, scaleFactor);

            // Apply smart unit conversion
            const converted = smartConvertUnits(scaled.quantity, scaled.unit, 1);
            if (!converted.error) {
              scaled.quantity = converted.value;
              scaled.unit = converted.unit;
            }

            return {
              ...scaled,
              formatted: formatIngredient(scaled, true),
              index: index,
              hasError: false,
            };
          } catch (error) {
            newErrors.push(
              `Error processing ingredient ${index + 1}: ${error.message}`
            );
            
            // Handle error cases for both string and object ingredients
            let ingredientName;
            if (typeof ingredient === 'string') {
              ingredientName = ingredient;
            } else if (typeof ingredient === 'object' && ingredient.name) {
              ingredientName = `${ingredient.amount || 1} ${ingredient.unit || 'piece'} ${ingredient.name}`.trim();
            } else {
              ingredientName = 'unknown ingredient';
            }
            
            return {
              quantity: 1,
              unit: "piece",
              name: ingredientName,
              original: ingredient,
              formatted: ingredientName,
              index: index,
              hasError: true,
              error: error.message,
            };
          }
        });

        setScaledIngredients(scaled);
        setErrors(newErrors);

        // Notify parent component of changes directly without memoized callback
        if (onScaledRecipeChange) {
          onScaledRecipeChange({
            ...recipe,
            servings: targetServings,
            ingredients: scaled.map((ing) => ing.formatted),
            scaleFactor: scaleFactor,
            originalServings: recipe.servings,
          });
        }
      } catch (error) {
        console.error("Scaling error:", error);
        showToast.error(
          "Scaling Error",
          "Failed to calculate scaled ingredients"
        );
      } finally {
        setIsCalculating(false);
      }
    }, 100); // 100ms debounce to prevent duplicate calls

    // Cleanup timeout on dependency change
    return () => clearTimeout(timeoutId);
  }, [scaleFactor, targetServings]); // Only depend on primitive values

  // Preset serving buttons
  const presetServings = useMemo(() => {
    const original = recipe.servings;
    const presets = [1, 2, 4, 6, 8, 10, 12];

    // Always include original serving size
    if (!presets.includes(original)) {
      presets.push(original);
      presets.sort((a, b) => a - b);
    }

    return presets.filter((serving) => serving > 0 && serving <= 20);
  }, [recipe.servings]);

  const handleServingChange = (newServings) => {
    if (newServings > 0 && newServings <= 50) {
      setTargetServings(newServings);
    }
  };

  const handleReset = () => {
    setTargetServings(recipe.servings);
    showToast.success("Reset", "Recipe scaling reset to original");
  };

  const adjustServings = (adjustment) => {
    const newServings = Math.max(1, Math.min(50, targetServings + adjustment));
    setTargetServings(newServings);
  };

  const getScaleFactorColor = () => {
    if (scaleFactor < 1) return "text-blue-600";
    if (scaleFactor > 1) return "text-green-600";
    return "text-gray-600";
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Recipe Scaling Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Recipe Info */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Original Recipe</span>
          </div>
          <Badge variant="secondary">{recipe.servings} servings</Badge>
        </div>

        {/* Serving Size Controls */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Target Servings</label>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => adjustServings(-1)}
                disabled={targetServings <= 1}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <Input
                type="number"
                value={targetServings}
                onChange={(e) =>
                  handleServingChange(parseInt(e.target.value) || 1)
                }
                min="1"
                max="50"
                className="w-20 text-center"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => adjustServings(1)}
                disabled={targetServings >= 50}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap gap-1">
            {presetServings.map((servings) => (
              <Button
                key={servings}
                size="sm"
                variant={targetServings === servings ? "default" : "outline"}
                onClick={() => setTargetServings(servings)}
                className="text-xs"
              >
                {servings}
              </Button>
            ))}
          </div>
        </div>

        {/* Scale Factor Display */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <span className="text-sm font-medium">Scale Factor</span>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={getScaleFactorColor()}>
              {scaleFactor.toFixed(2)}x
            </Badge>
            {scaleFactor !== 1 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleReset}
                className="h-6 w-6 p-0"
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        <Separator />

        {/* Scaled Ingredients */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Scaled Ingredients</h4>
            {isCalculating && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calculator className="h-3 w-3 animate-pulse" />
                Calculating...
              </div>
            )}
          </div>

          <div className="space-y-1 max-h-60 overflow-y-auto">
            {scaledIngredients.map((ingredient, index) => (
              <div
                key={index}
                className={`p-2 rounded border text-sm ${
                  ingredient.hasError
                    ? "bg-red-50 border-red-200"
                    : "bg-white border-gray-200"
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className={ingredient.hasError ? "text-red-700" : ""}>
                    {ingredient.formatted}
                  </span>
                  {ingredient.hasError ? (
                    <AlertCircle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <Check className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                  )}
                </div>
                {ingredient.hasError && ingredient.error && (
                  <div className="text-xs text-red-600 mt-1">
                    {ingredient.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error Display */}
        {errors.length > 0 && (
          <div className="space-y-1">
            <h5 className="text-sm font-medium text-red-600">
              Parsing Warnings
            </h5>
            <div className="space-y-1">
              {errors.map((error, index) => (
                <div
                  key={index}
                  className="text-xs text-red-600 bg-red-50 p-2 rounded"
                >
                  {error}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          {scaleFactor === 1
            ? "Recipe at original size"
            : scaleFactor < 1
            ? `Recipe scaled down by ${((1 - scaleFactor) * 100).toFixed(0)}%`
            : `Recipe scaled up by ${((scaleFactor - 1) * 100).toFixed(0)}%`}
        </div>
      </CardContent>
    </Card>
  );
}

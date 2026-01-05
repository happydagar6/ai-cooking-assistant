'use client';

import { useCollection, useRemoveRecipeFromCollection } from '@/hooks/use-collections';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';

/**
 * Collection Detail View
 * Shows all recipes in a collection
 * @param {string} collectionId - Collection ID
 * @param {function} onBack - Callback to go back
 */
export function CollectionDetail({ collectionId, onBack }) {
  const { data, isLoading } = useCollection(collectionId);
  const removeRecipe = useRemoveRecipeFromCollection();

  const handleRemove = async (recipeId) => {
    if (confirm('Remove this recipe from the collection?')) {
      await removeRecipe.mutateAsync({ collectionId, recipeId });
    }
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <p>Loading collection...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-4">
        <p>Collection not found</p>
      </div>
    );
  }

  const { collection, recipes } = data;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">{collection.name}</h2>
          {collection.description && (
            <p className="text-gray-600 text-sm mt-1">{collection.description}</p>
          )}
          <p className="text-sm text-gray-500 mt-2">
            {recipes.length} {recipes.length === 1 ? 'recipe' : 'recipes'}
          </p>
        </div>
      </div>

      {/* Recipes Grid */}
      {recipes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">No recipes in this collection yet</p>
            <p className="text-sm text-gray-400 mt-2">
              Add recipes from search or recipe pages
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              collectionId={collectionId}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Recipe Card in Collection
 */
function RecipeCard({ recipe, collectionId, onRemove }) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <Link href={`/cook/${recipe.id}`}>
        {recipe.image_url && (
          <div className="relative h-48 w-full bg-gray-200">
            <Image
              src={recipe.image_url}
              alt={recipe.title}
              fill
              className="object-cover"
            />
          </div>
        )}
        <CardContent className="p-4">
          <h3 className="font-bold line-clamp-2 mb-2">{recipe.title}</h3>
          {recipe.description && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
              {recipe.description}
            </p>
          )}
          <div className="flex items-center gap-3 text-xs text-gray-500">
            {recipe.prep_time && recipe.cook_time && (
              <span>{recipe.prep_time + recipe.cook_time} min</span>
            )}
            {recipe.difficulty && (
              <span className="capitalize">{recipe.difficulty}</span>
            )}
          </div>
        </CardContent>
      </Link>
      <div className="px-4 pb-4">
        <Button
          size="sm"
          variant="outline"
          className="w-full text-red-500 hover:text-red-700 hover:bg-red-50"
          onClick={(e) => {
            e.preventDefault();
            onRemove(recipe.id);
          }}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Remove
        </Button>
      </div>
    </Card>
  );
}

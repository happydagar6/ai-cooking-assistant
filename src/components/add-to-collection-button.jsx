'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  useCollections,
  useAddRecipeToCollection,
} from '@/hooks/use-collections';

/**
 * Add Recipe to Collection Component
 * Appears in search results and recipe detail pages
 * @param {string} recipeId - Recipe ID to add
 */
export function AddToCollectionButton({ recipeId }) {
  const [showModal, setShowModal] = useState(false);
  
  const { data: collections = [] } = useCollections();
  const addToCollection = useAddRecipeToCollection();

  const handleAdd = async (collectionId) => {
    await addToCollection.mutateAsync({ collectionId, recipeId });
    setShowModal(false);
  };

  if (collections.length === 0) {
    return null; // Don't show if no collections exist
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={(e) => {
          e.stopPropagation();
          setShowModal(true);
        }}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add to Collection
      </Button>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <Card
            className="w-full max-w-md max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <CardContent className="pt-6">
              <h3 className="text-lg font-bold mb-4">Add to Collection</h3>
              <div className="space-y-2">
                {collections.map((collection) => (
                  <button
                    key={collection.id}
                    onClick={() => handleAdd(collection.id)}
                    disabled={addToCollection.isPending}
                    className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    <div className="font-medium">{collection.name}</div>
                    <div className="text-sm text-gray-500">
                      {collection.recipe_count || 0} recipes
                    </div>
                  </button>
                ))}
              </div>
              <Button
                variant="outline"
                onClick={() => setShowModal(false)}
                className="w-full mt-4"
              >
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

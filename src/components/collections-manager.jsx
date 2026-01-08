'use client';

import { useState } from 'react';
import { Plus, Folder, Trash2, Edit2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  useCollections,
  useCreateCollection,
  useUpdateCollection,
  useDeleteCollection,
} from '@/hooks/use-collections';

/**
 * Collections Manager Component
 * Displays all user collections with CRUD operations
 */
export function CollectionsManager({ onCollectionSelect }) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDescription, setNewCollectionDescription] = useState('');

  // React Query hooks
  const { data: collections = [], isLoading } = useCollections();
  const createCollection = useCreateCollection();
  const updateCollection = useUpdateCollection();
  const deleteCollection = useDeleteCollection();

  const handleCreate = async (e) => {
    e.preventDefault();
    
    if (!newCollectionName.trim()) return;

    await createCollection.mutateAsync({
      name: newCollectionName.trim(),
      description: newCollectionDescription.trim() || null,
      color: 'blue',
      icon: 'folder',
    });

    setNewCollectionName('');
    setNewCollectionDescription('');
    setIsCreating(false);
  };

  const handleUpdate = async (collectionId, updates) => {
    await updateCollection.mutateAsync({
      collectionId,
      updates,
    });
    setEditingId(null);
  };

  const handleDelete = async (collectionId) => {
    if (confirm('Delete this collection? Recipes will not be deleted.')) {
      await deleteCollection.mutateAsync(collectionId);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Collections</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Loading collections...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mt-8 sm:mt-0">
        <h2 className="text-2xl font-bold">My Collections</h2>
        <Button
          onClick={() => setIsCreating(true)}
          size="sm"
          className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Collection
        </Button>
      </div>

      {/* Create Collection Form */}
      {isCreating && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label htmlFor="name">Collection Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Quick Weeknight Dinners"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  maxLength={100}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description (optional)</Label>
                <Input
                  id="description"
                  placeholder="Brief description..."
                  value={newCollectionDescription}
                  onChange={(e) => setNewCollectionDescription(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={createCollection.isPending || !newCollectionName.trim()}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  {createCollection.isPending ? 'Creating...' : 'Create'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreating(false);
                    setNewCollectionName('');
                    setNewCollectionDescription('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Collections Grid */}
      {collections.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Folder className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No collections yet</p>
            <p className="text-sm text-gray-400 mt-2">
              Create collections to organize your recipes
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map((collection) => (
            <CollectionCard
              key={collection.id}
              collection={collection}
              isEditing={editingId === collection.id}
              onEdit={() => setEditingId(collection.id)}
              onCancelEdit={() => setEditingId(null)}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onSelect={onCollectionSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Individual Collection Card
 */
function CollectionCard({
  collection,
  isEditing,
  onEdit,
  onCancelEdit,
  onUpdate,
  onDelete,
  onSelect,
}) {
  const [editName, setEditName] = useState(collection.name);
  const [editDescription, setEditDescription] = useState(collection.description || '');

  const handleSave = () => {
    onUpdate(collection.id, {
      name: editName.trim(),
      description: editDescription.trim() || null,
    });
  };

  if (isEditing) {
    return (
      <Card className="border-orange-200">
        <CardContent className="pt-6 space-y-3">
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="Collection name"
          />
          <Input
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            placeholder="Description"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave}>
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={onCancelEdit}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onSelect && onSelect(collection)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <Folder className="h-8 w-8 text-orange-500" />
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(collection.id);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardTitle className="text-lg mt-2">{collection.name}</CardTitle>
      </CardHeader>
      <CardContent>
        {collection.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {collection.description}
          </p>
        )}
        <div className="flex items-center text-sm text-gray-500">
          <span className="font-medium">{collection.recipe_count || 0}</span>
          <span className="ml-1">
            {collection.recipe_count === 1 ? 'recipe' : 'recipes'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

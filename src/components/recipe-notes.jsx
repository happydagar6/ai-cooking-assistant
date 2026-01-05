'use client';

import { useState, useRef } from 'react';
import { Plus, Pin, Trash2, Edit2, Mic, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  useRecipeNotes,
  useCreateNote,
  useUpdateNote,
  useDeleteNote,
  useTogglePinNote,
} from '@/hooks/use-recipe-notes';

/**
 * Recipe Notes Component
 * Displays and manages all notes for a recipe
 * @param {string} recipeId - Recipe ID
 * @param {number} currentStep - Current cooking step (optional)
 */
export function RecipeNotes({ recipeId, currentStep = null }) {
  const [isAdding, setIsAdding] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteType, setNewNoteType] = useState('general');
  const [isRecording, setIsRecording] = useState(false);

  // React Query hooks
  const { data: notes = [], isLoading } = useRecipeNotes(recipeId);
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  const togglePin = useTogglePinNote();

  // Filter notes for current step if provided
  const relevantNotes = currentStep !== null
    ? notes.filter((note) => 
        note.step_number === currentStep || note.is_pinned || note.note_type === 'general'
      )
    : notes;

  const handleAddNote = async (e) => {
    e.preventDefault();
    
    if (!newNoteContent.trim()) return;

    await createNote.mutateAsync({
      recipeId,
      noteData: {
        content: newNoteContent.trim(),
        noteType: newNoteType,
        stepNumber: newNoteType === 'step' ? currentStep : null,
        isPinned: false,
      },
    });

    setNewNoteContent('');
    setNewNoteType('general');
    setIsAdding(false);
  };

  const handleDelete = async (noteId) => {
    if (confirm('Delete this note?')) {
      await deleteNote.mutateAsync({ noteId, recipeId });
    }
  };

  const handleTogglePin = async (noteId, currentlyPinned) => {
    await togglePin.mutateAsync({
      noteId,
      recipeId,
      isPinned: !currentlyPinned,
    });
  };

  // Voice recording (placeholder - implement Web Speech API)
  const handleVoiceNote = () => {
    setIsRecording(!isRecording);
    // TODO: Implement voice recording
    alert('Voice recording feature coming soon!');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-4">
          <p className="text-sm text-gray-500">Loading notes...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg">Notes</h3>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsAdding(!isAdding)}
        >
          {isAdding ? (
            <X className="h-4 w-4 mr-2" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          {isAdding ? 'Cancel' : 'Add Note'}
        </Button>
      </div>

      {/* Add Note Form */}
      {isAdding && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-4">
            <form onSubmit={handleAddNote} className="space-y-3">
              <div className="flex gap-2">
                <select
                  value={newNoteType}
                  onChange={(e) => setNewNoteType(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="general">General Note</option>
                  <option value="step">Step Note</option>
                  <option value="ingredient">Ingredient Note</option>
                  <option value="tip">Cooking Tip</option>
                  <option value="warning">Warning</option>
                </select>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleVoiceNote}
                  className={isRecording ? 'bg-red-100' : ''}
                >
                  <Mic className="h-4 w-4" />
                </Button>
              </div>
              <Input
                placeholder="Type your note here..."
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                required
              />
              <div className="flex gap-2">
                <Button
                  type="submit"
                  size="sm"
                  disabled={createNote.isPending || !newNoteContent.trim()}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  {createNote.isPending ? 'Adding...' : 'Add Note'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Notes List */}
      {relevantNotes.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-gray-500">No notes yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Add notes to personalize this recipe
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {relevantNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              recipeId={recipeId}
              onDelete={handleDelete}
              onTogglePin={handleTogglePin}
              onUpdate={(noteId, updates) =>
                updateNote.mutateAsync({ noteId, recipeId, updates })
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Individual Note Card
 */
function NoteCard({ note, recipeId, onDelete, onTogglePin, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(note.content);

  const noteTypeColors = {
    general: 'bg-gray-100 text-gray-800',
    step: 'bg-blue-100 text-blue-800',
    ingredient: 'bg-green-100 text-green-800',
    tip: 'bg-yellow-100 text-yellow-800',
    warning: 'bg-red-100 text-red-800',
  };

  const handleSave = () => {
    if (editContent.trim()) {
      onUpdate(note.id, { content: editContent.trim() });
      setIsEditing(false);
    }
  };

  return (
    <Card className={note.is_pinned ? 'border-orange-400 bg-orange-50' : ''}>
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          {/* Pin Button */}
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 mt-1"
            onClick={() => onTogglePin(note.id, note.is_pinned)}
          >
            <Pin
              className={`h-4 w-4 ${
                note.is_pinned ? 'fill-orange-500 text-orange-500' : 'text-gray-400'
              }`}
            />
          </Button>

          {/* Content */}
          <div className="flex-1">
            {/* Note Type Badge */}
            <div className="flex items-center gap-2 mb-2">
              <Badge
                className={`text-xs ${noteTypeColors[note.note_type] || noteTypeColors.general}`}
              >
                {note.note_type}
              </Badge>
              {note.step_number !== null && (
                <Badge variant="outline" className="text-xs">
                  Step {note.step_number + 1}
                </Badge>
              )}
            </div>

            {/* Note Content */}
            {isEditing ? (
              <div className="space-y-2">
                <Input
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="text-sm"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSave}>
                    <Check className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setEditContent(note.content);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm">{note.content}</p>
            )}

            {/* Timestamp */}
            <p className="text-xs text-gray-400 mt-2">
              {new Date(note.created_at).toLocaleDateString()}
            </p>
          </div>

          {/* Actions */}
          {!isEditing && (
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                onClick={() => onDelete(note.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

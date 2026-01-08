'use client';

import Image from 'next/image';
import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * RECIPE IMAGE COMPONENT
 * =====================
 * Handles optimized image display with fallbacks and lazy loading
 * Works for both internal (stored) and external (streamed) recipes
 * 
 * Features:
 * - Lazy loading by default
 * - Blur placeholder support (blurhash)
 * - Responsive image sizing
 * - Fallback to placeholder on error
 * - Optimized quality (85%)
 */
export function RecipeImage({
  recipe,
  priority = false,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px',
  className = '',
  fill = false,
  width = null,
  height = null,
  onError = null,
  variant = 'card' // 'card', 'full', 'thumbnail'
}) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Get image URL with fallback chain:
  // 1. Optimized storage path (internal recipes)
  // 2. Original image URL (any recipe)
  const imageUrl = recipe?.image_storage_path
    ? getStorageImageUrl(recipe.image_storage_path)
    : (recipe?.image_url || recipe?.imageUrl || recipe?.image);

  // Blurhash for blur placeholder
  const blurHash = recipe?.image_blurhash;

  // Variant sizes
  const variantSizes = {
    card: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px',
    full: '100vw',
    thumbnail: '(max-width: 640px) 50vw, 150px'
  };

  // If no image URL or error occurred, show placeholder
  if (!imageUrl || imageError) {
    return (
      <div
        className={cn(
          'relative w-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center rounded-lg overflow-hidden',
          fill ? 'absolute inset-0' : 'h-48',
          className
        )}
      >
        <div className="flex flex-col items-center gap-2 text-center p-4">
          <ImageOff className="h-8 w-8 text-gray-400 dark:text-gray-500" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {recipe?.title ? `Image not available` : 'No image'}
          </p>
        </div>
      </div>
    );
  }

  // Determine if this is a Supabase storage URL (indicates optimized image)
  const isOptimized = imageUrl?.includes('supabase');

  const imageProps = {
    src: imageUrl,
    alt: recipe?.title || 'Recipe image',
    quality: 85, // Balanced quality vs file size
    priority,
    sizes: variantSizes[variant] || sizes,
    onError: (error) => {
      console.log('[RecipeImage] Load error for:', recipe?.title);
      setImageError(true);
      onError?.(error);
    },
    onLoadingComplete: () => {
      console.log('[RecipeImage] Loaded:', recipe?.title, isOptimized ? '(optimized)' : '(original)');
      setIsLoading(false);
    },
    placeholder: blurHash ? 'blur' : 'empty',
    blurDataURL: blurHash,
    className: cn(
      'object-cover w-full h-full transition-opacity duration-300',
      isLoading && 'animate-pulse bg-gray-200',
      className
    )
  };

  if (fill) {
    return (
      <div className={cn('relative overflow-hidden rounded-lg', className)}>
        <Image {...imageProps} fill style={{ position: 'absolute' }} />
      </div>
    );
  }

  return (
    <div className={cn('relative w-full h-48 overflow-hidden rounded-lg bg-gray-100', className)}>
      <Image
        {...imageProps}
        width={width || 400}
        height={height || 300}
      />
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
    </div>
  );
}

/**
 * Get Supabase Storage image URL
 * Converts storage path to full public URL
 */
function getStorageImageUrl(storagePath) {
  if (!storagePath) return null;
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!baseUrl) {
    console.warn('[RecipeImage] NEXT_PUBLIC_SUPABASE_URL not configured');
    return null;
  }
  return `${baseUrl}/storage/v1/object/public/recipe-images/${storagePath}`;
}

/**
 * Variant: Simple recipe image thumbnail
 */
export function RecipeImageThumbnail({ recipe, ...props }) {
  return (
    <RecipeImage
      recipe={recipe}
      variant="thumbnail"
      height={150}
      width={200}
      {...props}
    />
  );
}

/**
 * Variant: Full-width hero image
 */
export function RecipeImageHero({ recipe, ...props }) {
  return (
    <RecipeImage
      recipe={recipe}
      variant="full"
      height={400}
      width={1200}
      priority={true}
      {...props}
    />
  );
}

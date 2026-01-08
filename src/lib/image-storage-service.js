/**
 * IMAGE STORAGE SERVICE
 * =====================
 * Manages image uploads to Supabase Storage and metadata tracking
 */

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export class ImageStorageService {
  /**
   * Upload recipe image to Supabase Storage
   * For internal recipes only (external recipes stream from source)
   */
  static async uploadRecipeImage(
    imageBuffer,
    recipeId,
    fileName,
    options = {}
  ) {
    try {
      const { contentType = "image/jpeg", storeType = "internal" } = options; // 'internal' or 'external'

      // Validate bucket exists
      const bucketName = "recipe-images";

      // Create storage path: internal/{recipeId}/{fileName}
      const storagePath = `${storeType}/${recipeId}/${fileName}`;
      console.log("[ImageStorage] Uploading to:", storagePath);

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(storagePath, imageBuffer, {
          contentType,
          cacheControl: "31536000", // 1 year (immutable content)
          upsert: true, // Replace if exists
        });

      if (error) {
        throw new Error(`Storage upload failed: ${error.message}`);
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(storagePath);

      return {
        path: storagePath,
        url: publicUrlData.publicUrl,
        size: imageBuffer.length,
        uploadedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("[ImageStorage] Upload errors:", error);
      throw error;
    }
  }
  /**
   * Save image metadata to database for tracking
   */

  static async saveImageMetadata(imageMetadata) {
    try {
      const {
        sourceUrl,
        storagePath,
        format,
        originalSize,
        optimizedSize,
        width,
        height,
        fileHash,
        recipeId,
        recipeType,
      } = imageMetadata;

      const { data, error } = await supabase
        .from("image_metadata")
        .upsert(
          {
            source_url: sourceUrl,
            storage_path: storagePath,
            format,
            original_size: originalSize,
            optimized_size: optimizedSize,
            width,
            height,
            file_hash: fileHash,
            recipe_id: recipeId,
            recipe_type: recipeType,
            created_at: new Date().toISOString(),
          },
          {
            onConflict: "file_hash", // Don't re-upload same image
          }
        )
        .select();

      if (error) {
        console.error("[ImageMetadata] Save error:", error);
        // Dont throw - metadata tracking is non-critical
        return null; // Swallow error
      }

      return data?.[0] || null;
    } catch (error) {
      console.error("[ImageMetadata] Exception:", error);
      return null;
    }
  }

  /**
   * Get image URL from storage (for internal recipes)
   */
  static getImageUrl(storagePath) {
    if (!storagePath) return null;

    const bucketName = "recipe-images";
    const { data } = supabase.storage
      .from(bucketName)
      .getPublicUrl(storagePath);

    return data.publicUrl;
  }

  /**
   * Delete image from storage
   */
  static async deleteImage(storagePath) {
    try {
        if (!storagePath) return false;

        const { error } = await supabase.storage
        .from('recipe-images')
        .remove([storagePath]);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error("[ImageStorage] Delete error:", error);
        return false;
    }
  }

  
  /**
   * Check if image exists in storage
   */
  static async imageExists(storagePath) {
    try {
        if (!storagePath) return false;

        const { data, error } = await supabase.storage
        .from('recipe-images')
        .list(storagePath.split('/').splice(0, -1).join('/'));

        if(error) return false;
        return data?.some(f => f.name === storagePath.split('/').pop());
    } catch (error) {
        return false;
    }
  }
  
  /**
   * Get storage usage stats
   */

  static async getStorageStats() {
    try {
        const { data: files, error } = await supabase.storage
        .from('recipe-images')
        .list('', { limit: 1000 });

        if (error || !files) return null;
        
        let totalSize = 0;
        let fileCount = 0;

        const calculateSize = (list) => {
            list?.forEach(item => {
                if(item.metadata?.size) {
                    totalSize += item.metadata.size;
                    fileCount++;
                }
            });
        };

        calculateSize(files);

        return {
            totalSize,
            fileCount,
            totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
            estimatedCost: (totalSize / 1024 / 1024 / 1024 * 5).toFixed(2)
        };

    } catch (error) {
        console.error('[ImageStorage] Stats error:', error);
        return null;
    }
  }
}

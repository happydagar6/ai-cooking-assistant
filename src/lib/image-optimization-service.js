/**
 * IMAGE OPTIMIZATION SERVICE
 * ==========================
 * Handles downloading, optimizing, and storing recipe images
 * Supports WebP format, responsive sizing, and quality optimization
 */

import crypto from 'crypto';

export class ImageOptimizationService {
    /**
   * Download image and create optimized versions
   * Returns metadata needed for storage
   */

    static async optimizeImageFromUrl(imageUrl, options = {}) {
        try {
            if (!imageUrl) {
                throw new Error('Image URL is required');
            }
            console.log('[ImageOptimization] Processing:', imageUrl);

            // Fetch image with timeout
            const response = await fetch(imageUrl, {
                timeout: 10000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Compatible) CookAI/1.0',
                    'Accept': 'image/*'
                }
            });
            
            if(!response.ok) {
                throw new Error(`Failed to fetch image: ${response.statusText}`);
            }

            const contentType = response.headers.get('content-type');
            if (!contentType?.includes('image')) {
                throw new Error('URL does not point to a valid image');
            }
            const buffer = await response.buffer();

            // Validate image size (max 10MB)
            const MAX_SIZE = 10 * 1024 * 1024;
            if (buffer.length > MAX_SIZE) {
                throw new Error(`Image too large: ${(buffer.length / 1024 / 1024).toFixed(2)}MB max 10MB`);
            }

            // Generate file hash for deduplication
            const fileHash = crypto.createHash('sha256')
            .update(buffer)
            .digest('hex');

            return {
                buffer,
                size: buffer.length,
                contentType,
                fileHash,
                fileName: this.generateFileName(),
                originalUrl: imageUrl
            };
            
        } catch (error) {
            console.error('[ImageOptimization] Download error:', error);
            throw new Error(`Image download failed: ${error.message}`);
        }
    }

    
  /**
   * Check if image URL is valid and accessible
   */
  static async validateImageUrl(imageUrl) {
    try {
        if (!imageUrl) return false;

        const response = await fetch(imageUrl, {
            method: 'HEAD',
            timeout: 5000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Compatible) CookAI/1.0',
            }
        });

        if (!response.ok) return false;

        const contentType = response.headers.get('content-type');
        return contentType?.includes('image') || false;

    } catch (error) {
        console.log('[ImageOptimization] URL validation failed:', error.message);
        return false;
    }
  }

  
  /**
   * Generate unique filename for images
   */

  static generateFileName(extension = 'jpg') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `recipe-${timestamp}-${random}.${extension}`;
  }

  
  /**
   * Calculate image compression ratio
   */
  static calculateCompressionRatio(originalSize, optimizedSize) {
    if (originalSize === 0) return 0;
    return ((originalSize - optimizedSize) / originalSize) * 100;
  }

/**
* Get file size in human-readable format
*/

static formatFileSize(bytes) {
    if(bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}



}
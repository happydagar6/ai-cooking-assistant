import { NextResponse } from 'next/server';
import { RecipeNormalizationService } from '@/lib/recipe-normalization';
import { OpenAIService } from '@/lib/openai';
import { randomUUID } from 'crypto';

/**
 * POST - Fetch and structure recipe from external URL using LLM
 * Body: { sourceUrl }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { sourceUrl } = body;

    if (!sourceUrl) {
      return NextResponse.json(
        { error: 'sourceUrl is required' },
        { status: 400 }
      );
    }

    console.log('[Fetch External Recipe] Fetching from:', sourceUrl);

    // Validate URL
    let url;
    try {
      url = new URL(sourceUrl);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL provided' },
        { status: 400 }
      );
    }

    // Fetch the HTML with security headers
    let html;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch(sourceUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; RecipeBot/1.0)',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        // Limit to first 1MB of content
        redirect: 'follow',
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Get only first 1MB to avoid huge files
      const buffer = await response.arrayBuffer();
      if (buffer.byteLength > 1024 * 1024) {
        console.warn('[Fetch External Recipe] Content too large, truncating');
      }

      html = new TextDecoder().decode(buffer.slice(0, 1024 * 1024));
    } catch (fetchError) {
      console.error('[Fetch External Recipe] Fetch error:', fetchError.message);
      return NextResponse.json(
        { error: 'Could not fetch the recipe page. It may be blocked or unavailable.' },
        { status: 400 }
      );
    }

    // Extract text content safely
    const textContent = extractTextContent(html);

    if (!textContent || textContent.length < 50) {
      return NextResponse.json(
        { error: 'Could not extract enough content from this URL' },
        { status: 400 }
      );
    }

    // Use LLM to structure the recipe
    console.log('[Fetch External Recipe] Structuring with LLM...');
    const recipe = await structureRecipeWithLLM(textContent, sourceUrl);

    if (!recipe) {
      return NextResponse.json(
        { error: 'Could not extract recipe information from this page' },
        { status: 400 }
      );
    }

    console.log('[Fetch External Recipe] Successfully structured recipe:', recipe.title);

    // Add UUID and metadata before returning
    const recipeWithId = {
      ...recipe,
      id: randomUUID(),
      source_url: sourceUrl,
      source_domain: new URL(sourceUrl).hostname,
      isExternal: true,
    };

    return NextResponse.json({
      recipe: recipeWithId,
      success: true,
    });

  } catch (error) {
    console.error('[Fetch External Recipe] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch and structure recipe' },
      { status: 500 }
    );
  }
}

/**
 * Extract and clean text content from HTML
 */
function extractTextContent(html) {
  try {
    // Remove scripts and styles
    let text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
      .replace(/<meta[^>]*>/gi, '')
      .replace(/<link[^>]*>/gi, '');

    // Remove HTML tags
    text = text.replace(/<[^>]+>/g, ' ');

    // Clean up whitespace
    text = text
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 5000); // Limit to 5000 characters for LLM

    return text.length > 100 ? text : '';

  } catch (error) {
    console.error('[Extract Text] Error:', error);
    return '';
  }
}

/**
 * Use LLM to structure recipe from raw text
 */
async function structureRecipeWithLLM(textContent, sourceUrl) {
  try {
    const prompt = `You are a recipe extraction AI. Extract recipe information from the following web content and structure it properly.

IMPORTANT: Only extract if there is a clear recipe. If no recipe is found, return null.

Web Content:
${textContent}

Extract and return a properly formatted recipe with all details. Return valid JSON only.`;

    const response = await OpenAIService.structureRecipe(textContent, sourceUrl);
    return response;

  } catch (error) {
    console.error('[Structure Recipe LLM] Error:', error);
    return null;
  }
}


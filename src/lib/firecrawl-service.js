/**
 * FIRECRAWL SERVICE
 * ================
 * Handles all communication with FireCrawl API
 * Fetches recipes from external web sources
 * Manages job polling and error handling
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export class FireCrawlService {
  
  static FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
  static FIRECRAWL_API_URL = 'https://api.firecrawl.dev/v1';
  static POLL_INTERVAL = 2000; // 2 seconds
  static MAX_POLL_TIME = 30000; // 30 seconds max wait
  static RECIPE_SITES = [
    'site:allrecipes.com',
    'site:foodnetwork.com',
    'site:delish.com',
    'site:bbcgoodfood.com',
    'site:serious-eats.com',
    'site:thepioneerwoman.com',
    'site:bonappetit.com',
  ];

  /**
   * Search for recipes across web
   * Returns recipes matching query + filters
   */
  static async searchRecipes(query, options = {}) {
    try {
      const {
        limit = 12,
        timeLimit = null,
        dietary = [],
        cuisine = null,
      } = options;

      console.log('[FireCrawl] Starting recipe search:', { query, limit });

      // If no FireCrawl API key, use fallback demo data
      if (!this.FIRECRAWL_API_KEY || this.FIRECRAWL_API_KEY === 'your-api-key') {
        console.log('[FireCrawl] No API key found, using real web search fallback');
        return await this.searchRecipesWithWebSearch(query, options);
      }

      // Try FireCrawl API
      try {
        const results = await this.searchWithFireCrawl(query, options);
        if (results && results.length > 0) {
          console.log('[FireCrawl] Recipe search completed:', { 
            query, 
            resultCount: results.length,
          });
          return {
            recipes: results.slice(0, limit),
            jobId: 'fc-' + Date.now(),
            source: 'firecrawl',
            resultCount: results.length,
          };
        }
      } catch (fcError) {
        console.warn('[FireCrawl] API call failed, falling back to web search:', fcError.message);
      }

      // Fallback to web search
      return await this.searchRecipesWithWebSearch(query, options);

    } catch (error) {
      console.error('[FireCrawl] Search error:', error);
      throw new Error(`Recipe search failed: ${error.message}`);
    }
  }

  /**
   * Real web search fallback using Google to find recipes from any website
   */
  static async searchRecipesWithWebSearch(query, options = {}) {
    const { limit = 20 } = options;
    const maxRecipesPerWebsite = 2; // Limit per website to distribute results
    
    const recipes = [];
    
    // List of recipe websites to search (covers many domains)
    const recipeWebsites = [
      'bbcgoodfood.com',
      'foodnetwork.com',
      'seriouseats.com',
      'delish.com',
      'thepioneerwoman.com',
      'bonappetit.com',
      'epicurious.com',
      'cooksillustrated.com',
      'saveur.com',
      'justapinch.com',
      'openstove.org',
      'smittenkitchen.com',
    ];

    try {
      // Try fetching from each recipe website
      for (const website of recipeWebsites) {
        // Only stop if we've reached the total limit
        if (recipes.length >= limit) break;

        // Track recipes added from this website
        let recipesFromThisWebsite = 0;

        try {
          // Build search URL for each website
          let searchUrl;
          if (website === 'bbcgoodfood.com') {
            searchUrl = `https://www.bbcgoodfood.com/search?q=${encodeURIComponent(query)}`;
          } else if (website === 'foodnetwork.com') {
            searchUrl = `https://www.foodnetwork.com/search/${encodeURIComponent(query)}/`;
          } else if (website === 'seriouseats.com') {
            searchUrl = `https://www.seriouseats.com/?s=${encodeURIComponent(query)}`;
          } else if (website === 'justapinch.com') {
            searchUrl = `https://www.justapinch.com/recipes/search.php?q=${encodeURIComponent(query)}`;
          } else if (website === 'openstove.org') {
            searchUrl = `https://openstove.org/search?q=${encodeURIComponent(query)}`;
          } else if (website === 'smittenkitchen.com') {
            searchUrl = `https://smittenkitchen.com/?s=${encodeURIComponent(query)}`;
          } else {
            searchUrl = `https://${website}/search?q=${encodeURIComponent(query)}`;
          }

          const response = await fetch(searchUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.5',
              'Referer': `https://${website}/`,
            },
            signal: AbortSignal.timeout(6000),
          });

          if (!response.ok) {
            console.warn(`[Web Search] ${website} returned ${response.status}`);
            continue;
          }

          const html = await response.text();

          // Extract recipe URLs using multiple patterns
          const patterns = [
            /href=["']([^"']*\/recipe[s]?\/[^"']+)["']/gi,
            /href=["']([^"']*\/recipes?\/[^"']+)["']/gi,
            /href=["']((https?:)?\/\/[^"']*?(bbcgoodfood|foodnetwork|seriouseats|delish|epicurious)\.com[^"']*\/recipe[^"']*?)["']/gi,
          ];

          const foundUrls = new Set();

          for (const pattern of patterns) {
            let match;
            // Stop adding from this website once we hit maxRecipesPerWebsite OR overall limit
            while ((match = pattern.exec(html)) !== null && 
                   recipes.length < limit && 
                   recipesFromThisWebsite < maxRecipesPerWebsite) {
              let url = match[1];

              // Convert relative URLs to absolute
              if (!url.startsWith('http')) {
                url = `https://${website}${url.startsWith('/') ? '' : '/'}${url}`;
              }

              // Clean up URL
              if (url.includes('?')) {
                url = url.split('?')[0];
              }

              // Skip duplicates and invalid URLs
              if (foundUrls.has(url) || !url.includes('/recipe')) {
                continue;
              }

              foundUrls.add(url);

              try {
                const domain = new URL(url).hostname.replace('www.', '');
                recipes.push({
                  id: `web-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
                  title: `${query} recipe - from ${domain}`,
                  description: `A ${query.toLowerCase()} recipe from ${domain}`,
                  source_url: url,
                  source_domain: domain,
                  prep_time: null,
                  cook_time: null,
                  servings: null,
                  ingredients: ['Click View to see full recipe'],
                  instructions: ['Click View to see full recipe'],
                  difficulty: null,
                  cuisine_type: null,
                  dietary_tags: [],
                  rating: null,
                  rating_count: 0,
                });
                recipesFromThisWebsite++; // Increment counter for this website
              } catch (urlError) {
                continue;
              }
            }
          }
        } catch (websiteError) {
          console.warn(`[Web Search] Error fetching from ${website}:`, websiteError.message);
          continue;
        }
      }

      if (recipes.length === 0) {
        console.warn('[Web Search] No recipes found from any source');
        throw new Error('No recipe URLs found');
      }

      console.log('[Web Search] Found', recipes.length, 'recipes from', recipeWebsites.length, 'websites');

      return {
        recipes: recipes.slice(0, limit),
        jobId: 'web-' + Date.now(),
        source: 'multi-website-search',
        resultCount: recipes.length,
      };

    } catch (error) {
      console.warn('[Web Search] Failed to fetch recipes:', error.message);

      // Return empty - no demo data
      return {
        recipes: [],
        jobId: 'web-' + Date.now(),
        source: 'web-search-failed',
        resultCount: 0,
      };
    }
  }

  /**
   * Search using FireCrawl API
   */
  static async searchWithFireCrawl(query, options = {}) {
    try {
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query + ' recipe')}`;
      
      const response = await fetch(`${this.FIRECRAWL_API_URL}/scrape`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.FIRECRAWL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: searchUrl,
          formats: ['markdown', 'links'],
          timeout: 30000,
        }),
      });

      if (!response.ok) {
        throw new Error(`FireCrawl API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Extract links from response
      const links = (data.links || []).filter(link => 
        link.includes('/recipe') || link.includes('/recipes')
      );

      return links.slice(0, 12).map((url, i) => ({
        id: `fc-${Date.now()}-${i}`,
        title: query + ' - Recipe',
        description: `A ${query.toLowerCase()} recipe`,
        source_url: url,
        source_domain: new URL(url).hostname,
        prep_time: 15,
        cook_time: 30,
        servings: 4,
        ingredients: ['See full recipe details'],
        instructions: ['Click View to see full recipe'],
        difficulty: 'medium',
        cuisine_type: 'mixed',
        dietary_tags: [],
        rating: 4.5,
        rating_count: 100,
      }));
    } catch (error) {
      console.error('[FireCrawl API] Error:', error);
      return [];
    }
  }

  /**
   * Build Google-like search query
   */
  static buildSearchQuery(baseQuery, options = {}) {
    let query = baseQuery;

    // Add site restrictions
    const siteFilters = this.RECIPE_SITES.slice(0, 3).join(' OR ');
    query += ` (${siteFilters})`;

    // Add time filter
    if (options.timeLimit) {
      query += ` "under ${options.timeLimit} minutes" OR "${options.timeLimit} minutes"`;
    }

    // Add dietary filters
    if (options.dietary && options.dietary.length > 0) {
      const dietaryTerms = options.dietary.map(d => `${d} recipe`).join(' OR ');
      query += ` (${dietaryTerms})`;
    }

    // Add cuisine filter
    if (options.cuisine) {
      query += ` ${options.cuisine} recipe`;
    }

    return query;
  }

  /**
   * Start FireCrawl job
   */
  static async startCrawlJob(query) {
    try {
      const response = await fetch(`${this.FIRECRAWL_API_URL}/scrape`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.FIRECRAWL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
          waitFor: '.g',
          formats: ['json'],
          jsonOptions: {
            extractorOptions: {
              mode: 'llm-extraction',
              extractionPrompt: `Extract ALL recipe information from search results. For EACH recipe link found, extract and return as JSON array:
              - title: string (recipe name)
              - source_url: string (full URL to recipe, not search link)
              - prepTime: number (in minutes)
              - cookTime: number (in minutes)
              - servings: number
              - ingredients: array of strings
              - instructions: array of strings
              - difficulty: string (easy, medium, hard)
              - cuisine: string (if available)
              Return ONLY valid JSON array, no markdown formatting.`,
            },
          },
          timeout: 30000,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('[FireCrawl] API Error Response:', errorData);
        throw new Error(`FireCrawl API error: ${response.status} ${response.statusText} - ${errorData}`);
      }

      const data = await response.json();
      
      // Handle structured response
      if (data.success && data.data) {
        return data.data;
      }

      if (data.data && data.data.metadata && data.data.metadata.jobId) {
        return data.data.metadata.jobId;
      }

      // If no job ID, return data directly (synchronous response)
      return data.data || data;

    } catch (error) {
      console.error('[FireCrawl] Job start error:', error);
      throw error;
    }
  }

  /**
   * Poll FireCrawl for job results
   */
  static async pollForResults(jobIdOrData, maxWaitTime = this.MAX_POLL_TIME) {
    try {
      // If received data directly (not job ID), return it
      if (typeof jobIdOrData === 'object' && jobIdOrData.extract) {
        return jobIdOrData.extract;
      }

      const jobId = jobIdOrData;
      const startTime = Date.now();

      while (Date.now() - startTime < maxWaitTime) {
        try {
          const response = await fetch(
            `${this.FIRECRAWL_API_URL}/job/${jobId}`,
            {
              headers: {
                'Authorization': `Bearer ${this.FIRECRAWL_API_KEY}`,
              },
            }
          );

          const data = await response.json();

          if (data.status === 'completed' && data.data) {
            return data.data.extract || data.data;
          }

          if (data.status === 'failed') {
            throw new Error(`FireCrawl job failed: ${data.error}`);
          }

          // Still pending, wait and retry
          await new Promise(resolve => setTimeout(resolve, this.POLL_INTERVAL));

        } catch (error) {
          if (Date.now() - startTime > maxWaitTime) {
            throw new Error('FireCrawl job polling timeout');
          }
          await new Promise(resolve => setTimeout(resolve, this.POLL_INTERVAL));
        }
      }

      throw new Error('FireCrawl job timeout - no results after 30 seconds');

    } catch (error) {
      console.error('[FireCrawl] Poll error:', error);
      throw error;
    }
  }

  /**
   * Parse raw FireCrawl results into recipe format
   */
  static async parseRecipes(rawResults) {
    try {
      if (!Array.isArray(rawResults)) {
        rawResults = [rawResults];
      }

      return rawResults.map(item => ({
        title: item.title || item.name || 'Untitled Recipe',
        description: item.description || `Recipe from ${new URL(item.source_url).hostname}`,
        source_url: item.source_url || item.url,
        source_domain: new URL(item.source_url || item.url).hostname,
        prep_time: parseInt(item.prepTime) || parseInt(item.prep_time) || 0,
        cook_time: parseInt(item.cookTime) || parseInt(item.cook_time) || 0,
        servings: parseInt(item.servings) || 2,
        ingredients: Array.isArray(item.ingredients) ? item.ingredients : [],
        instructions: Array.isArray(item.instructions) ? item.instructions : [],
        difficulty: this.estimateDifficulty(item),
        cuisine_type: item.cuisine || 'international',
        dietary_tags: this.extractDietaryTags(item),
        rating: parseFloat(item.rating) || null,
        rating_count: parseInt(item.ratingCount) || 0,
        image_url: item.image || item.imageUrl || null,
      }));

    } catch (error) {
      console.error('[FireCrawl] Parse error:', error);
      return [];
    }
  }

  /**
   * Estimate difficulty from recipe data
   */
  static estimateDifficulty(recipe) {
    const ingredientCount = (recipe.ingredients || []).length;
    const stepCount = (recipe.instructions || []).length;
    const totalTime = (parseInt(recipe.prep_time) || 0) + (parseInt(recipe.cook_time) || 0);

    // Simple heuristic
    if (ingredientCount <= 5 && stepCount <= 5 && totalTime <= 20) {
      return 'easy';
    } else if (ingredientCount <= 10 && stepCount <= 10 && totalTime <= 60) {
      return 'medium';
    } else {
      return 'hard';
    }
  }

  /**
   * Extract dietary tags from recipe
   */
  static extractDietaryTags(recipe) {
    const tags = [];
    const content = JSON.stringify(recipe).toLowerCase();

    const keywords = {
      'vegetarian': ['vegetarian', 'no meat'],
      'vegan': ['vegan', 'plant-based'],
      'gluten-free': ['gluten-free', 'gluten free'],
      'dairy-free': ['dairy-free', 'dairy free'],
      'keto': ['keto', 'ketogenic', 'low-carb'],
      'paleo': ['paleo', 'paleolithic'],
    };

    for (const [tag, keywords_list] of Object.entries(keywords)) {
      if (keywords_list.some(keyword => content.includes(keyword))) {
        tags.push(tag);
      }
    }

    return tags;
  }

  /**
   * Save job metadata to database
   */
  static async saveJobToDatabase(jobId, query, searchQuery) {
    try {
      const { error } = await supabase
        .from('firecrawl_jobs')
        .insert({
          job_id: jobId,
          query,
          status: 'pending',
          expires_results_at: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
        });

      if (error) throw error;
    } catch (error) {
      console.error('[FireCrawl] Database save error:', error);
      // Don't throw - job tracking is non-critical
    }
  }

  /**
   * Save recipes to external_recipes table
   */
  static async saveRecipesToDatabase(recipes, jobId) {
    try {
      const recipesToInsert = recipes.map(recipe => ({
        source_url: recipe.source_url,
        source_domain: recipe.source_domain,
        title: recipe.title,
        description: recipe.description,
        image_url: recipe.image_url,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        prep_time: recipe.prep_time,
        cook_time: recipe.cook_time,
        servings: recipe.servings,
        difficulty: recipe.difficulty,
        cuisine_type: recipe.cuisine_type,
        dietary_tags: recipe.dietary_tags,
        rating: recipe.rating,
        rating_count: recipe.rating_count,
        content_hash: this.generateContentHash(recipe),
        is_verified: false,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      }));

      // Insert with conflict handling (ignore duplicates)
      const { data, error } = await supabase
        .from('external_recipes')
        .upsert(recipesToInsert, {
          onConflict: 'source_url',
        })
        .select();

      if (error) throw error;

      // Update job status
      if (jobId && jobId !== 'direct') {
        await supabase
          .from('firecrawl_jobs')
          .update({
            status: 'completed',
            recipes_found: recipes.length,
            recipes_saved: data?.length || 0,
            completed_at: new Date().toISOString(),
          })
          .eq('job_id', jobId);
      }

      return data || [];

    } catch (error) {
      console.error('[FireCrawl] Recipe save error:', error);
      return [];
    }
  }

  /**
   * Generate hash for duplicate detection
   */
  static generateContentHash(recipe) {
    const content = `${recipe.title}${recipe.source_url}`;
    // Simple hash (in production, use crypto.subtle.digest)
    return Array.from(content).reduce((hash, char) => {
      return ((hash << 5) - hash) + char.charCodeAt(0);
    }, 0).toString(16);
  }

  /**
   * Get job status
   */
  static async getJobStatus(jobId) {
    try {
      const { data, error } = await supabase
        .from('firecrawl_jobs')
        .select('*')
        .eq('job_id', jobId)
        .single();

      if (error) throw error;
      return data;

    } catch (error) {
      console.error('[FireCrawl] Job status error:', error);
      return null;
    }
  }

  /**
   * Track API usage and costs
   */
  static async trackCost(jobId, cost) {
    try {
      await supabase
        .from('firecrawl_jobs')
        .update({ cost })
        .eq('job_id', jobId);
    } catch (error) {
      console.error('[FireCrawl] Cost tracking error:', error);
      // Non-critical
    }
  }
}

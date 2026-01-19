'use server';

import Anthropic from '@anthropic-ai/sdk';
import type {
  ImportedRecipeData,
  ParsedIngredient,
  ParsedInstruction,
  DietaryTag,
  Difficulty,
  MealType,
} from '@/types/recipe';

// Rate limiting: simple in-memory store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

// Cache for successful scrapes
const scrapeCache = new Map<string, { data: ImportedRecipeData; timestamp: number }>();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

// Fetch timeout
const FETCH_TIMEOUT = 15000; // 15 seconds

/**
 * Check and update rate limit for a user
 */
function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitStore.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitStore.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT) {
    return false;
  }

  userLimit.count++;
  return true;
}

/**
 * Validate URL format
 */
function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Generate cache key from URL
 */
function getCacheKey(url: string): string {
  return url.toLowerCase().replace(/\/$/, '');
}

/**
 * Fetch HTML content from URL with timeout
 */
async function fetchWithTimeout(url: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CookingMate/1.0; Recipe Import Bot)',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('text/html') && !contentType?.includes('application/xhtml')) {
      throw new Error('URL does not return HTML content');
    }

    return await response.text();
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Clean HTML by removing scripts, styles, and other non-content elements
 */
function cleanHtml(html: string): string {
  // Remove script tags and their content
  let cleaned = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove style tags and their content
  cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // Remove comments
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');

  // Remove navigation, footer, header, aside elements
  cleaned = cleaned.replace(/<(nav|footer|header|aside)\b[^>]*>[\s\S]*?<\/\1>/gi, '');

  // Remove common ad/tracking elements
  cleaned = cleaned.replace(/<div[^>]*(?:ad|tracking|promo|social)[^>]*>[\s\S]*?<\/div>/gi, '');

  // Trim excessive whitespace
  cleaned = cleaned.replace(/\s+/g, ' ');

  return cleaned;
}

/**
 * Extract recipe data from HTML using Claude API
 */
async function extractRecipeWithClaude(html: string, sourceUrl: string): Promise<ImportedRecipeData> {
  const anthropic = new Anthropic();

  // Clean the HTML to reduce tokens
  const cleanedHtml = cleanHtml(html);

  // Truncate if too long (max ~100k chars to stay within limits)
  const maxLength = 100000;
  const truncatedHtml = cleanedHtml.length > maxLength
    ? cleanedHtml.substring(0, maxLength) + '...[truncated]'
    : cleanedHtml;

  const systemPrompt = `You are a recipe extraction assistant. Your task is to extract structured recipe data from HTML content.
You must respond with valid JSON only, no other text or markdown formatting.

The JSON should have this exact structure:
{
  "title": "Recipe Title",
  "description": "Brief description of the recipe",
  "ingredients": [
    {
      "text": "Full original ingredient text",
      "quantity": 2,
      "unit": "cups",
      "name": "flour",
      "preparation": "sifted",
      "notes": "optional"
    }
  ],
  "instructions": [
    {
      "step": 1,
      "text": "Instruction text",
      "duration": 10,
      "tip": "Optional tip"
    }
  ],
  "prepTime": 15,
  "cookTime": 30,
  "servings": 4,
  "dietaryTags": ["vegetarian", "gluten-free"],
  "difficulty": "easy",
  "mealType": "dinner",
  "cuisine": "Italian",
  "imageUrl": "https://..."
}

Rules:
- All times should be in minutes
- quantity should be a number or null if not specified
- unit should be the measurement unit or null
- dietaryTags must only include: vegetarian, vegan, gluten-free, dairy-free, nut-free, low-carb, high-protein
- difficulty must be: easy, medium, or hard
- mealType must be: breakfast, lunch, dinner, snack, or any
- Return null for fields you cannot determine
- Include the full original ingredient text in the "text" field
- For durations, include only if explicitly mentioned in the step`;

  const userPrompt = `Extract the recipe from this HTML page. Return ONLY valid JSON, no other text.

Source URL: ${sourceUrl}

HTML Content:
${truncatedHtml}`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: userPrompt,
      },
    ],
    system: systemPrompt,
  });

  // Extract text content from response
  const responseText = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('');

  // Parse JSON response
  try {
    // Try to extract JSON from the response (in case there's extra text)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return transformClaudeResponse(parsed, sourceUrl);
  } catch (parseError) {
    console.error('Failed to parse Claude response:', responseText.substring(0, 500));
    throw new Error('Failed to parse recipe data from page');
  }
}

/**
 * Transform Claude's response to our ImportedRecipeData type
 */
function transformClaudeResponse(
  data: Record<string, unknown>,
  sourceUrl: string
): ImportedRecipeData {
  // Transform ingredients
  const ingredients: ParsedIngredient[] = [];
  const rawIngredients = data.ingredients as Array<Record<string, unknown>> | undefined;

  if (Array.isArray(rawIngredients)) {
    for (const ing of rawIngredients) {
      ingredients.push({
        text: (ing.text as string) || '',
        quantity: typeof ing.quantity === 'number' ? ing.quantity : undefined,
        unit: typeof ing.unit === 'string' ? ing.unit : undefined,
        name: typeof ing.name === 'string' ? ing.name : undefined,
        preparation: typeof ing.preparation === 'string' ? ing.preparation : undefined,
        notes: typeof ing.notes === 'string' ? ing.notes : undefined,
      });
    }
  }

  // Transform instructions
  const instructions: ParsedInstruction[] = [];
  const rawInstructions = data.instructions as Array<Record<string, unknown>> | undefined;

  if (Array.isArray(rawInstructions)) {
    for (let i = 0; i < rawInstructions.length; i++) {
      const inst = rawInstructions[i];
      instructions.push({
        step: typeof inst.step === 'number' ? inst.step : i + 1,
        text: (inst.text as string) || '',
        duration: typeof inst.duration === 'number' ? inst.duration : undefined,
        tip: typeof inst.tip === 'string' ? inst.tip : undefined,
      });
    }
  }

  // Validate and filter dietary tags
  const validDietaryTags: DietaryTag[] = [
    'vegetarian',
    'vegan',
    'gluten-free',
    'dairy-free',
    'nut-free',
    'low-carb',
    'high-protein',
  ];
  const rawTags = data.dietaryTags as string[] | undefined;
  const dietaryTags = Array.isArray(rawTags)
    ? rawTags.filter((tag): tag is DietaryTag => validDietaryTags.includes(tag as DietaryTag))
    : undefined;

  // Validate difficulty
  const validDifficulties: Difficulty[] = ['easy', 'medium', 'hard'];
  const difficulty = validDifficulties.includes(data.difficulty as Difficulty)
    ? (data.difficulty as Difficulty)
    : undefined;

  // Validate meal type
  const validMealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack', 'any'];
  const mealType = validMealTypes.includes(data.mealType as MealType)
    ? (data.mealType as MealType)
    : undefined;

  return {
    title: (data.title as string) || 'Imported Recipe',
    description: typeof data.description === 'string' ? data.description : undefined,
    ingredients,
    instructions,
    prepTime: typeof data.prepTime === 'number' ? data.prepTime : undefined,
    cookTime: typeof data.cookTime === 'number' ? data.cookTime : undefined,
    servings: typeof data.servings === 'number' ? data.servings : undefined,
    sourceUrl,
    imageUrl: typeof data.imageUrl === 'string' ? data.imageUrl : undefined,
    dietaryTags: dietaryTags && dietaryTags.length > 0 ? dietaryTags : undefined,
    difficulty,
    mealType,
    cuisine: typeof data.cuisine === 'string' ? data.cuisine : undefined,
  };
}

export interface ScrapeResult {
  data?: ImportedRecipeData;
  error?: string;
  cached?: boolean;
}

/**
 * Scrape a recipe from a URL
 */
export async function scrapeRecipeFromUrl(
  url: string,
  userId?: string
): Promise<ScrapeResult> {
  // Validate URL
  if (!isValidUrl(url)) {
    return { error: 'Invalid URL format. Please enter a valid HTTP or HTTPS URL.' };
  }

  // Check rate limit (use a default user ID if not provided)
  const rateLimitKey = userId || 'anonymous';
  if (!checkRateLimit(rateLimitKey)) {
    return { error: 'Rate limit exceeded. Please wait a minute before trying again.' };
  }

  // Check cache
  const cacheKey = getCacheKey(url);
  const cached = scrapeCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return { data: cached.data, cached: true };
  }

  try {
    // Fetch the page
    const html = await fetchWithTimeout(url);

    // Check if there's any content
    if (html.length < 500) {
      return { error: 'Page appears to be empty or too short to contain a recipe.' };
    }

    // Extract recipe using Claude
    const recipeData = await extractRecipeWithClaude(html, url);

    // Validate extracted data
    if (!recipeData.title || recipeData.ingredients.length === 0) {
      return { error: 'Could not find a recipe on this page. Please check the URL and try again.' };
    }

    // Cache the result
    scrapeCache.set(cacheKey, { data: recipeData, timestamp: Date.now() });

    return { data: recipeData };
  } catch (error) {
    console.error('Error scraping recipe:', error);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return { error: 'Request timed out. The page took too long to load.' };
      }
      if (error.message.includes('HTTP error')) {
        return { error: `Could not access the page. ${error.message}` };
      }
      if (error.message.includes('Failed to parse')) {
        return { error: 'Could not extract recipe data from the page. The page format may not be supported.' };
      }
      return { error: error.message };
    }

    return { error: 'An unexpected error occurred. Please try again.' };
  }
}

/**
 * Clear the scrape cache (for testing/maintenance)
 */
export async function clearScrapeCache(): Promise<void> {
  scrapeCache.clear();
}

/**
 * Get cache statistics (for monitoring)
 */
export async function getCacheStats(): Promise<{ size: number; keys: string[] }> {
  return {
    size: scrapeCache.size,
    keys: Array.from(scrapeCache.keys()),
  };
}

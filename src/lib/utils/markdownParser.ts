'use strict';

import { marked } from 'marked';
import type {
  ImportedRecipeData,
  ParsedIngredient,
  ParsedInstruction,
  DietaryTag,
  Difficulty,
  MealType,
} from '@/types/recipe';

// Common units for ingredient parsing
const UNITS = [
  'cup', 'cups',
  'tablespoon', 'tablespoons', 'tbsp', 'tbs', 'T',
  'teaspoon', 'teaspoons', 'tsp', 't',
  'pound', 'pounds', 'lb', 'lbs',
  'ounce', 'ounces', 'oz',
  'gram', 'grams', 'g',
  'kilogram', 'kilograms', 'kg',
  'milliliter', 'milliliters', 'ml', 'mL',
  'liter', 'liters', 'l', 'L',
  'pinch', 'pinches',
  'dash', 'dashes',
  'clove', 'cloves',
  'slice', 'slices',
  'piece', 'pieces',
  'bunch', 'bunches',
  'head', 'heads',
  'can', 'cans',
  'jar', 'jars',
  'package', 'packages', 'pkg',
  'bag', 'bags',
  'box', 'boxes',
  'stick', 'sticks',
  'whole',
  'large', 'medium', 'small',
];

// Fraction mappings
const FRACTIONS: Record<string, number> = {
  '½': 0.5,
  '⅓': 0.333,
  '⅔': 0.667,
  '¼': 0.25,
  '¾': 0.75,
  '⅕': 0.2,
  '⅖': 0.4,
  '⅗': 0.6,
  '⅘': 0.8,
  '⅙': 0.167,
  '⅚': 0.833,
  '⅛': 0.125,
  '⅜': 0.375,
  '⅝': 0.625,
  '⅞': 0.875,
};

// Dietary tag keywords
const DIETARY_KEYWORDS: Record<DietaryTag, string[]> = {
  'vegetarian': ['vegetarian', 'veggie', 'meatless'],
  'vegan': ['vegan', 'plant-based', 'plant based'],
  'gluten-free': ['gluten-free', 'gluten free', 'gf'],
  'dairy-free': ['dairy-free', 'dairy free', 'no dairy'],
  'nut-free': ['nut-free', 'nut free', 'no nuts'],
  'low-carb': ['low-carb', 'low carb', 'keto'],
  'high-protein': ['high-protein', 'high protein', 'protein-rich'],
};

// Meal type keywords
const MEAL_KEYWORDS: Record<MealType, string[]> = {
  'breakfast': ['breakfast', 'brunch', 'morning'],
  'lunch': ['lunch', 'midday'],
  'dinner': ['dinner', 'supper', 'evening'],
  'snack': ['snack', 'appetizer', 'side'],
  'any': [],
};

// Difficulty keywords
const DIFFICULTY_KEYWORDS: Record<Difficulty, string[]> = {
  'easy': ['easy', 'simple', 'quick', 'beginner'],
  'medium': ['medium', 'moderate', 'intermediate'],
  'hard': ['hard', 'difficult', 'advanced', 'complex', 'challenging'],
};

interface MarkdownSection {
  title: string;
  content: string;
  level: number;
}

interface FrontMatter {
  [key: string]: string | number | string[] | undefined;
}

/**
 * Parse YAML frontmatter from markdown content
 */
function parseFrontMatter(content: string): { frontMatter: FrontMatter; body: string } {
  const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
  const match = content.match(frontMatterRegex);

  if (!match) {
    return { frontMatter: {}, body: content };
  }

  const frontMatterContent = match[1];
  const body = content.slice(match[0].length);
  const frontMatter: FrontMatter = {};

  // Parse YAML-like key: value pairs
  const lines = frontMatterContent.split('\n');
  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim().toLowerCase();
      let value = line.slice(colonIndex + 1).trim();

      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      // Try to parse as number
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && value === numValue.toString()) {
        frontMatter[key] = numValue;
      } else if (value.startsWith('[') && value.endsWith(']')) {
        // Parse array
        frontMatter[key] = value
          .slice(1, -1)
          .split(',')
          .map((s) => s.trim().replace(/['"]/g, ''));
      } else {
        frontMatter[key] = value;
      }
    }
  }

  return { frontMatter, body };
}

/**
 * Extract sections from markdown content
 */
function extractSections(content: string): MarkdownSection[] {
  const sections: MarkdownSection[] = [];
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const matches = [...content.matchAll(headingRegex)];

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const level = match[1].length;
    const title = match[2].trim();
    const startIndex = match.index! + match[0].length;
    const endIndex = i < matches.length - 1 ? matches[i + 1].index! : content.length;
    const sectionContent = content.slice(startIndex, endIndex).trim();

    sections.push({ title, content: sectionContent, level });
  }

  return sections;
}

/**
 * Parse a quantity string into a number
 */
function parseQuantity(quantityStr: string): number | undefined {
  if (!quantityStr) return undefined;

  let total = 0;
  const parts = quantityStr.trim().split(/\s+/);

  for (const part of parts) {
    // Check for unicode fractions
    if (FRACTIONS[part]) {
      total += FRACTIONS[part];
      continue;
    }

    // Check for text fractions like 1/2
    const fractionMatch = part.match(/^(\d+)\/(\d+)$/);
    if (fractionMatch) {
      const numerator = parseInt(fractionMatch[1], 10);
      const denominator = parseInt(fractionMatch[2], 10);
      if (denominator !== 0) {
        total += numerator / denominator;
      }
      continue;
    }

    // Check for range (take the first value)
    const rangeMatch = part.match(/^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)$/);
    if (rangeMatch) {
      total += parseFloat(rangeMatch[1]);
      continue;
    }

    // Regular number
    const num = parseFloat(part);
    if (!isNaN(num)) {
      total += num;
    }
  }

  return total > 0 ? total : undefined;
}

/**
 * Parse an ingredient line into structured data
 */
function parseIngredientLine(line: string): ParsedIngredient {
  // Remove list markers and trim
  const cleanLine = line.replace(/^[-*•]\s*/, '').trim();

  // Remove checkbox markers if present
  const withoutCheckbox = cleanLine.replace(/^\[[ x]\]\s*/i, '');

  const result: ParsedIngredient = {
    text: withoutCheckbox,
  };

  // Try to extract quantity, unit, name, and preparation
  // Pattern: [quantity] [unit] [name][, preparation]
  const ingredientPattern = /^([\d\s½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞/.,-]+)?\s*([a-zA-Z]+(?:\s+[a-zA-Z]+)?)?\s+(.+)$/;
  const match = withoutCheckbox.match(ingredientPattern);

  if (match) {
    const [, quantityPart, potentialUnit, rest] = match;

    // Check if potentialUnit is actually a unit
    const unitLower = potentialUnit?.toLowerCase();
    const isUnit = unitLower && UNITS.includes(unitLower);

    if (quantityPart) {
      result.quantity = parseQuantity(quantityPart);
    }

    if (isUnit) {
      result.unit = potentialUnit;
      // Parse name and preparation from rest
      const nameParts = rest.split(/,\s*/);
      result.name = nameParts[0].trim();
      if (nameParts.length > 1) {
        result.preparation = nameParts.slice(1).join(', ').trim();
      }
    } else if (potentialUnit && rest) {
      // potentialUnit is actually part of the ingredient name
      const fullName = `${potentialUnit} ${rest}`;
      const nameParts = fullName.split(/,\s*/);
      result.name = nameParts[0].trim();
      if (nameParts.length > 1) {
        result.preparation = nameParts.slice(1).join(', ').trim();
      }
    }
  }

  // Handle parenthetical notes
  const noteMatch = result.name?.match(/\(([^)]+)\)/);
  if (noteMatch) {
    result.notes = noteMatch[1];
    result.name = result.name!.replace(/\s*\([^)]+\)/, '').trim();
  }

  // If we couldn't parse structured data, try simpler approach
  if (!result.name) {
    // Look for simple pattern: quantity name
    const simpleMatch = withoutCheckbox.match(/^([\d\s½⅓⅔¼¾]+)\s+(.+)$/);
    if (simpleMatch) {
      result.quantity = parseQuantity(simpleMatch[1]);
      const nameParts = simpleMatch[2].split(/,\s*/);
      result.name = nameParts[0].trim();
      if (nameParts.length > 1) {
        result.preparation = nameParts.slice(1).join(', ').trim();
      }
    } else {
      // Just use the whole line as the name
      result.name = withoutCheckbox;
    }
  }

  return result;
}

/**
 * Parse ingredients from a section content
 */
function parseIngredients(content: string): ParsedIngredient[] {
  const ingredients: ParsedIngredient[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    // Skip empty lines, subheadings, and non-list items
    if (!trimmed || trimmed.startsWith('#') || (!trimmed.match(/^[-*•]/) && !trimmed.match(/^\[[ x]\]/i))) {
      // Check if it's a plain text ingredient (no bullet)
      if (trimmed && !trimmed.startsWith('#') && trimmed.length > 2 && trimmed.length < 200) {
        // Likely an ingredient without bullet point
        const parsed = parseIngredientLine(trimmed);
        if (parsed.name) {
          ingredients.push(parsed);
        }
      }
      continue;
    }

    const parsed = parseIngredientLine(trimmed);
    ingredients.push(parsed);
  }

  return ingredients;
}

/**
 * Parse instructions from a section content
 */
function parseInstructions(content: string): ParsedInstruction[] {
  const instructions: ParsedInstruction[] = [];
  const lines = content.split('\n');
  let stepNumber = 1;

  for (const line of lines) {
    const trimmed = line.trim();
    // Skip empty lines and subheadings
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    // Check for numbered list item
    const numberedMatch = trimmed.match(/^(\d+)[.)]\s*(.+)$/);
    if (numberedMatch) {
      const step = parseInt(numberedMatch[1], 10);
      const text = numberedMatch[2].trim();
      instructions.push({
        step: step || stepNumber,
        text,
        duration: extractDuration(text),
        tip: extractTip(text),
      });
      stepNumber = (step || stepNumber) + 1;
      continue;
    }

    // Check for bullet point list item
    const bulletMatch = trimmed.match(/^[-*•]\s*(.+)$/);
    if (bulletMatch) {
      const text = bulletMatch[1].trim();
      instructions.push({
        step: stepNumber,
        text,
        duration: extractDuration(text),
        tip: extractTip(text),
      });
      stepNumber++;
      continue;
    }

    // Plain text paragraph (might be a step)
    if (trimmed.length > 10) {
      instructions.push({
        step: stepNumber,
        text: trimmed,
        duration: extractDuration(trimmed),
        tip: extractTip(trimmed),
      });
      stepNumber++;
    }
  }

  return instructions;
}

/**
 * Extract duration in minutes from text
 */
function extractDuration(text: string): number | undefined {
  // Match patterns like "5 minutes", "10-15 min", "1 hour"
  const minuteMatch = text.match(/(\d+)(?:-\d+)?\s*(?:minutes?|mins?)/i);
  if (minuteMatch) {
    return parseInt(minuteMatch[1], 10);
  }

  const hourMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)/i);
  if (hourMatch) {
    return Math.round(parseFloat(hourMatch[1]) * 60);
  }

  return undefined;
}

/**
 * Extract tip from text (usually in parentheses or after "Tip:")
 */
function extractTip(text: string): string | undefined {
  const tipMatch = text.match(/(?:Tip:|Note:|Hint:)\s*(.+?)(?:\.|$)/i);
  if (tipMatch) {
    return tipMatch[1].trim();
  }

  return undefined;
}

/**
 * Extract time in minutes from text
 */
function extractTime(text: string, keywords: string[]): number | undefined {
  const lowerText = text.toLowerCase();

  for (const keyword of keywords) {
    // Match patterns like "prep time: 10 minutes" or "prep: 10 min"
    const pattern = new RegExp(
      `${keyword}[:\\s]*(?:about\\s*)?(\\d+)(?:-(\\d+))?\\s*(?:minutes?|mins?|hours?|hrs?)`,
      'i'
    );
    const match = lowerText.match(pattern);
    if (match) {
      const value = parseInt(match[1], 10);
      const isHours = /hours?|hrs?/i.test(match[0]);
      return isHours ? value * 60 : value;
    }
  }

  return undefined;
}

/**
 * Extract servings from text
 */
function extractServings(text: string): number | undefined {
  const lowerText = text.toLowerCase();

  // Match patterns like "serves: 4", "servings: 4-6", "yield: 8 portions"
  const patterns = [
    /(?:serves?|servings?|yield)[:\s]*(?:about\s*)?(\d+)(?:-\d+)?/i,
    /(?:makes?|produces?)[:\s]*(\d+)(?:-\d+)?(?:\s+(?:servings?|portions?))?/i,
    /(\d+)\s*(?:servings?|portions?)/i,
  ];

  for (const pattern of patterns) {
    const match = lowerText.match(pattern);
    if (match) {
      return parseInt(match[1], 10);
    }
  }

  return undefined;
}

/**
 * Detect dietary tags from text
 */
function detectDietaryTags(text: string): DietaryTag[] {
  const lowerText = text.toLowerCase();
  const tags: DietaryTag[] = [];

  for (const [tag, keywords] of Object.entries(DIETARY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        tags.push(tag as DietaryTag);
        break;
      }
    }
  }

  return tags;
}

/**
 * Detect meal type from text
 */
function detectMealType(text: string): MealType | undefined {
  const lowerText = text.toLowerCase();

  for (const [type, keywords] of Object.entries(MEAL_KEYWORDS)) {
    if (type === 'any') continue;
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        return type as MealType;
      }
    }
  }

  return undefined;
}

/**
 * Detect difficulty from text
 */
function detectDifficulty(text: string): Difficulty | undefined {
  const lowerText = text.toLowerCase();

  for (const [diff, keywords] of Object.entries(DIFFICULTY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        return diff as Difficulty;
      }
    }
  }

  return undefined;
}

/**
 * Find a section by common names
 */
function findSection(sections: MarkdownSection[], names: string[]): MarkdownSection | undefined {
  const lowerNames = names.map((n) => n.toLowerCase());
  return sections.find((s) => lowerNames.some((n) => s.title.toLowerCase().includes(n)));
}

/**
 * Parse a markdown string into structured recipe data
 */
export function parseRecipeMarkdown(content: string): ImportedRecipeData {
  // Parse frontmatter if present
  const { frontMatter, body } = parseFrontMatter(content);

  // Extract sections
  const sections = extractSections(body);

  // Find title - first H1, or first heading, or frontmatter title
  let title = frontMatter.title as string | undefined;
  if (!title) {
    const titleSection = sections.find((s) => s.level === 1) || sections[0];
    title = titleSection?.title || 'Untitled Recipe';
  }

  // Find description - text before first section, or frontmatter description
  let description = frontMatter.description as string | undefined;
  if (!description) {
    const firstHeadingIndex = body.search(/^#/m);
    if (firstHeadingIndex > 0) {
      description = body.slice(0, firstHeadingIndex).trim();
    }
  }

  // Find ingredients section
  const ingredientsSection = findSection(sections, [
    'ingredients',
    'what you need',
    'you will need',
    'shopping list',
  ]);
  const ingredients = ingredientsSection
    ? parseIngredients(ingredientsSection.content)
    : [];

  // Find instructions section
  const instructionsSection = findSection(sections, [
    'instructions',
    'directions',
    'method',
    'steps',
    'how to make',
    'preparation',
    'procedure',
  ]);
  const instructions = instructionsSection
    ? parseInstructions(instructionsSection.content)
    : [];

  // Extract metadata from frontmatter or body
  const fullText = `${title} ${description || ''} ${body}`;

  const prepTime =
    (frontMatter.preptime as number) ||
    (frontMatter['prep time'] as number) ||
    (frontMatter.prep as number) ||
    extractTime(fullText, ['prep', 'preparation', 'prep time']);

  const cookTime =
    (frontMatter.cooktime as number) ||
    (frontMatter['cook time'] as number) ||
    (frontMatter.cook as number) ||
    extractTime(fullText, ['cook', 'cooking', 'cook time', 'bake', 'roast']);

  const servings =
    (frontMatter.servings as number) ||
    (frontMatter.serves as number) ||
    (frontMatter.yield as number) ||
    extractServings(fullText);

  // Detect tags
  const dietaryTags =
    (frontMatter.tags as string[] | undefined)?.filter((t): t is DietaryTag =>
      Object.keys(DIETARY_KEYWORDS).includes(t)
    ) || detectDietaryTags(fullText);

  const mealType =
    (frontMatter.meal as MealType | undefined) ||
    (frontMatter['meal type'] as MealType | undefined) ||
    detectMealType(fullText);

  const difficulty =
    (frontMatter.difficulty as Difficulty | undefined) ||
    detectDifficulty(fullText);

  const cuisine =
    (frontMatter.cuisine as string | undefined) ||
    (frontMatter.origin as string | undefined);

  const imageUrl = frontMatter.image as string | undefined;

  return {
    title,
    description: description || undefined,
    ingredients,
    instructions,
    prepTime,
    cookTime,
    servings,
    dietaryTags: dietaryTags.length > 0 ? dietaryTags : undefined,
    mealType,
    difficulty,
    cuisine,
    imageUrl,
  };
}

/**
 * Parse multiple markdown files and return array of recipe data
 */
export function parseMultipleRecipes(
  files: { name: string; content: string }[]
): { data: ImportedRecipeData; fileName: string; error?: string }[] {
  return files.map(({ name, content }) => {
    try {
      const data = parseRecipeMarkdown(content);
      return { data, fileName: name };
    } catch (error) {
      return {
        data: {
          title: name.replace(/\.md$/i, ''),
          ingredients: [],
          instructions: [],
        },
        fileName: name,
        error: error instanceof Error ? error.message : 'Failed to parse recipe',
      };
    }
  });
}

/**
 * Validate parsed recipe data
 */
export function validateRecipeData(data: ImportedRecipeData): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!data.title || data.title === 'Untitled Recipe') {
    errors.push('Recipe title is required');
  }

  if (data.ingredients.length === 0) {
    errors.push('At least one ingredient is required');
  }

  if (data.instructions.length === 0) {
    errors.push('At least one instruction step is required');
  }

  // Warnings for missing optional fields
  if (!data.description) {
    warnings.push('No description found');
  }

  if (!data.prepTime) {
    warnings.push('Prep time not specified');
  }

  if (!data.cookTime) {
    warnings.push('Cook time not specified');
  }

  if (!data.servings) {
    warnings.push('Servings not specified');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

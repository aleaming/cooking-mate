// Ingredient Category Inference Utility
// Infers category from ingredient name for user-imported recipes

import type { IngredientCategory } from '@/types';

// Keywords mapped to each category for inference
const CATEGORY_KEYWORDS: Record<IngredientCategory, string[]> = {
  produce: [
    'tomato', 'onion', 'garlic', 'pepper', 'lettuce', 'spinach', 'carrot',
    'cucumber', 'zucchini', 'eggplant', 'lemon', 'lime', 'orange', 'apple',
    'berry', 'strawberry', 'blueberry', 'avocado', 'potato', 'celery',
    'broccoli', 'cauliflower', 'cabbage', 'kale', 'arugula', 'mushroom',
    'asparagus', 'artichoke', 'beet', 'radish', 'squash', 'pumpkin',
    'grape', 'banana', 'mango', 'pineapple', 'peach', 'pear', 'plum',
    'cherry', 'fig', 'date', 'pomegranate', 'melon', 'watermelon',
    'ginger', 'scallion', 'shallot', 'leek', 'fennel', 'chard',
  ],
  dairy: [
    'milk', 'cheese', 'yogurt', 'cream', 'butter', 'feta', 'parmesan',
    'mozzarella', 'ricotta', 'cottage', 'cheddar', 'brie', 'goat cheese',
    'halloumi', 'labneh', 'kefir', 'sour cream', 'creme fraiche',
    'mascarpone', 'gruyere', 'pecorino', 'manchego',
  ],
  protein: [
    'chicken', 'beef', 'pork', 'lamb', 'turkey', 'egg', 'tofu', 'tempeh',
    'duck', 'veal', 'bacon', 'sausage', 'ham', 'prosciutto', 'ground meat',
    'steak', 'roast', 'chop', 'thigh', 'breast', 'wing', 'leg',
    'seitan', 'edamame', 'lentil', 'bean', 'chickpea', 'hummus',
  ],
  seafood: [
    'fish', 'salmon', 'shrimp', 'tuna', 'cod', 'tilapia', 'scallop',
    'mussel', 'clam', 'oyster', 'crab', 'lobster', 'squid', 'calamari',
    'octopus', 'anchovy', 'sardine', 'mackerel', 'halibut', 'trout',
    'bass', 'snapper', 'mahi', 'swordfish', 'prawn', 'crawfish',
  ],
  grains: [
    'rice', 'pasta', 'bread', 'flour', 'oat', 'quinoa', 'couscous',
    'bulgur', 'pita', 'tortilla', 'noodle', 'barley', 'farro', 'polenta',
    'cornmeal', 'wheat', 'rye', 'millet', 'buckwheat', 'orzo', 'risotto',
    'spaghetti', 'penne', 'linguine', 'fettuccine', 'macaroni', 'lasagna',
    'cracker', 'breadcrumb', 'panko', 'croissant', 'bagel', 'baguette',
  ],
  'oils-vinegars': [
    'oil', 'olive', 'vinegar', 'balsamic', 'coconut oil', 'sesame oil',
    'vegetable oil', 'canola', 'avocado oil', 'sunflower oil', 'ghee',
    'red wine vinegar', 'white wine vinegar', 'apple cider vinegar',
    'rice vinegar', 'sherry vinegar', 'champagne vinegar',
  ],
  'herbs-spices': [
    'basil', 'oregano', 'thyme', 'rosemary', 'cumin', 'paprika',
    'cinnamon', 'salt', 'pepper', 'parsley', 'cilantro', 'mint', 'dill',
    'sage', 'tarragon', 'chive', 'bay leaf', 'coriander', 'turmeric',
    'ginger', 'nutmeg', 'clove', 'cardamom', 'saffron', 'sumac',
    'zaatar', 'harissa', 'cayenne', 'chili', 'curry', 'allspice',
    'fennel seed', 'mustard seed', 'caraway', 'anise', 'vanilla',
  ],
  'nuts-seeds': [
    'almond', 'walnut', 'pistachio', 'pine nut', 'sesame', 'tahini',
    'cashew', 'pecan', 'hazelnut', 'macadamia', 'peanut', 'chestnut',
    'sunflower seed', 'pumpkin seed', 'chia', 'flax', 'hemp seed',
    'poppy seed', 'nut butter', 'almond butter', 'peanut butter',
  ],
  pantry: [
    'honey', 'sugar', 'stock', 'broth', 'sauce', 'paste', 'can', 'dried',
    'tomato paste', 'tomato sauce', 'soy sauce', 'fish sauce', 'worcestershire',
    'maple syrup', 'molasses', 'agave', 'jam', 'jelly', 'preserve',
    'mustard', 'ketchup', 'mayonnaise', 'hot sauce', 'sriracha',
    'capers', 'olive', 'relish', 'sun-dried', 'roasted',
    'cornstarch', 'baking powder', 'baking soda', 'yeast', 'gelatin',
    'coconut milk', 'condensed milk', 'evaporated milk',
  ],
  beverages: [
    'wine', 'juice', 'water', 'tea', 'coffee', 'beer', 'cider',
    'sparkling', 'soda', 'lemonade', 'smoothie', 'shake',
    'espresso', 'matcha', 'chai',
  ],
  other: [],
};

/**
 * Infer ingredient category from ingredient name
 * Uses keyword matching to determine the most likely category
 */
export function inferIngredientCategory(name: string): IngredientCategory {
  if (!name) return 'other';

  const lower = name.toLowerCase();

  // Check each category's keywords
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (category === 'other') continue;

    // Check if any keyword matches
    if (keywords.some(keyword => lower.includes(keyword))) {
      return category as IngredientCategory;
    }
  }

  return 'other';
}

/**
 * Batch infer categories for multiple ingredients
 */
export function inferIngredientCategories(
  ingredients: { name?: string; text?: string }[]
): IngredientCategory[] {
  return ingredients.map(ing =>
    inferIngredientCategory(ing.name || ing.text || '')
  );
}

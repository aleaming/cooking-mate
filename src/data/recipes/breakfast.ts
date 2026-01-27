import { Recipe } from '@/types';

export const breakfastRecipes: Recipe[] = [
  {
    id: 'greek-yogurt-parfait',
    slug: 'greek-yogurt-parfait-honey-walnuts',
    name: 'Greek Yogurt Parfait with Honey & Walnuts',
    description:
      'A classic Mediterranean breakfast combining creamy Greek yogurt with local honey, crunchy walnuts, and fresh seasonal berries.',
    imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&q=80',
    prepTimeMinutes: 5,
    cookTimeMinutes: 0,
    totalTimeMinutes: 5,
    servings: 1,
    mealType: 'breakfast',
    cuisine: 'Mediterranean',
    dietaryTags: ['vegetarian', 'gluten-free'],
    difficulty: 'easy',
    ingredients: [
      { id: '1', ingredientId: 'greek-yogurt', name: 'Greek yogurt', category: 'dairy', quantity: 1, unit: 'cup', notes: 'full-fat preferred' },
      { id: '2', ingredientId: 'honey', name: 'Honey', category: 'pantry', quantity: 2, unit: 'tbsp', notes: 'raw, local preferred' },
      { id: '3', ingredientId: 'walnuts', name: 'Walnuts', category: 'nuts-seeds', quantity: 0.25, unit: 'cup', preparation: 'roughly chopped' },
      { id: '4', ingredientId: 'mixed-berries', name: 'Fresh berries', category: 'produce', quantity: 0.5, unit: 'cup' },
      { id: '5', ingredientId: 'cinnamon', name: 'Cinnamon', category: 'herbs-spices', quantity: 0.25, unit: 'tsp', notes: 'optional' },
    ],
    instructions: [
      { step: 1, text: 'Spoon the Greek yogurt into a serving bowl or jar.', duration: 1 },
      { step: 2, text: 'Drizzle the honey over the yogurt in a decorative pattern.', duration: 1 },
      { step: 3, text: 'Scatter the chopped walnuts and fresh berries over the top.', duration: 1 },
      { step: 4, text: 'Sprinkle with cinnamon if desired and serve immediately.', duration: 1, tip: 'For a make-ahead version, layer in a jar and refrigerate overnight.' },
    ],
    tips: 'Swap walnuts for almonds or pistachios. Try different seasonal fruits like figs, pomegranate seeds, or sliced peaches.',
    nutrition: { calories: 380, protein: 20, carbohydrates: 35, fat: 18, fiber: 3, sugar: 28 },
    isFeatured: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

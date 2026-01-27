import { Recipe } from '@/types';

export const lunchRecipes: Recipe[] = [
  {
    id: 'greek-salad',
    slug: 'classic-greek-salad',
    name: 'Classic Greek Salad',
    description:
      'Crisp cucumbers, ripe tomatoes, red onion, and Kalamata olives topped with creamy feta and dressed with olive oil and oregano.',
    imageUrl: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&q=80',
    prepTimeMinutes: 15,
    cookTimeMinutes: 0,
    totalTimeMinutes: 15,
    servings: 4,
    mealType: 'lunch',
    cuisine: 'Mediterranean',
    dietaryTags: ['vegetarian', 'gluten-free'],
    difficulty: 'easy',
    ingredients: [
      { id: '1', ingredientId: 'cucumber', name: 'English cucumber', category: 'produce', quantity: 1, unit: 'large', preparation: 'chunked' },
      { id: '2', ingredientId: 'tomatoes', name: 'Ripe tomatoes', category: 'produce', quantity: 4, unit: 'medium', preparation: 'wedged' },
      { id: '3', ingredientId: 'red-onion', name: 'Red onion', category: 'produce', quantity: 0.5, unit: 'medium', preparation: 'thinly sliced' },
      { id: '4', ingredientId: 'kalamata-olives', name: 'Kalamata olives', category: 'pantry', quantity: 0.5, unit: 'cup' },
      { id: '5', ingredientId: 'feta', name: 'Feta cheese', category: 'dairy', quantity: 200, unit: 'g', preparation: 'block or crumbled' },
      { id: '6', ingredientId: 'olive-oil', name: 'Extra virgin olive oil', category: 'oils-vinegars', quantity: 4, unit: 'tbsp' },
      { id: '7', ingredientId: 'red-wine-vinegar', name: 'Red wine vinegar', category: 'oils-vinegars', quantity: 1, unit: 'tbsp' },
      { id: '8', ingredientId: 'oregano', name: 'Dried oregano', category: 'herbs-spices', quantity: 1, unit: 'tsp' },
    ],
    instructions: [
      { step: 1, text: 'Cut cucumber into thick half-moons and tomatoes into wedges. Place in a large bowl.' },
      { step: 2, text: 'Add thinly sliced red onion and Kalamata olives to the bowl.' },
      { step: 3, text: 'Drizzle with olive oil and red wine vinegar. Sprinkle with oregano, salt, and pepper.' },
      { step: 4, text: 'Toss gently to combine, keeping the vegetables chunky.' },
      { step: 5, text: 'Top with feta cheese - either a whole slab or crumbled, as preferred.' },
    ],
    tips: 'For the most authentic version, serve the feta as a single slab on top. Let the salad sit for 5 minutes before serving to let flavors meld.',
    nutrition: { calories: 285, protein: 9, carbohydrates: 14, fat: 23, fiber: 3, sugar: 8 },
    isFeatured: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

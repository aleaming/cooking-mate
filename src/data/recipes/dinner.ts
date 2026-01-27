import { Recipe } from '@/types';

export const dinnerRecipes: Recipe[] = [
  {
    id: 'grilled-salmon-lemon-dill',
    slug: 'grilled-mediterranean-salmon',
    name: 'Grilled Mediterranean Salmon with Lemon Dill',
    description:
      'Perfectly grilled salmon fillet with a bright lemon-dill sauce, served with roasted vegetables.',
    imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&q=80',
    prepTimeMinutes: 10,
    cookTimeMinutes: 15,
    totalTimeMinutes: 25,
    servings: 4,
    mealType: 'dinner',
    cuisine: 'Mediterranean',
    dietaryTags: ['gluten-free', 'dairy-free', 'high-protein'],
    difficulty: 'easy',
    ingredients: [
      { id: '1', ingredientId: 'salmon', name: 'Salmon fillets', category: 'seafood', quantity: 4, unit: 'pieces', notes: '6 oz each' },
      { id: '2', ingredientId: 'olive-oil', name: 'Olive oil', category: 'oils-vinegars', quantity: 3, unit: 'tbsp' },
      { id: '3', ingredientId: 'lemon', name: 'Lemon', category: 'produce', quantity: 2, unit: 'medium' },
      { id: '4', ingredientId: 'dill', name: 'Fresh dill', category: 'herbs-spices', quantity: 3, unit: 'tbsp', preparation: 'chopped' },
      { id: '5', ingredientId: 'garlic', name: 'Garlic', category: 'produce', quantity: 3, unit: 'cloves', preparation: 'minced' },
      { id: '6', ingredientId: 'capers', name: 'Capers', category: 'pantry', quantity: 2, unit: 'tbsp' },
      { id: '7', ingredientId: 'asparagus', name: 'Asparagus', category: 'produce', quantity: 1, unit: 'lb', preparation: 'trimmed' },
    ],
    instructions: [
      { step: 1, text: 'Preheat grill to medium-high heat. Pat salmon dry and brush with 1 tbsp olive oil. Season with salt and pepper.' },
      { step: 2, text: 'Grill salmon skin-side down for 4-5 minutes, then flip and cook for 3-4 minutes more until cooked through.' },
      { step: 3, text: 'While salmon cooks, toss asparagus with 1 tbsp olive oil and grill for 3-4 minutes until tender-crisp.' },
      { step: 4, text: 'Make sauce by combining remaining olive oil, juice of 1 lemon, dill, garlic, and capers.' },
      { step: 5, text: 'Plate salmon over asparagus, drizzle with lemon-dill sauce, and garnish with lemon slices.' },
    ],
    tips: 'For crispy skin, start skin-side down and dont move the fish until ready to flip. Internal temp should reach 145°F.',
    nutrition: { calories: 420, protein: 38, carbohydrates: 8, fat: 26, fiber: 3, sugar: 2 },
    isFeatured: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

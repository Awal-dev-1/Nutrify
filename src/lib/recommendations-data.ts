import type { Food } from './data';

export interface Recommendation extends Food {
  reason: string;
  recipe: {
    ingredients: string[];
    instructions: string[];
  };
}

export const mockRecommendations: Recommendation[] = [
  {
    id: 'kontomire-stew',
    name: 'Kontomire Stew with Boiled Yam',
    category: 'Local Dish',
    image: 'https://picsum.photos/seed/kontomire/400/300',
    imageHint: 'kontomire stew',
    calories: 350,
    protein: 15,
    carbs: 45,
    fat: 12,
    description: 'A nutritious Ghanaian stew made from cocoyam leaves, rich in vitamins and iron.',
    nutrients: {
      fiber: 8,
      sugar: 4,
      iron: 4.5,
      calcium: 150,
      vitaminA: 600,
      vitaminC: 50,
      sodium: 400,
    },
    tags: ['High Iron', 'High Fiber', 'Local'],
    reason: 'Excellent source of iron to address your recent deficiency. It is also high in Vitamin A.',
    recipe: {
      ingredients: [
        '1 bunch Kontomire (cocoyam leaves)',
        '1 lb yam, peeled and cut',
        '2 medium onions, chopped',
        '2 tomatoes, blended',
        '1/4 cup palm oil',
        '1/2 lb smoked fish or meat',
        '2 tbsp ground melon seeds (egusi)',
        'Salt and pepper to taste',
      ],
      instructions: [
        'Wash and shred the kontomire leaves.',
        'Boil the yam until tender.',
        'In a pot, heat palm oil and sauté one onion until soft.',
        'Add blended tomatoes and cook for 10 minutes.',
        'Add smoked fish/meat, egusi, and cook for another 15 minutes.',
        'Stir in the kontomire leaves and the second chopped onion. Simmer for 10 minutes.',
        'Season with salt and pepper. Serve with boiled yam.',
      ],
    },
  },
  {
    id: 'chicken-veggie-stir-fry',
    name: 'Chicken & Veggie Stir-fry',
    category: 'Protein',
    image: 'https://picsum.photos/seed/stirfry/400/300',
    imageHint: 'chicken stirfry',
    calories: 400,
    protein: 35,
    carbs: 20,
    fat: 18,
    description: 'A quick and colorful stir-fry packed with lean protein and fresh vegetables.',
    nutrients: {
      fiber: 5,
      sugar: 8,
      iron: 2,
      calcium: 50,
      vitaminA: 300,
      vitaminC: 100,
      sodium: 500,
    },
    tags: ['High Protein', 'Low Carb'],
    reason: 'A great high-protein, low-carb option to help you meet your protein goals while managing calories.',
     recipe: {
      ingredients: [
        '200g chicken breast, sliced',
        '1 cup broccoli florets',
        '1 red bell pepper, sliced',
        '1 carrot, julienned',
        '2 tbsp soy sauce',
        '1 tbsp sesame oil',
        '1 clove garlic, minced',
        '1 tsp ginger, grated'
      ],
      instructions: [
        'Heat sesame oil in a wok or large pan over high heat.',
        'Add chicken and cook until browned.',
        'Add garlic and ginger, stir-fry for 30 seconds.',
        'Add broccoli, bell pepper, and carrot. Stir-fry for 3-5 minutes until vegetables are tender-crisp.',
        'Pour in soy sauce and toss to combine.',
        'Serve immediately.'
      ]
    }
  },
  {
    id: 'oatmeal-with-berries',
    name: 'Oatmeal with Berries & Nuts',
    category: 'Grains',
    image: 'https://picsum.photos/seed/oatmeal/400/300',
    imageHint: 'oatmeal berries',
    calories: 320,
    protein: 10,
    carbs: 50,
    fat: 10,
    description: 'A hearty and fiber-rich breakfast to kickstart your day with sustained energy.',
    nutrients: {
        fiber: 9,
        sugar: 12,
        iron: 2.5,
        calcium: 40,
        vitaminA: 10,
        vitaminC: 25,
        sodium: 5
    },
    tags: ['High Fiber', 'Vegan', 'Energy Boosting'],
    reason: 'Boosts your fiber intake and provides long-lasting energy for the morning.',
    recipe: {
      ingredients: [
        '1/2 cup rolled oats',
        '1 cup water or almond milk',
        '1/2 cup mixed berries (fresh or frozen)',
        '1 tbsp chopped almonds or walnuts',
        '1 tsp honey or maple syrup (optional)'
      ],
      instructions: [
        'In a small saucepan, bring water or milk to a boil.',
        'Stir in oats and reduce heat to a simmer.',
        'Cook for 5-7 minutes, stirring occasionally, until oats are tender and have absorbed the liquid.',
        'Remove from heat and top with berries, nuts, and a drizzle of honey if desired.',
        'Serve warm.'
      ]
    }
  }
];

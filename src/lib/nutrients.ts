
export const MICRONUTRIENT_KEYS = [
    "fiber", "sugar", "sodium", "calcium", "iron", "potassium", "magnesium", "zinc",
    "phosphorus", "iodine", "selenium", "copper", "manganese", "chromium", "molybdenum", "chloride",
    "vitaminA", "vitaminC", "vitaminD", "vitaminE", "vitaminK", "vitaminB1", "vitaminB2",
    "vitaminB3", "vitaminB5", "vitaminB6", "vitaminB7", "folate", "vitaminB12"
] as const;

export type MicronutrientKey = typeof MICRONUTRIENT_KEYS[number];

export const VITAMIN_KEYS: readonly MicronutrientKey[] = [
  "vitaminA", "vitaminC", "vitaminD", "vitaminE", "vitaminK", "vitaminB1", "vitaminB2",
  "vitaminB3", "vitaminB5", "vitaminB6", "vitaminB7", "folate", "vitaminB12"
];

export const MINERAL_KEYS: readonly MicronutrientKey[] = [
  "calcium", "iron", "potassium", "magnesium", "zinc", "phosphorus", "iodine",
  "selenium", "copper", "manganese", "chromium", "molybdenum", "chloride", "sodium"
];

export const NUTRIENT_GOAL_KEYS = [
    'fiberTargetG', 'sugarTargetG', 'sodiumTargetMg', 'calciumTargetMg', 'ironTargetMg', 'potassiumTargetMg', 'magnesiumTargetMg', 'zincTargetMg', 'phosphorusTargetMg', 'iodineTargetMcg', 'seleniumTargetMcg', 'copperTargetMg', 'manganeseTargetMg', 'chromiumTargetMcg', 'molybdenumTargetMcg', 'chlorideTargetMg', 'vitaminATargetMcg', 'vitaminCTargetMg', 'vitaminDTargetMcg', 'vitaminETargetMg', 'vitaminKTargetMcg', 'vitaminB1TargetMg', 'vitaminB2TargetMg', 'vitaminB3TargetMg', 'vitaminB5TargetMg', 'vitaminB6TargetMg', 'vitaminB7TargetMcg', 'folateTargetMcg', 'vitaminB12TargetMcg'
] as const;


export const NUTRIENT_LABELS: Record<MicronutrientKey, string> = {
  fiber: 'Fiber',
  sugar: 'Sugar',
  sodium: 'Sodium',
  calcium: 'Calcium',
  iron: 'Iron',
  potassium: 'Potassium',
  magnesium: 'Magnesium',
  zinc: 'Zinc',
  phosphorus: 'Phosphorus',
  iodine: 'Iodine',
  selenium: 'Selenium',
  copper: 'Copper',
  manganese: 'Manganese',
  chromium: 'Chromium',
  molybdenum: 'Molybdenum',
  chloride: 'Chloride',
  vitaminA: 'Vitamin A',
  vitaminC: 'Vitamin C',
  vitaminD: 'Vitamin D',
  vitaminE: 'Vitamin E',
  vitaminK: 'Vitamin K',
  vitaminB1: 'Thiamine (B1)',
  vitaminB2: 'Riboflavin (B2)',
  vitaminB3: 'Niacin (B3)',
  vitaminB5: 'Pantothenic Acid (B5)',
  vitaminB6: 'Vitamin B6',
  vitaminB7: 'Biotin (B7)',
  folate: 'Folate (B9)',
  vitaminB12: 'Vitamin B12',
};

export const NUTRIENT_DESCRIPTIONS: Partial<Record<MicronutrientKey, string>> = {
  iron: 'Essential for producing hemoglobin, which carries oxygen in your blood.',
  calcium: 'Crucial for strong bones and teeth, muscle function, and nerve signaling.',
  magnesium: 'Supports muscle and nerve function, energy production, and bone health.',
  vitaminD: 'Helps your body absorb calcium and supports immune function.',
  vitaminA: 'Important for vision, immune function, and cell growth.',
  vitaminC: 'An antioxidant that helps protect cells and maintain healthy skin and tissues.',
  potassium: 'Helps maintain normal levels of fluid inside our cells and supports blood pressure.',
  zinc: 'Important for immune function, wound healing, and senses of smell and taste.',
  vitaminB12: 'Crucial for nerve function and the production of DNA and red blood cells.',
};


export const NUTRIENT_UNITS: Record<MicronutrientKey, string> = {
  fiber: 'g',
  sugar: 'g',
  sodium: 'mg',
  calcium: 'mg',
  iron: 'mg',
  potassium: 'mg',
  magnesium: 'mg',
  zinc: 'mg',
  phosphorus: 'mg',
  iodine: 'µg',
  selenium: 'µg',
  copper: 'mg',
  manganese: 'mg',
  chromium: 'µg',
  molybdenum: 'µg',
  chloride: 'mg',
  vitaminA: 'µg',
  vitaminC: 'mg',
  vitaminD: 'µg',
  vitaminE: 'mg',
  vitaminK: 'µg',
  vitaminB1: 'mg',
  vitaminB2: 'mg',
  vitaminB3: 'mg',
  vitaminB5: 'mg',
  vitaminB6: 'mg',
  vitaminB7: 'µg',
  folate: 'µg',
  vitaminB12: 'µg',
};

export const NUTRIENT_DRV: Partial<Record<MicronutrientKey, number>> = {
  fiber: 28, // g
  sugar: 50, // g (this is a limit, not a goal)
  sodium: 2300, // mg (limit)
  calcium: 1300, // mg
  iron: 18, // mg
  potassium: 4700, // mg
  magnesium: 420, // mg
  zinc: 11, // mg
  phosphorus: 1250, // mg
  iodine: 150, // µg
  selenium: 55, // µg
  copper: 0.9, // mg
  manganese: 2.3, // mg
  chromium: 35, // µg
  molybdenum: 45, // µg
  chloride: 2300, // mg
  vitaminA: 900, // µg RAE
  vitaminC: 90, // mg
  vitaminD: 20, // µg
  vitaminE: 15, // mg
  vitaminK: 120, // µg
  vitaminB1: 1.2, // mg
  vitaminB2: 1.3, // mg
  vitaminB3: 16, // mg
  vitaminB5: 5, // mg
  vitaminB6: 1.7, // mg
  vitaminB7: 30, // µg
  folate: 400, // µg
  vitaminB12: 2.4, // µg
};

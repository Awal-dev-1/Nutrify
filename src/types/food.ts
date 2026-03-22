import { z } from 'zod';

export const FoodItemSchema = z.object({
  foodName: z.string().describe("The specific name of the identified food."),
  estimatedWeightGrams: z.number().describe("The AI's estimated weight in grams for the portion size identified in the image."),
  calories: z.number().describe("An estimated calorie count for the portion identified in the image."),
  macronutrientBreakdown: z.object({
    protein: z.number().describe("Grams of protein for the portion identified in the image."),
    carbohydrates: z.number().describe("Grams of carbohydrates for the portion identified in the image."),
    fat: z.number().describe("Grams of fat for the portion identified in the image."),
  }),
  micronutrientBreakdown: z.object({
    fiber: z.number().optional().describe("Grams of fiber for the portion identified in the image."),
    sugar: z.number().optional().describe("Grams of sugar for the portion identified in the image."),
    iron: z.number().optional().describe("Milligrams (mg) of Iron for the portion identified in the image."),
    calcium: z.number().optional().describe("Milligrams (mg) of Calcium for the portion identified in the image."),
    vitaminA: z.number().optional().describe("Micrograms (mcg) of Vitamin A for the portion identified in the image."),
    vitaminC: z.number().optional().describe("Milligrams (mg) of Vitamin C for the portion identified in the image."),
    sodium: z.number().optional().describe("Milligrams (mg) of Sodium for the portion identified in the image."),
    vitaminD: z.number().optional().describe("Micrograms (mcg) of Vitamin D."),
    vitaminE: z.number().optional().describe("Milligrams (mg) of Vitamin E."),
    vitaminK: z.number().optional().describe("Micrograms (mcg) of Vitamin K."),
    vitaminB1: z.number().optional().describe("Milligrams (mg) of Vitamin B1 (Thiamine)."),
    vitaminB2: z.number().optional().describe("Milligrams (mg) of Vitamin B2 (Riboflavin)."),
    vitaminB3: z.number().optional().describe("Milligrams (mg) of Vitamin B3 (Niacin)."),
    vitaminB6: z.number().optional().describe("Milligrams (mg) of Vitamin B6."),
    vitaminB12: z.number().optional().describe("Micrograms (mcg) of Vitamin B12."),
    folate: z.number().optional().describe("Micrograms (mcg) of Folate."),
    magnesium: z.number().optional().describe("Milligrams (mg) of Magnesium."),
    potassium: z.number().optional().describe("Milligrams (mg) of Potassium."),
    zinc: z.number().optional().describe("Milligrams (mg) of Zinc."),
  }).describe("A detailed breakdown of key micronutrients for the portion identified in the image."),
  detailedRecipe: z.object({
    ingredients: z.array(z.string()).describe("A list of all ingredients required, with specific quantities (e.g., '1 cup flour', '200g chicken breast')."),
    instructions: z.array(z.string()).describe("A step-by-step guide to preparing the food.")
  }).describe("A detailed recipe for the identified food item.").optional(),
  foodHistory: z.string().describe("A short, interesting, and verifiable history about the food's origin or cultural significance.").optional(),
  
  suitability: z.enum(['Suitable', 'Moderately Suitable', 'Not Suitable']).describe("A classification of how suitable the food is for the user, based on their complete profile.").optional(),
  healthAnalysis: z.string().describe("A detailed, personalized health analysis explaining the suitability classification. This should be comprehensive, actionable, and based on the user's goals, preferences, and health profile. Explain WHY the food is good or bad for them, mentioning specific nutrients and suggesting alternatives if not suitable.").optional(),
  
  isGhanaianLocal: z.boolean().describe("A boolean indicating if the food is a local Ghanaian dish or ingredient."),
  tags: z.array(z.string()).optional().describe("An array of descriptive tags for the food, including dietary tags like 'Vegan', 'Halal', 'Gluten-Free'."),
});

export type FoodItem = z.infer<typeof FoodItemSchema>;

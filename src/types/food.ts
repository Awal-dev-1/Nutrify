import { z } from 'zod';

export const FoodItemSchema = z.object({
  foodName: z.string().describe("The specific name of the identified food."),
  calories: z.number().describe("An estimated calorie count for a standard portion (per 100g)."),
  macronutrientBreakdown: z.object({
    protein: z.number().describe("Grams of protein per 100g."),
    carbohydrates: z.number().describe("Grams of carbohydrates per 100g."),
    fat: z.number().describe("Grams of fat per 100g."),
  }),
  micronutrientBreakdown: z.object({
    fiber: z.number().optional().describe("Grams of fiber per 100g."),
    sugar: z.number().optional().describe("Grams of sugar per 100g."),
    iron: z.number().optional().describe("Milligrams (mg) of Iron per 100g."),
    calcium: z.number().optional().describe("Milligrams (mg) of Calcium per 100g."),
    vitaminA: z.number().optional().describe("Micrograms (mcg) of Vitamin A per 100g."),
    vitaminC: z.number().optional().describe("Milligrams (mg) of Vitamin C per 100g."),
    sodium: z.number().optional().describe("Milligrams (mg) of Sodium per 100g."),
  }).describe("A detailed breakdown of key micronutrients per 100g."),
  detailedRecipe: z.object({
    ingredients: z.array(z.string()).describe("A list of all ingredients required, with specific quantities (e.g., '1 cup flour', '200g chicken breast')."),
    instructions: z.array(z.string()).describe("A step-by-step guide to preparing the food.")
  }).describe("A detailed recipe for the identified food item."),
  foodHistory: z.string().describe("A short, interesting, and verifiable history about the food's origin or cultural significance."),
  healthAnalysis: z.string().describe("Personalized health analysis based on the user's goal."),
});

export type FoodItem = z.infer<typeof FoodItemSchema>;

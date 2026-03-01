import { z } from 'zod';

export const FoodItemSchema = z.object({
  foodName: z.string().describe("The specific name of the identified food."),
  calories: z.number().describe("An estimated calorie count for a standard portion."),
  macronutrientBreakdown: z.object({
    protein: z.number().describe("Grams of protein."),
    carbohydrates: z.number().describe("Grams of carbohydrates."),
    fat: z.number().describe("Grams of fat."),
  }),
  micronutrientBreakdown: z.array(z.string()).describe('A list of key vitamins and minerals and their amounts (e.g., "Iron: 10mg", "Vitamin C: 500IU").'),
  detailedRecipe: z.object({
    ingredients: z.array(z.string()).describe("A list of all ingredients required, with specific quantities (e.g., '1 cup flour', '200g chicken breast')."),
    instructions: z.array(z.string()).describe("A step-by-step guide to preparing the food.")
  }).describe("A detailed recipe for the identified food item."),
  foodHistory: z.string().describe("A short, interesting, and verifiable history about the food's origin or cultural significance."),
  healthAnalysis: z.string().describe("Personalized health analysis based on the user's goal."),
});

export type FoodItem = z.infer<typeof FoodItemSchema>;

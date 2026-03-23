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
    fiber: z.number().optional().describe("Grams of fiber."),
    sugar: z.number().optional().describe("Grams of sugar."),
    sodium: z.number().optional().describe("Milligrams (mg) of Sodium."),
    calcium: z.number().optional().describe("Milligrams (mg) of Calcium."),
    iron: z.number().optional().describe("Milligrams (mg) of Iron."),
    potassium: z.number().optional().describe("Milligrams (mg) of Potassium."),
    magnesium: z.number().optional().describe("Milligrams (mg) of Magnesium."),
    zinc: z.number().optional().describe("Milligrams (mg) of Zinc."),
    phosphorus: z.number().optional().describe("Milligrams (mg) of Phosphorus."),
    iodine: z.number().optional().describe("Micrograms (mcg) of Iodine."),
    selenium: z.number().optional().describe("Micrograms (mcg) of Selenium."),
    copper: z.number().optional().describe("Milligrams (mg) of Copper."),
    manganese: z.number().optional().describe("Milligrams (mg) of Manganese."),
    chromium: z.number().optional().describe("Micrograms (mcg) of Chromium."),
    molybdenum: z.number().optional().describe("Micrograms (mcg) of Molybdenum."),
    chloride: z.number().optional().describe("Milligrams (mg) of Chloride."),
    vitaminA: z.number().optional().describe("Micrograms (mcg) of Vitamin A."),
    vitaminC: z.number().optional().describe("Milligrams (mg) of Vitamin C."),
    vitaminD: z.number().optional().describe("Micrograms (mcg) of Vitamin D."),
    vitaminE: z.number().optional().describe("Milligrams (mg) of Vitamin E."),
    vitaminK: z.number().optional().describe("Micrograms (mcg) of Vitamin K."),
    vitaminB1: z.number().optional().describe("Milligrams (mg) of Thiamine (B1)."),
    vitaminB2: z.number().optional().describe("Milligrams (mg) of Riboflavin (B2)."),
    vitaminB3: z.number().optional().describe("Milligrams (mg) of Niacin (B3)."),
    vitaminB5: z.number().optional().describe("Milligrams (mg) of Pantothenic acid (B5)."),
    vitaminB6: z.number().optional().describe("Milligrams (mg) of Vitamin B6."),
    vitaminB7: z.number().optional().describe("Micrograms (mcg) of Biotin (B7)."),
    folate: z.number().optional().describe("Micrograms (mcg) of Folate (B9)."),
    vitaminB12: z.number().optional().describe("Micrograms (mcg) of Vitamin B12."),
  }).describe("A detailed breakdown of key micronutrients for the portion identified in the image.").optional(),
  detailedRecipe: z.object({
    ingredients: z.array(z.string()).describe("A list of all ingredients required, with specific quantities (e.g., '1 cup flour', '200g chicken breast')."),
    instructions: z.array(z.string()).describe("A step-by-step guide to preparing the food.")
  }).describe("A detailed recipe for the identified food item.").optional(),
  foodHistory: z.string().describe("A short, interesting, and verifiable history about the food's origin or cultural significance.").optional(),
  
  suitability: z.enum(['Suitable', 'Moderately Suitable', 'Not Suitable']).describe("A classification of how suitable the food is for the user, based on their complete profile."),
  healthAnalysis: z.string().describe("A detailed, personalized health analysis explaining the suitability classification. This should be comprehensive, actionable, and based on the user's goals, preferences, and health profile. Explain WHY the food is good or bad for them, mentioning specific nutrients and suggesting alternatives if not suitable."),
  
  isGhanaianLocal: z.boolean().describe("A boolean indicating if the food is a local Ghanaian dish or ingredient."),
  tags: z.array(z.string()).optional().describe("An array of descriptive tags for the food, including dietary tags like 'Vegan', 'Halal', 'Gluten-Free'."),
});

export type FoodItem = z.infer<typeof FoodItemSchema>;

    
'use server';
/**
 * @fileOverview A Genkit flow for searching food items using a fully AI-driven approach.
 * The AI generates nutritional information directly based on the query.
 *
 * - searchFoods - A function that handles the food search process.
 * - SearchFoodsInput - The input type for the searchFoods function.
 * - SearchFoodsOutput - The return type for the searchFoods function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { gemini3FlashPreview } from '@genkit-ai/google-genai';

const SearchFoodsInputSchema = z.object({
  query: z.string().describe('The natural language search query from the user.'),
  userGoal: z.string().optional().describe("The user's primary health goal (e.g., 'lose_weight')."),
});
export type SearchFoodsInput = z.infer<typeof SearchFoodsInputSchema>;

const FoodItemSchema = z.object({
  foodName: z.string().describe("The specific name of the identified food."),
  calories: z.number().describe("An estimated calorie count for a standard portion."),
  macronutrientBreakdown: z.object({
    protein: z.number().describe("Grams of protein."),
    carbohydrates: z.number().describe("Grams of carbohydrates."),
    fat: z.number().describe("Grams of fat."),
  }),
  micronutrientBreakdown: z.array(z.string()).describe('A list of key vitamins and minerals and their amounts (e.g., "Iron: 10mg", "Vitamin C: 500IU").'),
  possibleRecipes: z.array(z.string()).describe("A few suggested easy-to-prepare recipes or variations for the identified meal."),
  foodHistory: z.string().describe("A short, interesting, and verifiable history about the food's origin or cultural significance."),
  healthAnalysis: z.string().describe("Personalized health analysis based on the user's goal."),
});

export type FoodItem = z.infer<typeof FoodItemSchema>;

const SearchFoodsOutputSchema = z.object({
  isFoodQuery: z.boolean().describe("A boolean indicating if the query is about food."),
  foodItems: z.array(FoodItemSchema).describe("A list of identified food items. Should be empty if isFoodQuery is false."),
});

export type SearchFoodsOutput = z.infer<typeof SearchFoodsOutputSchema>;


export async function searchFoods(input: SearchFoodsInput): Promise<SearchFoodsOutput> {
  return searchFoodsFlow(input);
}

const searchFoodsPrompt = ai.definePrompt({
  name: 'searchFoodsV3Prompt',
  input: { schema: SearchFoodsInputSchema },
  output: { schema: SearchFoodsOutputSchema },
  prompt: `You are a world-class nutritional expert and food historian. A user is looking for information about food. Their main health goal is "{{#if userGoal}}{{userGoal}}{{else}}Not specified{{/if}}".

First, carefully determine if the user's query is actually about food. Set the 'isFoodQuery' field to true if it is, and false otherwise. Be strict; general questions or non-food topics should result in 'isFoodQuery' being false.

If and only if the query is about food, provide a list of food items that match the query. For each food item, you must provide:
- foodName: The specific name of the identified food.
- calories: An estimated calorie count for a standard portion.
- macronutrientBreakdown: A breakdown of protein, carbohydrates, and fat in grams.
- micronutrientBreakdown: A detailed list of key vitamins and minerals, including their amounts and standard units (e.g., "Iron: 10mg", "Vitamin C: 500IU", "2.4mcg"). Be as comprehensive as possible.
- possibleRecipes: A few suggested easy-to-prepare recipes or variations for the identified meal.
- foodHistory: A short, interesting, and verifiable fact or brief history about the food's origin or cultural significance.
- healthAnalysis: A personalized health analysis based on the user's goal ("{{userGoal}}"). This analysis should explain if the food is good or bad for their specific goal and why. Be specific in your reasoning.
  - If the goal is "weight-loss", analyze if the food's calorie density, fiber content, and nutrient profile supports a caloric deficit and satiety.
  - If the goal is "muscle-gain", analyze if the food's protein and calorie content is beneficial for muscle protein synthesis and recovery.
  - If the goal is "maintenance", analyze if the food is a balanced, nutrient-dense choice for maintaining a healthy weight and overall well-being.
  - If no goal is provided, this can be a general health tip about the food's benefits.

If 'isFoodQuery' is false, you must return an empty 'foodItems' array.

User Query: {{{query}}}

Format your response strictly as a JSON object adhering to the provided schema. Do not explain outside the JSON. Do not include extra commentary.`,
});

const searchFoodsFlow = ai.defineFlow(
  {
    name: 'searchFoodsV3Flow',
    inputSchema: SearchFoodsInputSchema,
    outputSchema: SearchFoodsOutputSchema,
  },
  async (input) => {
    const { output } = await searchFoodsPrompt(input, {
      model: gemini3FlashPreview,
      config: {
        temperature: 0.1,
      },
    });

    if (!output) {
      return { isFoodQuery: false, foodItems: [] };
    }
    return output;
  }
);

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
  detailedRecipe: z.object({
    ingredients: z.array(z.string()).describe("A list of all ingredients required, with specific quantities (e.g., '1 cup flour', '200g chicken breast')."),
    instructions: z.array(z.string()).describe("A step-by-step guide to preparing the food.")
  }).describe("A detailed recipe for the identified food item."),
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
  prompt: `You are a world-class nutritional expert and food historian. Your task is to provide highly accurate and specific information about the food requested by the user.

User's health goal: "{{#if userGoal}}{{userGoal}}{{else}}Not specified{{/if}}".

CRITICAL INSTRUCTIONS:
1.  **Exact Match Only**: You MUST only provide information for the exact food item specified in the user's query. Do not provide information for related or similar foods. If the query is ambiguous, provide the most common interpretation.
2.  **Food Queries Only**: First, determine if the user's query is strictly about food. If it is not, you MUST set 'isFoodQuery' to false and return an empty 'foodItems' array.
3.  **Detailed Recipe Generation**: For the \`detailedRecipe\` field, you must provide a complete, practical recipe.
    -   \`ingredients\`: List every ingredient with precise measurements (e.g., "1 cup (240ml) water", "150g chicken breast").
    -   \`instructions\`: Provide clear, step-by-step instructions for preparation.

For each food item that EXACTLY matches the query, you must provide:
- foodName: The specific name of the identified food.
- calories: An estimated calorie count for a standard portion.
- macronutrientBreakdown: A breakdown of protein, carbohydrates, and fat in grams.
- micronutrientBreakdown: A comprehensive list of key vitamins and minerals with amounts and units (e.g., "Iron: 10mg", "Vitamin C: 500IU", "2.4mcg").
- detailedRecipe: A complete recipe as described in the critical instructions.
- foodHistory: A short, interesting, and verifiable fact or history about the food.
- healthAnalysis: A personalized analysis based on the user's goal. Explain if the food is beneficial or detrimental for their specific goal and why.
  - If the goal is "weight-loss", analyze calorie density, fiber, and satiety.
  - If the goal is "muscle-gain", analyze protein and calorie content for muscle synthesis.
  - If the goal is "maintenance", analyze if it is a balanced, nutrient-dense choice.
  - If no goal is specified, provide a general health tip.

If 'isFoodQuery' is false, you must return an empty 'foodItems' array.

User Query: {{{query}}}

Format your response strictly as a JSON object adhering to the provided schema. Do not include extra commentary.`,
});

const searchFoodsFlow = ai.defineFlow(
  {
    name: 'searchFoodsV3Flow',
    inputSchema: SearchFoodsInputSchema,
    outputSchema: SearchFoodsOutputSchema,
  },
  async (input) => {
    const { output } = await searchFoodsPrompt(input, {
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

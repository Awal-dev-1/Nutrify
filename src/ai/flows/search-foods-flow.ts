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
import { FoodItemSchema } from '@/types/food';

const SearchFoodsInputSchema = z.object({
  query: z.string().describe('The natural language search query from the user.'),
  userGoal: z.string().optional().describe("The user's primary health goal (e.g., 'lose_weight')."),
});
export type SearchFoodsInput = z.infer<typeof SearchFoodsInputSchema>;

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
  prompt: `You are a world-class nutritional expert and food historian, designed to be fast and accurate. Your task is to provide highly accurate and specific nutritional information for food items requested by the user, per 100g portion.

User's health goal: "{{#if userGoal}}{{userGoal}}{{else}}Not specified{{/if}}".

CRITICAL INSTRUCTIONS:
1.  **Food Queries Only**: Your primary function is to analyze food. First, determine if the user's query is strictly about a food item. If the query is clearly not about food (e.g., "a car," "the meaning of life," "blue sky"), you MUST set 'isFoodQuery' to false and return an empty 'foodItems' array. Do not attempt to find nutritional information for non-food items.
2.  **Handle Specific and Combined Dishes**: Your primary task is to respond to the user's query precisely.
    *   If the user asks for a single food item (e.g., "fufu"), provide nutritional information for that item alone.
    *   If the user asks for a combined dish (e.g., "banku with okra soup"), you must analyze the entire dish as a single meal and provide the combined nutritional information.
    *   Do not provide information for related but unrequested items.
3.  **Detailed Recipe Generation**: For the \`detailedRecipe\` field, you must provide a complete, practical recipe.
    -   \`ingredients\`: List every ingredient with precise measurements (e.g., "1 cup (240ml) water", "150g chicken breast").
    -   \`instructions\`: Provide clear, step-by-step instructions for preparation.
4.  **Nutrient Data per 100g**: All calorie, macronutrient, and micronutrient data MUST be for a 100g portion of the food.
5.  **Dietary Tags**: Generate an array of relevant dietary tags (e.g., "Vegan", "Gluten-Free", "Halal", "Keto-Friendly") based on the ingredients.
6.  **Set Weight to 100g**: For every food item, you MUST set the 'estimatedWeightGrams' field to 100, as all other nutritional data is per 100g.
7.  **Speed**: Your response should be generated as quickly as possible.

For each food item that EXACTLY matches the query, you must provide:
- foodName: The specific name of the identified food.
- calories: Estimated calorie count per 100g.
- macronutrientBreakdown: An object with protein, carbohydrates, and fat in grams per 100g.
- micronutrientBreakdown: An object containing key vitamins and minerals per 100g (e.g., Iron in mg, Vitamin A in mcg, Sodium in mg, Fiber in g).
- detailedRecipe: A complete recipe as described in the critical instructions.
- foodHistory: A short, interesting, and verifiable fact or history about the food.
- healthAnalysis: A personalized analysis based on the user's goal. Explain if the food is beneficial or detrimental for their specific goal and why.
  - If the goal is "weight-loss", analyze calorie density, fiber, and satiety.
  - If the goal is "muscle-gain", analyze protein and calorie content for muscle synthesis.
  - If the goal is "maintenance", analyze if it is a balanced, nutrient-dense choice.
  - If no goal is specified, provide a general health tip.
- tags: An array of relevant dietary tags.

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

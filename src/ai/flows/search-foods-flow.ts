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
  prompt: `You are a world-class nutritional expert, designed to be extremely fast and accurate. Your task is to provide nutritional information for food items requested by the user, per 100g portion.

User's health goal: "{{#if userGoal}}{{userGoal}}{{else}}Not specified{{/if}}".

CRITICAL INSTRUCTIONS:
1.  **Speed and Brevity**: Your response MUST be generated as quickly as possible. Keep all text fields concise.
2.  **Food Queries Only**: If the user's query is clearly not about food (e.g., "a car"), you MUST set 'isFoodQuery' to false and return an empty 'foodItems' array.
3.  **Handle Specific and Combined Dishes**: If the user asks for a single food ("fufu"), provide info for that item. If they ask for a combined dish ("banku with okra soup"), analyze the entire dish as one.
4.  **Recipe**: For the \`detailedRecipe.instructions\` field, provide a single-sentence summary of the cooking method, not a long list of steps.
5.  **History & Analysis**: Keep \`foodHistory\` and \`healthAnalysis\` to 1-2 sentences maximum.
6.  **Nutrient Data**: All nutrient data MUST be for a 100g portion. You MUST set the 'estimatedWeightGrams' field to 100.
7.  **Dietary Tags**: Generate an array of relevant dietary tags.

For each food item that EXACTLY matches the query, you must provide:
- foodName
- calories
- macronutrientBreakdown
- micronutrientBreakdown
- detailedRecipe (ingredients and a single summary instruction)
- foodHistory (1-2 sentences)
- healthAnalysis (1-2 sentences)
- tags

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

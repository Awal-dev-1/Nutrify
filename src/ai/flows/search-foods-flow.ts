'use server';
/**
 * @fileOverview A Genkit flow for searching food items using natural language.
 *
 * - searchFoods - A function that handles the food search process.
 * - SearchFoodsInput - The input type for the searchFoods function.
 * - SearchFoodsOutput - The return type for the searchFoods function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const AiFoodSearchResultSchema = z.object({
  id: z.string().describe("A unique identifier for the food item, preferably a slug-like-string."),
  name: z.string().describe("The common name of the food item."),
  calories: z.number().describe("Nutritional value: Calories per 100 grams of the food."),
  macros: z.object({
    protein: z.number().describe("Nutritional value: Protein in grams per 100g."),
    carbs: z.number().describe("Nutritional value: Carbohydrates in grams per 100g."),
    fat: z.number().describe("Nutritional value: Fats in grams per 100g."),
  }),
  matchScore: z.number().describe("A score from 0 to 1 indicating the relevance of the match."),
  reason: z.string().describe("A brief explanation of why this food matches the query."),
});

const SearchFoodsInputSchema = z.object({
  query: z.string().describe('The natural language search query from the user.'),
  dietaryPreferences: z.array(z.string()).optional().describe('Optional dietary preferences to filter results.'),
});
export type SearchFoodsInput = z.infer<typeof SearchFoodsInputSchema>;

const SearchFoodsOutputSchema = z.object({
  results: z.array(AiFoodSearchResultSchema).describe('An array of food items that match the search query.'),
  interpretedQuery: z.string().optional().describe('A brief summary of how the AI interpreted the query.'),
});
export type SearchFoodsOutput = z.infer<typeof SearchFoodsOutputSchema>;
export type AiFoodSearchResult = z.infer<typeof AiFoodSearchResultSchema>;


export async function searchFoods(input: SearchFoodsInput): Promise<SearchFoodsOutput> {
  return searchFoodsFlow(input);
}

const searchFoodsPrompt = ai.definePrompt({
  name: 'searchFoodsPrompt',
  input: { schema: SearchFoodsInputSchema },
  output: { schema: SearchFoodsOutputSchema },
  prompt: `You are an AI nutritionist and food database for "Nutrify", a smart nutrition app for Ghanaian users.
Your task is to respond to a user's food search query with accurate nutritional information.

The user's query is: "{{query}}".

You can handle:
- Specific food names (e.g., "Jollof Rice")
- Natural language queries (e.g., "high protein lunch", "low calorie snacks")
- Queries with dietary restrictions (e.g., "vegan ghanaian dinner")

Based on the query, generate a list of relevant food items. Prioritize Ghanaian local dishes when appropriate.
If the user specifies dietary preferences like {{#if dietaryPreferences}}'{{#each dietaryPreferences}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}'{{/if}}, ensure your suggestions are compatible.

For each food item you return, provide the following details, making your best estimate for nutritional values per 100g:
- A unique, slug-like ID.
- The food's name.
- Calories.
- Macros (protein, carbs, fat).
- A "matchScore" (from 0 to 1) indicating how well it matches the query.
- A "reason" explaining why this food is a good suggestion.

Also, provide a brief summary of how you interpreted the user's query in the 'interpretedQuery' field.
Your entire output must conform to the specified JSON schema. Do not return foods that are not relevant to the query.
`,
});

const searchFoodsFlow = ai.defineFlow(
  {
    name: 'searchFoodsFlow',
    inputSchema: SearchFoodsInputSchema,
    outputSchema: SearchFoodsOutputSchema,
  },
  async (input) => {
    const { output } = await searchFoodsPrompt(input);
    if (!output) {
      throw new Error('Failed to get search results from AI.');
    }
    return output;
  }
);

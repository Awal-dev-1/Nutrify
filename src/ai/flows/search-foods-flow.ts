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
import { mockFoods } from '@/lib/data';

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
  prompt: `You are a food database search engine for a Ghanaian nutrition app called Nutrify.
Your task is to respond to a user's food search query.
The query can be a simple food name, a natural language query (e.g., "high protein lunch"), or include dietary restrictions.

Based on the user's query: "{{query}}", find relevant food items from the provided food list.
Prioritize Ghanaian local dishes when relevant.

If the user specifies dietary preferences like {{#if dietaryPreferences}}'{{#each dietaryPreferences}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}'{{/if}}, make sure the returned food items match those preferences.

Return a list of matching food items. For each item, provide all the nutritional details as specified in the output schema.
The nutritional values should be per 100g.
Provide a brief summary of how you interpreted the query.

For each result, include a "matchScore" (a fictional score from 0.85 to 0.99) and a "reason" explaining why it's a good match.

Here is the list of available foods to search from:
${JSON.stringify(mockFoods.map(f => ({
  id: f.id,
  name: f.name,
  calories: f.calories,
  macros: {
    protein: f.protein,
    carbs: f.carbs,
    fat: f.fat
  }
})), null, 2)}

Only return foods from this list. If the query is "high protein", find the foods in the list with high protein. If the query is a food name, find that food.
Behave like a search engine filtering the provided JSON data.
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

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

const AiFoodDataSchema = z.object({
  name: z.string(),
  description: z.string(),
  servingSize: z.string(),
  calories: z.number(),
  macros: z.object({
    protein: z.number(),
    carbs: z.number(),
    fat: z.number(),
  }),
  micros: z.object({
    iron: z.number().nullable(),
    calcium: z.number().nullable(),
    fiber: z.number().nullable(),
  }),
  healthAnalysis: z.string(),
  goalAlignmentAdvice: z.string(),
});

const AiFoodErrorSchema = z.object({
  error: z.string(),
});

const SearchFoodsOutputSchema = z.union([AiFoodDataSchema, AiFoodErrorSchema]);

export type SearchFoodsOutput = z.infer<typeof SearchFoodsOutputSchema>;
export type AiFoodData = z.infer<typeof AiFoodDataSchema>;


export async function searchFoods(input: SearchFoodsInput): Promise<SearchFoodsOutput> {
  return searchFoodsFlow(input);
}

const searchFoodsPrompt = ai.definePrompt({
  name: 'searchFoodsV2Prompt',
  input: { schema: SearchFoodsInputSchema },
  output: { schema: SearchFoodsOutputSchema },
  prompt: `You are a certified nutrition database assistant.

A user searched for:
"{{{query}}}"

User goal:
"{{#if userGoal}}{{{userGoal}}}{{else}}Not specified{{/if}}"

Your task:
Return accurate nutrition information for the food searched.
If it is a known dish, provide realistic average nutrition values per standard serving.

Return ONLY JSON in this format:
{
  "name": "string",
  "description": "string",
  "servingSize": "string",
  "calories": number,
  "macros": {
    "protein": number,
    "carbs": number,
    "fat": number
  },
  "micros": {
    "iron": number|null,
    "calcium": number|null,
    "fiber": number|null
  },
  "healthAnalysis": "string",
  "goalAlignmentAdvice": "string"
}

Rules:
- Do not explain outside JSON.
- Do not include extra commentary.
- If food is unknown, say:
{
  "error": "Food not recognized"
}
`,
});

const searchFoodsFlow = ai.defineFlow(
  {
    name: 'searchFoodsV2Flow',
    inputSchema: SearchFoodsInputSchema,
    outputSchema: SearchFoodsOutputSchema,
  },
  async (input) => {
    const { output } = await searchFoodsPrompt(input);
    if (!output) {
      return { error: 'Failed to get a response from the AI model.' };
    }
    return output;
  }
);

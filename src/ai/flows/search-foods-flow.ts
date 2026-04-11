
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
  userProfile: z.object({
    health: z.object({
      primaryGoal: z.string().optional(),
      dietaryPreferences: z.array(z.string()).optional(),
    }).optional(),
  }).optional().describe("The user's profile, including goals and dietary preferences/restrictions."),
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
  prompt: `You are an expert nutritionist for the Nutrify app, specializing in Ghanaian and West African cuisine. You are designed to be extremely fast. Your task is to provide a detailed, personalized nutritional analysis of a food or a complete meal based on a user's query and their health profile.

--- USER CONTEXT ---
{{#if userProfile}}
The user's primary goal is '{{userProfile.health.primaryGoal}}'.
Their dietary preferences are: {{#if userProfile.health.dietaryPreferences.length}}{{#each userProfile.health.dietaryPreferences}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}None specified.{{/if}}
{{else}}
The user has not provided their profile. Provide a general health analysis.
{{/if}}

--- USER QUERY ---
{{{query}}}

--- CRITICAL INSTRUCTIONS ---
1.  **Analyze the Query**: First, determine if the query is for a food item. If it describes a complete meal with multiple components (e.g., "waakye with fish and shito"), treat it as a single food item. If the query is not for a food, set 'isFoodQuery' to false and return an empty 'foodItems' array.

2.  **MANDATORY: Classify Suitability**: You MUST classify the food/meal as 'Suitable', 'Moderately Suitable', or 'Not Suitable'. This classification MUST be based on the user's context provided above. If no context is given, use general health principles. This field is non-negotiable.

3.  **MANDATORY: Provide Health Analysis**: You MUST provide a comprehensive 'healthAnalysis'. This analysis MUST explain your suitability classification. If a user profile is available, personalize the analysis. If not, provide a general one. The analysis must be encouraging and actionable. This field is non-negotiable.

4.  **Complete All Fields**: You must provide all fields in the output schema, including a full nutritional breakdown for a 100-gram portion. The \`suitability\` and \`healthAnalysis\` fields are absolutely mandatory in all cases.

5.  **Local Food Focus**: Prioritize Ghanaian and West African foods.

Format your response strictly as a JSON object. Do not include extra commentary.`,
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
        safetySettings: [
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_ONLY_HIGH',
          },
        ],
      },
    });

    if (!output) {
      return { isFoodQuery: false, foodItems: [] };
    }
    return output;
  }
);

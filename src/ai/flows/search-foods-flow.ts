
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
  prompt: `You are an expert nutritionist for the Nutrify app, specializing in Ghanaian and West African cuisine. Your task is to provide a detailed, personalized nutritional analysis of a food based on a user's query and their health profile.

--- USER PROFILE ---
Primary Goal: {{#if userProfile.health.primaryGoal}}{{userProfile.health.primaryGoal}}{{else}}Not specified{{/if}}
Dietary Preferences/Restrictions: {{#if userProfile.health.dietaryPreferences.length}}{{#each userProfile.health.dietaryPreferences}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}None{{/if}}

--- USER QUERY ---
{{{query}}}

--- CRITICAL INSTRUCTIONS ---
1.  **Analyze and Classify**: Based on the user's ENTIRE profile (goal, preferences, allergies, etc.), you MUST classify the food into one of three categories: 'Suitable', 'Moderately Suitable', or 'Not Suitable' and set the \`suitability\` field.
    *   **Not Suitable**: If the food directly violates a stated allergy, religious restriction (e.g., pork for Halal), or core dietary principle (e.g., meat for a Vegan). This is a hard failure. Also use this if it's extremely counterproductive to a primary goal (e.g., a very high-sugar dessert for a diabetic user).
    *   **Moderately Suitable**: If the food is generally okay but has some drawbacks. For example, it fits a diet but is very high in calories for a weight loss goal, or high in sodium for a heart-healthy goal. This requires a warning.
    *   **Suitable**: If the food aligns well with the user's goals and restrictions.

2.  **Generate Detailed Health Analysis**: You MUST generate a comprehensive \`healthAnalysis\` string. This is the most important output. It must:
    *   Start by clearly stating your classification and the primary reason (e.g., "This meal is **Not Suitable** because it contains gluten, which conflicts with your gluten-free diet.").
    *   Explain the "why" in detail. Reference specific ingredients and nutritional data (e.g., "The high sodium content of 800mg per serving may not be ideal for your heart-healthy goal.").
    *   Provide actionable advice. If 'Moderately Suitable' or 'Not Suitable', suggest a modification or a healthier alternative (e.g., "Consider a smaller portion size," or "A better alternative would be grilled tilapia with a side of steamed vegetables.").
    *   Keep the tone encouraging and informative.

3.  **Standardized Portion**: All nutritional data MUST be for a 100-gram portion. You MUST set 'estimatedWeightGrams' to exactly 100.

4.  **Complete All Fields**: You must provide all fields in the schema, including \`foodName\`, \`calories\`, \`macronutrientBreakdown\`, \`micronutrientBreakdown\`, \`detailedRecipe\`, \`foodHistory\`, \`isGhanaianLocal\`, and \`tags\`. The \`healthAnalysis\` and \`suitability\` fields are mandatory.

5.  **Local Food Focus**: Prioritize Ghanaian and West African foods and names where applicable. For "beans and plantain", the \`foodName\` should be "Red Red (Gobe)".

6.  **Food Queries Only**: If the user's query is clearly not about food (e.g., "a car"), you MUST set 'isFoodQuery' to false and return an empty 'foodItems' array.

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

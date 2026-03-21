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
  prompt: `You are a world-class nutritional expert specializing in Ghanaian and West African foods, designed to be extremely fast and accurate. Your task is to provide nutritional information for food items requested by the user.

User's health goal: "{{#if userGoal}}{{userGoal}}{{else}}Not specified{{/if}}".

CRITICAL INSTRUCTIONS:
1.  **Speed and Brevity**: Your response MUST be generated as quickly as possible. Keep all text fields concise, except for the Health Analysis and Recipe.
2.  **Food Queries Only**: If the user's query is clearly not about food (e.g., "a car"), you MUST set 'isFoodQuery' to false and return an empty 'foodItems' array.
3.  **Prioritize Local Names**: When a user queries a local Ghanaian dish, you MUST identify it by its proper local name. If a food has a well-known local Ghanaian name, include it in parentheses in the 'foodName' field. For example, if a user searches for "beans and plantain", identify it as "Red Red (Gobe)". Similarly, use correct primary names like "Fufu", "Banku", and "Kenkey". Do not use generic descriptions if a common local name exists.
4.  **Analyze Mixed Dishes Accurately**: For a combined dish (e.g., "banku with okra soup"), you MUST identify all main components (e.g., banku, soup, fish/meat) and calculate the total nutritional value for the entire dish as a single item. Do not provide separate entries for each component.
5.  **Detailed Recipe**: For the \`detailedRecipe\` field, provide a list of all necessary ingredients with quantities, and a clear, step-by-step guide for the cooking instructions. Be thorough.
6.  **Provide DETAILED Health Analysis**: For each food item, you MUST generate a detailed and personalized \`healthAnalysis\`. This is the most important part.
    *   Explain CLEARLY why the food is beneficial or detrimental based on the user's specific goal (e.g., 'lose-weight', 'gain-weight').
    *   Go beyond a single sentence. For 'lose-weight', discuss calorie density, fiber content for satiety, and protein for muscle maintenance. For 'gain-weight', discuss energy density and quality of macronutrients. For 'eat-healthier', discuss the balance of nutrients and vitamin/mineral content.
    *   Be specific. Instead of "good for weight loss", say "This portion of Banku is calorie-dense. While a good energy source, a smaller portion might be better for your weight loss goal. The accompanying Tilapia, however, is an excellent source of lean protein.".
7.  **Standardized Nutrient Data**: Since this is a text search without an image, all nutritional data MUST be standardized for a 100-gram portion. This provides a consistent baseline for users to compare foods. Therefore, you MUST set the 'estimatedWeightGrams' field to exactly 100.
8.  **Dietary Tags**: Generate an array of relevant dietary tags.
9.  **Local Food**: Determine if the food is a local Ghanaian or other West African dish or ingredient and set the \`isGhanaianLocal\` boolean field accordingly.
10. **History**: Keep \`foodHistory\` to 1-2 sentences maximum.

For each food item that EXACTLY matches the query, you must provide:
- foodName
- isGhanaianLocal
- calories
- macronutrientBreakdown
- micronutrientBreakdown
- detailedRecipe (ingredients and step-by-step instructions)
- foodHistory
- healthAnalysis (this should be detailed and personalized)
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

'use server';
/**
 * @fileOverview An AI flow for identifying a food item from an image and returning detailed nutritional information.
 *
 * - recognizeFood - A function that handles the food recognition.
 * - RecognizeFoodInput - The input type for the recognizeFood function.
 * - RecognizeFoodOutput - The return type for the recognizeFood function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { FoodItemSchema } from '@/types/food';

const RecognizeFoodInputSchema = z.object({
  imageUrl: z.string().describe('The public URL of the food image.'),
  userGoal: z.string().optional().describe("The user's primary health goal (e.g., 'lose_weight')."),
});
export type RecognizeFoodInput = z.infer<typeof RecognizeFoodInputSchema>;

const RecognizeFoodOutputSchema = z.object({
  isFoodQuery: z.boolean().describe("A boolean indicating if the image contains food."),
  foodItems: z.array(FoodItemSchema).describe("A list of identified food items. Should be empty if isFoodQuery is false."),
});
export type RecognizeFoodOutput = z.infer<typeof RecognizeFoodOutputSchema>;

export async function recognizeFood(input: RecognizeFoodInput): Promise<RecognizeFoodOutput> {
  return recognizeFoodFlow(input);
}

const recognizeFoodPrompt = ai.definePrompt({
  name: 'recognizeFoodPrompt',
  input: { schema: RecognizeFoodInputSchema },
  output: { schema: RecognizeFoodOutputSchema },
  prompt: `You are a world-class nutritional expert. Your task is to analyze the provided image and provide highly accurate and specific information about the food it contains.

User's health goal: "{{#if userGoal}}{{userGoal}}{{else}}Not specified{{/if}}".

CRITICAL INSTRUCTIONS:
1.  **Analyze the Image**: First, determine if the image contains food. If it does not, you MUST set 'isFoodQuery' to false and return an empty 'foodItems' array.
2.  **Identify Main Dish**: If food is present, identify the primary dish. If multiple items are present, focus on the main course.
3.  **Detailed Information**: For the identified food item, you must provide:
    - foodName: The specific name of the food.
    - calories: An estimated calorie count for a standard portion.
    - macronutrientBreakdown: A breakdown of protein, carbohydrates, and fat in grams.
    - micronutrientBreakdown: A list of key vitamins and minerals with amounts and units (e.g., "Iron: 10mg", "Vitamin C: 500IU").
    - detailedRecipe: A complete, practical recipe with ingredients (precise measurements) and step-by-step instructions.
    - foodHistory: A short, interesting, verifiable fact or history about the food.
    - healthAnalysis: A personalized analysis based on the user's goal. Explain if the food is beneficial or detrimental for their specific goal and why.

User Image: {{media url=imageUrl}}

Format your response strictly as a JSON object adhering to the provided schema. Do not include extra commentary.`,
});

const recognizeFoodFlow = ai.defineFlow(
  {
    name: 'recognizeFoodFlow',
    inputSchema: RecognizeFoodInputSchema,
    outputSchema: RecognizeFoodOutputSchema,
  },
  async (input) => {
    const { output } = await recognizeFoodPrompt(input, {
      config: {
        temperature: 0.1, // Lower temperature for more deterministic, factual output
        timeout: 45000, // 45-second timeout
      },
    });

    if (!output) {
      return { isFoodQuery: false, foodItems: [] };
    }
    return output;
  }
);

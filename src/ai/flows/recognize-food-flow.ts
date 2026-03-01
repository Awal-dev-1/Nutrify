'use server';
/**
 * @fileOverview An AI flow for identifying food items from an image and providing detailed nutritional information.
 *
 * - recognizeFood - A function that handles the food recognition process.
 * - RecognizeFoodInput - The input type for the recognizeFood function.
 * - RecognizeFoodOutput - The return type for the recognizeFood function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { FoodItem, FoodItemSchema } from '@/types/food';

const RecognizeFoodInputSchema = z.object({
  imageUrl: z.string().url().describe('The public URL of the food image.'),
  userGoal: z.string().optional().describe("The user's primary health goal (e.g., 'lose_weight')."),
});
export type RecognizeFoodInput = z.infer<typeof RecognizeFoodInputSchema>;


const RecognizeFoodOutputSchema = z.object({
  isFood: z.boolean().describe("A boolean indicating if the image contains food."),
  foodItems: z.array(FoodItemSchema).describe("A list of identified food items. Should be empty if isFood is false."),
});
export type RecognizeFoodOutput = z.infer<typeof RecognizeFoodOutputSchema>;

export async function recognizeFood(input: RecognizeFoodInput): Promise<RecognizeFoodOutput> {
  const { output } = await ai.generate({
      prompt: [
        { text: `You are a world-class nutritional expert and food historian. Your task is to provide highly accurate and specific information about the food shown in the image.

User's health goal: "${input.userGoal || 'Not specified'}".

CRITICAL INSTRUCTIONS:
1.  **Analyze the Image**: First, determine if the image contains food. If it does not, you MUST set 'isFood' to false and return an empty 'foodItems' array.
2.  **Exact Dish Identification**: Identify the most likely single dish in the image. Do not list multiple possibilities unless they are part of a single meal.
3.  **Detailed Information**: For the identified food item, provide a comprehensive breakdown similar to a text-based search.

For the food item you identify, you must provide:
- foodName: The specific name of the identified food.
- calories: An estimated calorie count for a standard portion.
- macronutrientBreakdown: A breakdown of protein, carbohydrates, and fat in grams.
- micronutrientBreakdown: A comprehensive list of key vitamins and minerals with amounts and units.
- detailedRecipe: A complete recipe with ingredients and instructions.
- foodHistory: A short, interesting, and verifiable fact or history about the food.
- healthAnalysis: A personalized analysis based on the user's goal. Explain if the food is beneficial or detrimental for their specific goal and why.

If 'isFood' is false, you must return an empty 'foodItems' array.

Format your response strictly as a JSON object adhering to the provided schema. Do not include extra commentary.` },
        { media: { url: input.imageUrl, contentType: 'image/jpeg' } },
      ],
      output: {
          format: 'json',
          schema: RecognizeFoodOutputSchema,
      },
      config: {
          timeout: 30000, // 30 second timeout
      }
  });

  if (!output) {
      return { isFood: false, foodItems: [] };
  }
  return output;
}

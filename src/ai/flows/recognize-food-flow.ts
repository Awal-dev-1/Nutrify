'use server';
/**
 * @fileOverview An AI flow for identifying a food item from an image and generating its nutritional information.
 * This flow is designed to be robust, using a multimodal model to get rich data from an image URL.
 *
 * - recognizeFood - A function that handles the food recognition and analysis process.
 * - RecognizeFoodInput - The input type for the recognizeFood function.
 * - RecognizeFoodOutput - The return type for the recognizeFood function.
 */

import { ai } from '@/ai/genkit';
import { FoodItemSchema } from '@/types/food';
import { z } from 'zod';

export const RecognizeFoodInputSchema = z.object({
  imageUrl: z.string().describe('The public URL of the food image, typically a Firebase Storage URL.'),
});
export type RecognizeFoodInput = z.infer<typeof RecognizeFoodInputSchema>;

export const RecognizeFoodOutputSchema = z.object({
    isFood: z.boolean().describe("A boolean indicating if the image contains food."),
    foodItem: FoodItemSchema.optional().describe("The detailed information of the most prominent food item identified. Should be empty if isFood is false."),
});
export type RecognizeFoodOutput = z.infer<typeof RecognizeFoodOutputSchema>;

/**
 * A flow that identifies a food item in an image and returns detailed nutritional info.
 * @param input The image URL to analyze.
 * @returns An object indicating if the image is food and the detailed food information.
 */
export async function recognizeFood(input: RecognizeFoodInput): Promise<RecognizeFoodOutput> {
    const { output } = await ai.generate({
        model: 'googleai/gemini-2.5-flash',
        prompt: `You are a precise Food Analysis AI. Analyze the visual context of the image provided.

        CRITICAL INSTRUCTIONS:
        1.  If the image does not contain any recognizable food or drink, you MUST return: { "isFood": false }.
        2.  If food is present, you MUST return { "isFood": true, "foodItem": { ... } }.
        3.  The 'foodItem' object must be fully populated with all the required fields: foodName, calories, macronutrientBreakdown, micronutrientBreakdown, detailedRecipe, foodHistory, and healthAnalysis.
        4.  Provide real, accurate data. Do not use dummy data. Generate a complete, practical recipe.
        
        Analyze the image and return your response in the specified JSON format.`,
        media: { url: input.imageUrl, contentType: 'image/jpeg' },
        output: {
            format: 'json',
            schema: RecognizeFoodOutputSchema,
        },
        config: {
            timeout: 30000, // 30 second timeout
        },
    });

  if (!output) {
      return { isFood: false };
  }
  return output;
}

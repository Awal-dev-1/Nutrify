'use server';
/**
 * @fileOverview An AI flow for identifying a food item from an image.
 * This flow is designed to be fast and simple, returning only the name of the food.
 *
 * - recognizeFood - A function that handles the food recognition.
 * - RecognizeFoodInput - The input type for the recognizeFood function.
 * - RecognizeFoodOutput - The return type for the recognizeFood function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const RecognizeFoodInputSchema = z.object({
  imageUrl: z.string().describe('The public URL of the food image.'),
});
export type RecognizeFoodInput = z.infer<typeof RecognizeFoodInputSchema>;

const RecognizeFoodOutputSchema = z.object({
  foodName: z.string().describe("The name of the most prominent food item identified in the image."),
});
export type RecognizeFoodOutput = z.infer<typeof RecognizeFoodOutputSchema>;

/**
 * A flow that identifies a food item in an image and returns its name.
 * @param input The image URL to analyze.
 * @returns The name of the identified food.
 */
export async function recognizeFood(input: RecognizeFoodInput): Promise<RecognizeFoodOutput> {
    const { output } = await ai.generate({
        model: 'googleai/gemini-2.5-flash',
        prompt: `You are a precise Food Identification AI. Analyze the image and identify the most prominent food dish. Respond with only the name of the food. For example: "Jollof Rice with Chicken".`,
        media: { url: input.imageUrl, contentType: 'image/jpeg' },
        output: {
            format: 'json',
            schema: RecognizeFoodOutputSchema,
        },
        config: {
            timeout: 15000, // 15 second timeout for this simple task
        },
    });

  if (!output || !output.foodName) {
      throw new Error('Could not identify a food in the image.');
  }
  return output;
}

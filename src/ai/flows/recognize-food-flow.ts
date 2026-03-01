'use server';
/**
 * @fileOverview An AI flow for identifying the name of a food item from an image.
 * This flow is designed to be fast and simple, only returning the name of the food.
 *
 * - recognizeFood - A function that handles the food recognition process.
 * - RecognizeFoodInput - The input type for the recognizeFood function.
 * - RecognizeFoodOutput - The return type for the recognizeFood function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const RecognizeFoodInputSchema = z.object({
  imageUrl: z.string().url().describe('The public URL of the food image.'),
});
export type RecognizeFoodInput = z.infer<typeof RecognizeFoodInputSchema>;


const RecognizeFoodOutputSchema = z.object({
  isFood: z.boolean().describe("A boolean indicating if the image contains food."),
  foodName: z.string().optional().describe("The name of the most prominent food item identified. Should be empty if isFood is false."),
});
export type RecognizeFoodOutput = z.infer<typeof RecognizeFoodOutputSchema>;

/**
 * A simple, fast flow that identifies the name of a food item in an image.
 * @param input The image URL to analyze.
 * @returns An object indicating if the image is food and the identified food name.
 */
export async function recognizeFood(input: RecognizeFoodInput): Promise<RecognizeFoodOutput> {
  const { output } = await ai.generate({
      prompt: `You are a food recognition expert. Your single task is to analyze the image provided and identify the name of the main food dish present.

      CRITICAL INSTRUCTIONS:
      1.  If the image contains food, return the common name of the dish (e.g., "Jollof Rice", "Apple", "Banku and Tilapia").
      2.  If the image does not contain any food, you MUST set 'isFood' to false.
      3.  Do NOT provide any other information. Only the name.
      
      Analyze the image and return your response in the specified JSON format.`,
      media: { url: input.imageUrl, contentType: 'image/jpeg' },
      output: {
          format: 'json',
          schema: RecognizeFoodOutputSchema,
      },
      config: {
          timeout: 20000, // 20 second timeout
      }
  });

  if (!output) {
      return { isFood: false };
  }
  return output;
}

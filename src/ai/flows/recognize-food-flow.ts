'use server';
/**
 * @fileOverview An AI flow for identifying a food item from an image.
 * This flow is optimized for speed and accuracy in identifying the name of the food.
 *
 * - recognizeFood - A function that handles the food name recognition.
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
  isFood: z.boolean().describe("Whether the image contains food."),
  foodName: z.string().describe("The name of the single primary food item identified in the image."),
});
export type RecognizeFoodOutput = z.infer<typeof RecognizeFoodOutputSchema>;


export async function recognizeFood(input: RecognizeFoodInput): Promise<RecognizeFoodOutput> {
  return recognizeFoodFlow(input);
}

const recognizeFoodPrompt = ai.definePrompt({
  name: 'recognizeFoodNamePrompt',
  input: { schema: RecognizeFoodInputSchema },
  output: { schema: RecognizeFoodOutputSchema },
  prompt: `You are an expert food identifier. Look at the image and identify the main food dish.
If no food is present, you MUST return { "isFood": false, "foodName": "N/A" }.
Otherwise, return the name of the food. For example: { "isFood": true, "foodName": "Jollof rice with chicken" }.
Only return the name of the food, do not include quantities or other details.

User Image: {{media url=imageUrl}}`,
});

const recognizeFoodFlow = ai.defineFlow(
  {
    name: 'recognizeFoodNameFlow',
    inputSchema: RecognizeFoodInputSchema,
    outputSchema: RecognizeFoodOutputSchema,
  },
  async (input) => {
    const { output } = await recognizeFoodPrompt(input, {
      config: {
        temperature: 0.1,
        timeout: 30000, // 30-second timeout
      },
    });

    if (!output) {
      return { isFood: false, foodName: "AI processing failed." };
    }
    return output;
  }
);

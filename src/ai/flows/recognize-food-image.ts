'use server';
/**
 * @fileOverview A Genkit flow for recognizing food items from an image.
 *
 * - recognizeFoodImage - A function that handles the food recognition process.
 * - RecognizeFoodImageInput - The input type for the recognizeFoodImage function.
 * - RecognizeFoodImageOutput - The return type for the recognizeFoodImage function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const RecognizeFoodImageInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a meal or food, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type RecognizeFoodImageInput = z.infer<typeof RecognizeFoodImageInputSchema>;


const FoodResponseSchema = z.object({
  isFood: z.literal(true).describe("A boolean indicating if the image contains food."),
  itemName: z.string().describe("The specific name of the identified food."),
  calories: z.number().describe("An estimated calorie count for the portion shown."),
  ingredients: z.array(z.string()).describe("A list of primary ingredients in the food."),
});

const NotFoodResponseSchema = z.object({
  isFood: z.literal(false).describe("A boolean indicating if the image contains food."),
});

export const RecognizeFoodImageOutputSchema = z.union([
    FoodResponseSchema,
    NotFoodResponseSchema,
]);

export type RecognizeFoodImageOutput = z.infer<typeof RecognizeFoodImageOutputSchema>;

export async function recognizeFoodImage(
  input: RecognizeFoodImageInput
): Promise<RecognizeFoodImageOutput> {
  return recognizeFoodImageFlow(input);
}

const recognizeFoodImagePrompt = ai.definePrompt({
  name: 'recognizeFoodImagePrompt',
  input: { schema: RecognizeFoodImageInputSchema },
  output: { schema: RecognizeFoodImageOutputSchema },
  prompt: `You are a dedicated Food AI. Your sole purpose is to identify and process food items.

Strict Validation Rule:

If the user uploads an image that is not a food item, a drink, or a grocery product, you MUST return isFood: false. Do not attempt to process non-food items. For example, if shown a car, do not describe it.

If the image contains food, your task is to analyze it. If you recognize a specific regional dish (e.g., Ghanaian Waakye), name it correctly. Set 'isFood' to true and provide the other details.

From the image, provide the following information only if 'isFood' is true:
- itemName: The specific name of the identified food.
- calories: An estimated calorie count for the portion shown.
- ingredients: A list of the primary ingredients.

If 'isFood' is false, do not return any of the other fields.

Image of the food is below:
{{media url=photoDataUri}}`,
});

const recognizeFoodImageFlow = ai.defineFlow(
  {
    name: 'recognizeFoodImageFlow',
    inputSchema: RecognizeFoodImageInputSchema,
    outputSchema: RecognizeFoodImageOutputSchema,
  },
  async input => {
    const { output } = await recognizeFoodImagePrompt(input);
    if (!output) {
      throw new Error('Failed to get a valid response from the AI model.');
    }
    return output;
  }
);

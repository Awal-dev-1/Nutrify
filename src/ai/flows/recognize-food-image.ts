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
  isFood: z.literal(true).describe("Confirms the image contains food."),
  itemName: z.string().describe("The specific name of the identified food item."),
  calories: z.number().describe("An estimated calorie count for the portion shown."),
  ingredients: z.array(z.string()).describe("A list of primary ingredients identified in the meal."),
});

const NotFoodResponseSchema = z.object({
  isFood: z.literal(false).describe("Confirms the image does not contain food."),
  message: z.string().describe("An explanation that the image is not a food item."),
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
  prompt: `You are a specialized AI model with a single function: to identify food items in images. Your analysis is strict.
1.  Analyze the provided image.
2.  Determine if the primary subject of the image is an edible food or drink.
3.  If the image is NOT food or drink (e.g., it contains animals, objects, people, or scenery), you MUST immediately respond with the JSON object: \`{ "isFood": false, "message": "The image does not contain a recognizable food item." }\`. Do not proceed further.
4.  If and only if the image contains food, you MUST return a JSON object with 'isFood' set to true, along with the 'itemName', estimated 'calories', and a list of 'ingredients'.

Image to analyze:
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

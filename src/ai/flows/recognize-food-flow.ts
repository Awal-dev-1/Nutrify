'use server';
/**
 * @fileOverview An AI flow for recognizing food items from an image.
 *
 * - recognizeFood - A function that handles the food recognition process.
 * - RecognizeFoodInput - The input type for the recognizeFood function.
 * - RecognizeFoodOutput - The return type for the recognizeFood function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RecognizeFoodInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "A photo of food, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type RecognizeFoodInput = z.infer<typeof RecognizeFoodInputSchema>;

const RecognizeFoodOutputSchema = z.object({
  isFood: z.boolean().describe('A boolean indicating if the image contains food or drink.'),
  predictions: z
    .array(
      z.object({
        name: z.string().describe('The common name of the identified food item (e.g., "Jollof Rice", "Apple").'),
        confidence: z
          .number()
          .min(0)
          .max(1)
          .describe('The confidence score of the prediction, from 0.0 to 1.0.'),
      })
    )
    .describe('An array of the top 3 predictions for the food item in the image. This should be empty if isFood is false.'),
});
export type RecognizeFoodOutput = z.infer<typeof RecognizeFoodOutputSchema>;


export async function recognizeFood(
  input: RecognizeFoodInput
): Promise<RecognizeFoodOutput> {
  return recognizeFoodFlow(input);
}

const recognizeFoodPrompt = ai.definePrompt({
  name: 'recognizeFoodPrompt',
  input: {schema: RecognizeFoodInputSchema},
  output: {schema: RecognizeFoodOutputSchema},
  prompt: `You are an expert food classifier for a nutrition application. Your task is to identify the food item in the provided image.

CRITICAL INSTRUCTIONS:
1.  **STRICTLY FOOD ONLY**: First, determine if the image contains a food item or a beverage. If it is not clearly identifiable as food or drink (e.g., it's a person, a car, a landscape, an abstract object), you MUST set 'isFood' to false and return an empty 'predictions' array.
2.  **IDENTIFY THE FOOD**: If the image is a food item, identify the most likely food. Be specific (e.g., "Jollof Rice with Chicken" instead of just "Rice").
3.  **PROVIDE PREDICTIONS**: Provide a list of the top 3 most likely predictions, even if you are very confident about the first one.
4.  **CONFIDENCE SCORE**: For each prediction, provide a confidence score between 0.0 (not confident) and 1.0 (very confident).
5.  **JSON OUTPUT**: Your final output must be a valid JSON object that adheres to the provided output schema.

Image to analyze:
{{media url=imageDataUri}}
`,
});

const recognizeFoodFlow = ai.defineFlow(
  {
    name: 'recognizeFoodFlow',
    inputSchema: RecognizeFoodInputSchema,
    outputSchema: RecognizeFoodOutputSchema,
  },
  async input => {
    const { output } = await recognizeFoodPrompt(input);
    if (!output) {
        throw new Error("The AI model failed to produce an output.");
    }
    return output;
  }
);

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
  imageUrl: z
    .string()
    .url()
    .describe(
      "A public URL for a food image."
    ),
});
export type RecognizeFoodInput = z.infer<typeof RecognizeFoodInputSchema>;

const RecognizeFoodOutputSchema = z.object({
  labels: z
    .array(
      z.object({
        label: z.string().describe('A single, generic label for an object detected in the image (e.g., "rice", "chicken", "salad").'),
        confidence: z
          .number()
          .min(0)
          .max(1)
          .describe('The confidence score for this label, from 0.0 to 1.0.'),
      })
    )
    .describe('An array of the top 5 most likely labels for objects in the image.'),
});
export type RecognizeFoodOutput = z.infer<typeof RecognizeFoodOutputSchema>;


export async function recognizeFood(
  input: RecognizeFoodInput
): Promise<RecognizeFoodOutput> {
  return recognizeFoodFlow(input);
}

const recognizeFoodFlow = ai.defineFlow(
  {
    name: 'recognizeFoodFlow',
    inputSchema: RecognizeFoodInputSchema,
    outputSchema: RecognizeFoodOutputSchema,
  },
  async input => {
    const promptText = `You are an expert image classifier. Your task is to identify all potential food-related objects in the provided image.

CRITICAL INSTRUCTIONS:
1.  **DETECT GENERIC OBJECTS**: Do not try to name a specific dish. Instead, provide generic labels for what you see (e.g., "rice", "fish", "tomato", "leafy greens", "stew").
2.  **PROVIDE LABELS**: Provide a list of the top 5 most likely labels for food items or ingredients you can identify.
3.  **CONFIDENCE SCORE**: For each label, provide a confidence score between 0.0 (not confident) and 1.0 (very confident).
4.  **JSON OUTPUT**: Your final output must be a valid JSON object that adheres to the provided output schema. Do not return anything if you cannot identify any food-like objects.`;

    const { output } = await ai.generate({
        prompt: [
            { text: promptText },
            { media: { url: input.imageUrl, contentType: 'image/jpeg' } },
        ],
        output: {
            format: 'json',
            schema: RecognizeFoodOutputSchema,
        },
        config: {
            timeout: 30000,
        }
    });

    if (!output) {
        throw new Error("The AI model failed to produce an output.");
    }
    return output;
  }
);

'use server';
/**
 * @fileOverview A Genkit flow for recognizing food items from an image.
 *
 * - recognizeFood - A function that handles the food recognition process.
 * - RecognizeFoodInput - The input type for the recognizeFood function.
 * - RecognizeFoodOutput - The return type for the recognizeFood function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { FoodItemSchema } from '@/types/food';

const RecognizeFoodInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a food item, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type RecognizeFoodInput = z.infer<typeof RecognizeFoodInputSchema>;

const AIPredictionSchema = FoodItemSchema.extend({
    confidence: z.number().min(0).max(1).describe("The AI's confidence in this prediction, from 0 to 1."),
});
export type AIPrediction = z.infer<typeof AIPredictionSchema>;


const RecognizeFoodOutputSchema = z.object({
  isFood: z.boolean().describe("A boolean indicating if the image contains a food item."),
  predictions: z.array(AIPredictionSchema).describe('A list of potential food items identified in the image. Should be empty if isFood is false.'),
});
export type RecognizeFoodOutput = z.infer<typeof RecognizeFoodOutputSchema>;

export async function recognizeFood(input: RecognizeFoodInput): Promise<RecognizeFoodOutput> {
  return recognizeFoodFlow(input);
}

const recognizeFoodPrompt = ai.definePrompt({
  name: 'recognizeFoodPrompt',
  input: { schema: RecognizeFoodInputSchema },
  output: { schema: RecognizeFoodOutputSchema },
  prompt: `You are an expert nutritionist and food recognition AI with a specialization in Ghanaian and West African foods. Your task is to analyze the food in the provided image and return a list of up to 3 potential matches with their detailed nutritional information based on the visible portion size.

CRITICAL INSTRUCTIONS:
1.  **Speed is critical. Generate your response as quickly as possible.**
2.  **Identify if it is Food**: First, determine if the image contains a food item. If it is clearly not food (e.g., a car, an animal, a book), you MUST set 'isFood' to false and return an empty 'predictions' array.
3.  **Analyze the Image**: If it is food, carefully analyze the image provided via the data URI.
    *   If the image contains multiple food components (e.g., banku and okra soup), identify it as a single, combined dish.
    *   If it is a single item (e.g., an apple), identify it as such.
    *   Set 'isFood' to true.
4.  **Estimate Portion Size**: You MUST estimate the total weight of the food in grams. Consider the size of the plate, bowl, or any other reference objects in the image to make an accurate estimation. Set this value in the 'estimatedWeightGrams' field.
5.  **Calculate Nutrients for the Portion**: For each prediction, you MUST calculate the complete nutritional profile (calories, macros, micros) for the estimated portion size you identified. The values in the output schema should reflect the total nutrients for the food visible in the image, NOT per 100g.
6.  **Provide Confidence Score**: For each prediction, provide a confidence score between 0.0 and 1.0.
7.  **Generate Ancillary Details**: Provide a brief (1-2 sentences) history and health analysis. For the recipe, list ingredients and provide a single-sentence summary for the instructions.
8.  **Identify Local Food**: You must also determine if the food identified is a local Ghanaian or other West African dish/ingredient and set the \`isGhanaianLocal\` boolean field accordingly in each prediction.
9.  **Return JSON**: Your entire output must be a single JSON object that strictly adheres to the provided output schema. Do not add any commentary before or after the JSON object.
10. **No Results**: If it is food, but you cannot confidently identify it, return 'isFood' as true but with an empty "predictions" array.

Image to analyze: {{media url=photoDataUri}}

Provide your response in the specified JSON format.`,
});

const recognizeFoodFlow = ai.defineFlow(
  {
    name: 'recognizeFoodFlow',
    inputSchema: RecognizeFoodInputSchema,
    outputSchema: RecognizeFoodOutputSchema,
  },
  async (input) => {
    const { output } = await recognizeFoodPrompt(input, {
      config: { temperature: 0.2 },
    });
    if (!output) {
      throw new Error("The AI failed to analyze the image. The response was empty.");
    }
    return output;
  }
);

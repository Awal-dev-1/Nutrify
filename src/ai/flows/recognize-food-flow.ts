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
  userGoal: z.string().optional().describe("The user's primary health goal (e.g., 'lose-weight')."),
});
export type RecognizeFoodInput = z.infer<typeof RecognizeFoodInputSchema>;

const AIPredictionSchema = FoodItemSchema;
export type AIPrediction = z.infer<typeof AIPredictionSchema>;

const RecognizeFoodOutputSchema = z.object({
  isFood: z.boolean().describe("A boolean indicating if the image contains a food item."),
  predictions: z.array(AIPredictionSchema).describe("A list containing a single prediction for the entire meal. Should be empty if isFood is false."),
});
export type RecognizeFoodOutput = z.infer<typeof RecognizeFoodOutputSchema>;

export async function recognizeFood(input: RecognizeFoodInput): Promise<RecognizeFoodOutput> {
  return recognizeFoodFlow(input);
}

const recognizeFoodPrompt = ai.definePrompt({
  name: 'recognizeFoodPrompt',
  input: { schema: RecognizeFoodInputSchema },
  output: { schema: RecognizeFoodOutputSchema },
  prompt: `You are a senior developer and professional nutritional vision AI. Your task is to analyze the uploaded food image with high-level precision.

--- INSTRUCTIONS ---
1.  **Holistic Meal Identification**: Analyze the image to identify all visible food items and ingredients.
    
2.  **Combine into a Single Description**: Do NOT list foods separately. Instead, combine all identified components into a single descriptive sentence that clearly represents the full meal. For example: "Beans and gari with pepper stew, fried plantain, and fish". This single sentence will be the \`foodName\` of the result.
    
3.  **Calculate Total Nutrition for the Entire Dish**: Based on this combined meal identification, you must calculate the total estimated nutritional values for the *entire* dish visible in the image. Your calculation must include:
      *   A single \`calories\` value for the whole meal.
      *   A \`macronutrientBreakdown\` object with total protein, carbohydrates, and fat.
      *   A \`micronutrientBreakdown\` object with total vitamin A, vitamin C, iron, calcium, and other relevant vitamins and minerals.
        
4.  **Estimate Total Weight**: Provide an \`estimatedWeightGrams\` for the entire meal shown.
    
5.  **Accuracy is Paramount**: Ensure your analysis is accurate and complete, reflecting everything visible. Do not provide suggestions, alternatives, or uncertainty. Only output what is actually present.
    
6.  **Structured Output**: Your output must contain a single prediction in the \`predictions\` array that represents the entire meal.

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

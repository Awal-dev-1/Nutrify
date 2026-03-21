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

const TotalNutrientsSchema = z.object({
    calories: z.number().describe("Total calories for the entire meal."),
    protein: z.number().describe("Total protein in grams for the entire meal."),
    carbohydrates: z.number().describe("Total carbohydrates in grams for the entire meal."),
    fat: z.number().describe("Total fat in grams for the entire meal."),
});

const RecognizeFoodOutputSchema = z.object({
  isFood: z.boolean().describe("A boolean indicating if the image contains a food item."),
  predictions: z.array(AIPredictionSchema).describe("A list of potential food items identified in the image. Should be empty if isFood is false."),
  totalNutrients: TotalNutrientsSchema.optional().describe("The combined nutritional summary for all identified food items. Should be absent if no food is detected."),
});
export type RecognizeFoodOutput = z.infer<typeof RecognizeFoodOutputSchema>;

export async function recognizeFood(input: RecognizeFoodInput): Promise<RecognizeFoodOutput> {
  return recognizeFoodFlow(input);
}

const recognizeFoodPrompt = ai.definePrompt({
  name: 'recognizeFoodPrompt',
  input: { schema: RecognizeFoodInputSchema },
  output: { schema: RecognizeFoodOutputSchema },
  prompt: `You are a senior developer building an advanced food analyzer. Your task is to analyze the uploaded image and identify every food item present, including all components of mixed dishes.

--- INSTRUCTIONS ---
1.  **Analyze Image for Food**: First, determine if the image contains food. If it is not food, you MUST set 'isFood' to false and return an empty 'predictions' array.

2.  **Deconstruct Mixed Foods**: For complex dishes, break them down into their individual components and list each item separately in the 'predictions' array.

3.  **Absolute Identification**: The output must be accurate and absolute. Do not provide suggestions, confidence scores, or partial guesses. Only list food items that you can identify with high certainty as being present in the image. If you cannot identify any food, return an empty 'predictions' array.

4.  **Calculate Nutrition for Each Item**: For every food item you identify, you MUST calculate its nutritional information (calories, protein, fat, carbs) as accurately as possible for the estimated portion size.

5.  **Calculate Total Summary**: After identifying all individual items, you MUST combine the nutrients of all items to give a total nutritional summary for the entire meal in the 'totalNutrients' object.

6.  **Structured Output**: Present the results in a clear, structured JSON format adhering to the output schema, showing each food, its individual nutrients, and the total nutrients for the meal.

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

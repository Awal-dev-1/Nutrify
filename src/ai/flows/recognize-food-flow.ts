
'use server';
/**
 * @fileOverview A Genkit flow for recognizing food items from an image.
 *
 * - recognizeFood - A function that handles the food recognition process.
 * - RecognizeFoodInput - The input type for the recognizeFood function.
 * - RecognizeFoodOutput - The return type for the recognizeFoodOutput function.
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
  userProfile: z.object({
    health: z.object({
      primaryGoal: z.string().optional(),
      dietaryPreferences: z.array(z.string()).optional(),
    }).optional(),
  }).optional().describe("The user's profile, including goals and dietary preferences/restrictions."),
});
export type RecognizeFoodInput = z.infer<typeof RecognizeFoodInputSchema>;

const AIPredictionSchema = FoodItemSchema.extend({
    confidence: z.number().optional().describe("The AI's confidence in this prediction, from 0 to 1."),
});
export type AIPrediction = z.infer<typeof AIPredictionSchema>;

const RecognizeFoodOutputSchema = z.object({
  isFood: z.boolean().describe("A boolean indicating if the image contains a food item."),
  predictions: z.array(AIPredictionSchema).describe("A list of predictions for the food item(s) in the image. This will contain a single item if confidence is high, or multiple (up to 2) suggestions if confidence is low."),
});
export type RecognizeFoodOutput = z.infer<typeof RecognizeFoodOutputSchema>;

export async function recognizeFood(input: RecognizeFoodInput): Promise<RecognizeFoodOutput> {
  return recognizeFoodFlow(input);
}

const recognizeFoodPrompt = ai.definePrompt({
  name: 'recognizeFoodPrompt',
  input: { schema: RecognizeFoodInputSchema },
  output: { schema: RecognizeFoodOutputSchema },
  prompt: `You are a professional nutritional vision AI for the Nutrify app, designed to be extremely fast. Your task is to analyze the provided food image and give a detailed, personalized nutritional breakdown based on the user's health profile.

--- USER PROFILE ---
Primary Goal: {{#if userProfile.health.primaryGoal}}{{userProfile.health.primaryGoal}}{{else}}Not specified{{/if}}
Dietary Preferences/Restrictions: {{#if userProfile.health.dietaryPreferences.length}}{{#each userProfile.health.dietaryPreferences}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}None{{/if}}

--- IMAGE TO ANALYZE ---
{{media url=photoDataUri}}

--- CRITICAL INSTRUCTIONS ---
1.  **Analyze Confidence**: First, analyze the image to identify the meal and determine your confidence level.
2.  **High Confidence (Confidence > 0.85)**:
    *   If you are highly confident, identify all food items and combine them into a single, descriptive \`foodName\` (e.g., "Banku with grilled tilapia and shito").
    *   Return a single, comprehensive prediction for the entire meal in the \`predictions\` array.
    *   Set a high \`confidence\` score (0 to 1) for this single prediction.
3.  **Low Confidence (Confidence <= 0.85)**:
    *   If you are not highly confident, return exactly two of the most likely alternative predictions as separate items in the \`predictions\` array.
    *   Each prediction must have its own distinct \`foodName\` and its respective \`confidence\` score.
4.  **For Each Prediction Returned**:
    *   Estimate the portion size visible in the image and set \`estimatedWeightGrams\`.
    *   Calculate total nutrition for that portion: \`calories\`, \`macronutrientBreakdown\`, and a comprehensive \`micronutrientBreakdown\`.
    *   Classify the food's \`suitability\` ('Suitable', 'Moderately Suitable', 'Not Suitable') based on the user's profile.
    *   Generate a detailed \`healthAnalysis\` explaining the suitability classification and providing actionable advice.
5.  **Final Output**: If the image is not food, set \`isFood\` to false and return an empty \`predictions\` array. Otherwise, set \`isFood\` to true and follow the instructions above to populate the \`predictions\` array.

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
      config: {
        temperature: 0.1,
        safetySettings: [
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_ONLY_HIGH',
          },
        ],
      },
    });
    if (!output) {
      throw new Error("The AI failed to analyze the image. The response was empty.");
    }
    return output;
  }
);

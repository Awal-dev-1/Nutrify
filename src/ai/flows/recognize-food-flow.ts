
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
    confidence: z.number().describe("The AI's confidence in this prediction, from 0 to 1.").optional(),
});
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
  prompt: `You are a professional nutritional vision AI for the Nutrify app, designed to be extremely fast. Your task is to analyze the provided food image and give a detailed, personalized nutritional breakdown based on the user's health profile.

--- USER PROFILE ---
Primary Goal: {{#if userProfile.health.primaryGoal}}{{userProfile.health.primaryGoal}}{{else}}Not specified{{/if}}
Dietary Preferences/Restrictions: {{#if userProfile.health.dietaryPreferences.length}}{{#each userProfile.health.dietaryPreferences}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}None{{/if}}

--- IMAGE TO ANALYZE ---
{{media url=photoDataUri}}

--- CRITICAL INSTRUCTIONS ---
1.  **Identify the Meal**: First, identify all food items in the image. Combine them into a single, descriptive \`foodName\` (e.g., "Banku with grilled tilapia and shito").
2.  **Estimate Portion**: Estimate the total weight of the entire meal in the image and set \`estimatedWeightGrams\`.
3.  **Calculate Total Nutrition**: Calculate the total nutritional values for the *entire* dish visible in the image. You must provide:
    * \`calories\`
    * \`macronutrientBreakdown\` (protein, carbohydrates, fat).
    * \`micronutrientBreakdown\`: Provide as many of the following as possible: fiber, sugar, sodium, calcium, iron, potassium, magnesium, zinc, phosphorus, iodine, selenium, copper, manganese, chromium, molybdenum, chloride, vitaminA, vitaminC, vitaminD, vitaminE, vitaminK, vitaminB1, vitaminB2, vitaminB3, vitaminB5, vitaminB6, vitaminB7, folate, vitaminB12.
4.  **Analyze and Classify**: Based on the user's ENTIRE profile (goal, preferences, allergies, etc.), you MUST classify the food into one of three categories and set the \`suitability\` field: 'Suitable', 'Moderately Suitable', 'Not Suitable'.
    *   **Not Suitable**: If the food directly violates a stated restriction (e.g., meat for a Vegan). This is a hard failure.
    *   **Moderately Suitable**: If the food is generally okay but has some drawbacks for the user (e.g., high in calories for a weight loss goal).
    *   **Suitable**: If the food aligns well with the user's goals and restrictions.
5.  **Generate Detailed Health Analysis**: You MUST generate a comprehensive \`healthAnalysis\` string. It must:
    *   Start by clearly stating your classification and the primary reason (e.g., "This meal is **Moderately Suitable** because while it provides good protein, the portion size is high in calories for your weight loss goal.").
    *   Explain the "why" in detail, referencing specific ingredients and your nutritional estimates.
    *   Provide actionable advice. If not fully suitable, suggest a modification (e.g., "Consider asking for less oil on the plantain") or a future alternative.
6.  **Complete All Fields**: Ensure the output contains a single prediction in the \`predictions\` array that represents the entire meal and includes all required fields from the schema, especially \`suitability\` and \`healthAnalysis\`.

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

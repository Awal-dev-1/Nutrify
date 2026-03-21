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

const AIPredictionSchema = FoodItemSchema.extend({
    confidence: z.number().min(0).max(1).describe("The AI's confidence in this prediction, from 0 to 1."),
});
export type AIPrediction = z.infer<typeof AIPredictionSchema>;


const RecognizeFoodOutputSchema = z.object({
  isFood: z.boolean().describe("A boolean indicating if the image contains a food item."),
  predictions: z.array(AIPredictionSchema).describe("A list of potential food items identified in the image. Should be empty if isFood is false."),
});
export type RecognizeFoodOutput = z.infer<typeof RecognizeFoodOutputSchema>;

export async function recognizeFood(input: RecognizeFoodInput): Promise<RecognizeFoodOutput> {
  return recognizeFoodFlow(input);
}

const recognizeFoodPrompt = ai.definePrompt({
  name: 'recognizeFoodPrompt',
  input: { schema: RecognizeFoodInputSchema },
  output: { schema: RecognizeFoodOutputSchema },
  prompt: `You are a Professional Nutritional Vision AI for the Nutrify app. You are designed for EXTREME speed. Your task is to analyze the food in the provided image with high-level precision. You must "deconstruct" the meal, identifying every individual component.

User's primary health goal: "{{#if userGoal}}{{userGoal}}{{else}}Not specified{{/if}}".

--- CRITICAL INSTRUCTIONS ---
1.  **Analyze Image for Food**: First, determine if the image contains food. If it is clearly not food (e.g., a car, an animal), you MUST set 'isFood' to false and return an empty 'predictions' array.

2.  **Identify Everything (Deconstruction Rule)**: Your primary task is to identify every single distinct food item and visible ingredient.
    *   **For Mixed Dishes**: If the image shows a mixed dish (e.g., Banku with Tilapia and pepper sauce, a salad, a stew), you MUST identify EACH primary component and accompaniment. Return each item (e.g., Banku, Grilled Tilapia, Shito) as a SEPARATE object in the 'predictions' array. Do not just name the dish; break it down.
    *   **For Single Items**: If the image shows only a single food item (e.g., just a bowl of fufu, one piece of chicken), you MUST return only ONE prediction object for that item. Do not invent accompaniments.

3.  **Portion & Nutrient Estimation (For EACH item)**: For each food component you identify, you MUST:
    a.  Visually estimate its specific weight in the image and provide this value in the \`estimatedWeightGrams\` field.
    b.  Calculate a comprehensive nutritional profile (\`calories\`, \`macronutrientBreakdown\`, \`micronutrientBreakdown\`) that corresponds DIRECTLY to that estimated weight.

4.  **Detailed Analysis (For EACH item)**:
    a.  Provide a confidence score (0.0 to 1.0). For items with lower confidence, this is especially important.
    b.  Provide a detailed and personalized \`healthAnalysis\` based on the user's goal.
    c.  Provide a detailed recipe in \`detailedRecipe\`.

5.  **No Results**: If it is food, but you cannot confidently identify it, return 'isFood' as true but with an empty 'predictions' array.

6.  **Return JSON**: Your entire output must be a single JSON object that strictly adheres to the provided output schema. Do NOT add a "Meal Summary" or any other fields not defined in the schema. The user interface will calculate the totals.

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

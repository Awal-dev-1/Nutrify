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
  prompt: `You are an expert nutritionist and food recognition AI for the Nutrify app, with a deep specialization in Ghanaian and West African foods. You are designed for EXTREME speed. Your task is to analyze the food in the provided image as quickly as possible and return detailed information for EACH and EVERY component.

User's primary health goal: "{{#if userGoal}}{{userGoal}}{{else}}Not specified{{/if}}".

CRITICAL INSTRUCTIONS:
1.  **Analyze the Image**: First, determine if the image contains food. If it is clearly not food (e.g., a car, an animal, a book), you MUST set 'isFood' to false and return an empty 'predictions' array.
2.  **Identify ALL Components (MANDATORY)**: If the image contains a mixed dish (e.g., Banku with Tilapia and pepper sauce), you MUST identify EACH primary component and accompaniment. For each identified item (e.g., Banku, Grilled Tilapia, Shito), return it as a SEPARATE object within the 'predictions' array. Even small garnishes or side salads must be identified as their own item.
3.  **Calculate Nutrients for EACH Component**: For each food component you identify, you MUST:
    a.  Visually estimate its specific weight in the image and provide this value in the \`estimatedWeightGrams\` field.
    b.  Calculate a comprehensive nutritional profile (\`calories\`, \`macronutrientBreakdown\`, \`micronutrientBreakdown\`) that corresponds DIRECTLY to that estimated weight.
4.  **Provide DETAILED Analysis for EACH component**:
    a.  For each prediction, provide a confidence score between 0.0 and 1.0.
    b.  If the food has a well-known local Ghanaian name, include it in parentheses in the 'foodName' field. For example, for "Red Red", you should return the name as "Red Red (Gobe)".
    c.  Provide a detailed and personalized \`healthAnalysis\`. For 'lose-weight', discuss calorie density and satiety. For 'gain-weight', discuss energy density. For 'eat-healthier', discuss nutrient balance.
    d.  Provide a detailed recipe in \`detailedRecipe\`.
5.  **Differentiate Ghanaian Staples**: Do NOT confuse staple foods. Fufu is a soft, sticky mass in soup. Banku is smoother than Kenkey. Kenkey is denser and steamed in leaves. "Red Red" is bean stew with fried plantain. Use the correct Ghanaian names.
6.  **No Results**: If it is food, but you cannot confidently identify it, return 'isFood' as true but with an empty "predictions" array.
7.  **Return JSON**: Your entire output must be a single JSON object that strictly adheres to the provided output schema.

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

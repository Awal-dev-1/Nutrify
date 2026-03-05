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
  prompt: `You are an expert nutritionist and food recognition AI for the Nutrify app, with a deep specialization in Ghanaian and West African foods. Your task is to analyze the food in the provided image and return detailed information.

User's primary health goal: "{{#if userGoal}}{{userGoal}}{{else}}Not specified{{/if}}".

CRITICAL INSTRUCTIONS:
1.  **Analyze the Image**: Carefully analyze the image provided. First, determine if the image contains food. If it is clearly not food (e.g., a car, an animal, a book), you MUST set 'isFood' to false and return an empty 'predictions' array.
2.  **Estimate Portion Size**: You MUST estimate the total weight of the food in grams (\`estimatedWeightGrams\`). This is a critical step for all subsequent calculations.
3.  **Calculate ALL Nutrients for the Portion**: For each potential food match, you MUST calculate a comprehensive nutritional profile for the estimated portion size. This includes:
    *   Total \`calories\`.
    *   \`macronutrientBreakdown\` (protein, carbohydrates, fat).
    *   A detailed \`micronutrientBreakdown\`, including fiber, sugar, iron, calcium, vitaminA, vitaminC, and sodium. If a nutrient is not present, omit it or set it to 0.
4.  **Provide DETAILED Health Analysis**: For each prediction, you MUST generate a detailed and personalized \`healthAnalysis\`. This is the most important part.
    *   Explain CLEARLY why the food is beneficial or detrimental based on the user's specific goal (e.g., 'lose-weight', 'gain-weight').
    *   Go beyond a single sentence. For 'lose-weight', discuss calorie density, fiber content for satiety, and protein for muscle maintenance. For 'gain-weight', discuss energy density and quality of macronutrients. For 'eat-healthier', discuss the balance of nutrients and vitamin/mineral content.
    *   Be specific. Instead of "good for weight loss", say "This portion of Banku is calorie-dense. While a good energy source, a smaller portion might be better for your weight loss goal. The accompanying Tilapia, however, is an excellent source of lean protein.".
5.  **Generate Other Details**: Also provide \`foodHistory\`, a \`detailedRecipe\` (if applicable), \`isGhanaianLocal\` status, and relevant \`tags\`.
6.  **Provide Confidence Score**: For each prediction, provide a confidence score between 0.0 and 1.0.
7.  **Return JSON**: Return a list of up to 3 potential matches. Your entire output must be a single JSON object that strictly adheres to the provided output schema. Do not add any commentary.
8.  **No Results**: If it is food, but you cannot confidently identify it, return 'isFood' as true but with an empty "predictions" array.

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

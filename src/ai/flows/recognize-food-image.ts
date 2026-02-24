'use server';
/**
 * @fileOverview A Genkit flow for recognizing food items from an image and estimating their nutritional content.
 *
 * - recognizeFoodImage - A function that handles the food recognition process.
 * - RecognizeFoodImageInput - The input type for the recognizeFoodImage function.
 * - RecognizeFoodImageOutput - The return type for the recognizeFoodImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RecognizeFoodImageInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a meal or food, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type RecognizeFoodImageInput = z.infer<typeof RecognizeFoodImageInputSchema>;

const FoodItemSchema = z.object({
  foodName: z.string().describe('The identified name of the food item.'),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe('The confidence score (0-1) of the identification.'),
  estimatedNutrients: z.object({
    calories: z.number().describe('Estimated calories for a typical serving in kcal.'),
    protein: z.number().describe('Estimated protein for a typical serving in grams.'),
    carbs: z.number().describe('Estimated carbohydrates for a typical serving in grams.'),
    fat: z.number().describe('Estimated fat for a typical serving in grams.'),
    fiber: z.number().describe('Estimated fiber for a typical serving in grams.'),
    iron: z.number().describe('Estimated iron for a typical serving in milligrams.'),
    vitaminA: z.number().describe('Estimated Vitamin A for a typical serving in micrograms RAE.'),
    sodium: z.number().describe('Estimated sodium for a typical serving in milligrams.'),
  }),
});

const RecognizeFoodImageOutputSchema = z.object({
  identifiedFoods: z
    .array(FoodItemSchema)
    .describe('An array of identified food items with their estimated nutritional content.'),
  generalDescription: z
    .string()
    .optional()
    .describe('An optional general description of the meal or plate.'),
});
export type RecognizeFoodImageOutput = z.infer<typeof RecognizeFoodImageOutputSchema>;

export async function recognizeFoodImage(
  input: RecognizeFoodImageInput
): Promise<RecognizeFoodImageOutput> {
  return recognizeFoodImageFlow(input);
}

const recognizeFoodImagePrompt = ai.definePrompt({
  name: 'recognizeFoodImagePrompt',
  input: {schema: RecognizeFoodImageInputSchema},
  output: {schema: RecognizeFoodImageOutputSchema},
  model: 'googleai/gemini-1.5-flash',
  prompt: `You are an expert nutritionist and food identifier. Your task is to analyze the provided image of food and identify all distinct food items present. For each identified food item, provide its name, a confidence score (between 0 and 1), and a detailed estimation of its nutritional content (calories, protein, carbs, fat, fiber, iron, vitamin A, sodium) for a typical serving size. Be as accurate as possible with the nutritional estimates.

Consider common Ghanaian foods and serving sizes where applicable. Provide the output in a JSON array format as described by the output schema.

Image: {{media url=photoDataUri}}`,
});

const recognizeFoodImageFlow = ai.defineFlow(
  {
    name: 'recognizeFoodImageFlow',
    inputSchema: RecognizeFoodImageInputSchema,
    outputSchema: RecognizeFoodImageOutputSchema,
  },
  async input => {
    const {output} = await recognizeFoodImagePrompt(input);
    if (!output) {
      throw new Error('Failed to identify food from image.');
    }
    return output;
  }
);

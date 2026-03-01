'use server';
/**
 * @fileOverview A Genkit flow for recognizing food items from an image and estimating their nutritional content, history, and health impact.
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
  userGoal: z.string().optional().describe("The user's main health goal (e.g., 'weight-loss')."),
});
export type RecognizeFoodImageInput = z.infer<typeof RecognizeFoodImageInputSchema>;

const FoodAnalysisSchema = z.object({
    foodName: z.string().describe("The specific name of the identified food."),
    calories: z.number().describe("An estimated calorie count for the portion shown."),
    macronutrientBreakdown: z.object({
        protein: z.number().describe("Grams of protein."),
        carbohydrates: z.number().describe("Grams of carbohydrates."),
        fat: z.number().describe("Grams of fat."),
    }),
    micronutrientBreakdown: z.array(z.string()).describe('A list of key vitamins and minerals and their amounts (e.g., "Iron: 10mg", "Vitamin C: 500IU").'),
    possibleRecipes: z.array(z.string()).describe("A few suggested recipes or variations for the identified meal."),
    foodHistory: z.string().describe("A short, interesting history about the food's origin or cultural significance."),
    healthAnalysis: z.string().describe("Personalized health analysis based on the user's goal."),
});

export type FoodAnalysis = z.infer<typeof FoodAnalysisSchema>;

const RecognizeFoodImageOutputSchema = z.object({
    isFood: z.boolean().describe("A boolean indicating if the image contains food."),
    message: z.string().optional().describe("A message indicating success or the reason for failure."),
    data: FoodAnalysisSchema.nullable().describe("The identified food data, or null if it's not food."),
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
  prompt: `You are a "Food-Only" AI assistant. Your sole purpose is to identify and process food items.

Strict Validation Rule:

If the user uploads an image that is not a food item, a drink, or a grocery product, you must return the specific JSON rejection format. DO NOT attempt to describe non-food items (e.g., if shown a car, do not say "This is a red car"). Instead, immediately trigger the rejection response.

Required Rejection Format:
{
  "isFood": false,
  "message": "This is not a food item. Please upload a photo of food or a menu.",
  "data": null
}

If the image contains food, your task is to analyze the meal and provide a detailed nutritional breakdown, a compelling history, and a personalized health analysis based on the user's goal. If you recognize a specific regional dish (e.g., Ghanaian Waakye), name it correctly. Set 'isFood' to true.

The user's main health goal is "{{#if userGoal}}{{userGoal}}{{else}}Not specified{{/if}}".

From the image, provide the following information only if 'isFood' is true:

- foodName: The specific name of the identified food.
- calories: An estimated calorie count for the portion shown.
- macronutrientBreakdown: A breakdown of protein, carbohydrates, and fat in grams.
- micronutrientBreakdown: A list of key vitamins and minerals, including their amounts and units (e.g., "10mg", "500IU").
- possibleRecipes: Suggest a few recipes or variations for the identified meal.
- foodHistory: Provide a short, interesting history about the food's origin or cultural significance.
- healthAnalysis: Based on the user's goal ("{{userGoal}}"), you MUST provide a 'healthAnalysis'. This analysis should explain if the food is good or bad for their specific goal and why.
  - If the goal is "weight-loss", analyze if the food's calorie density and nutrient profile supports a caloric deficit.
  - If the goal is "muscle-gain", analyze if the food's protein and calorie content is beneficial for muscle synthesis.
  - If the goal is "maintenance", analyze if the food is a balanced choice for maintaining a healthy weight.
  - If no goal is provided, this can be a general health tip about the food.

Image of the food is below:
{{media url=photoDataUri}}`,
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


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
  prompt: `You are an expert culinary AI for Nutrify, specializing in identifying Ghanaian and West African foods from images. You are designed to be extremely fast and accurate. Your primary goal is to provide the most culturally relevant Ghanaian identification for any food image.

--- CORE DIRECTIVES ---
1.  **GHANAIAN FOOD FIRST**: Always assume the image contains Ghanaian or West African food. Prioritize identifying local dishes like Fufu, Banku, Kenkey, Waakye, Jollof Rice, Kelewele, Red Red, Groundnut Soup, etc.
2.  **DISTINGUISH SIMILAR FOODS (KEY INSTRUCTION)**: Pay close attention to subtle differences. For example, to tell **Banku** from **Kenkey**:
    *   **Kenkey** is almost always wrapped (in corn husks or plantain leaves), giving it a distinct shape and sometimes a patterned surface. It is very firm.
    *   **Banku** is smoother, typically served unwrapped in a bowl, and often has a softer, stickier appearance.
    Use these visual cues to make the correct identification. Apply this level of detail to all similar dishes.
3.  **INFER UNCOMMON DISHES (EXAMPLE: TUBAANI)**: For less common foods like **Tubaani**, you must infer it from its composition. If you see a steamed, soft, cake-like food made from beans (often with a pale cream/yellowish color), you must identify it as Tubaani (steamed bean pudding). Even if you haven't seen Tubaani before, the combination of "beans + steamed + pudding/cake" must lead you to this conclusion.
4.  **INTELLIGENT INFERENCE**: If you are not 100% confident, do not guess a generic name. Instead, infer the dish. Describe the visual characteristics (e.g., "pounded white starch," "leaf-wrapped steamed dough," "spicy fried plantain pieces") and map it to the closest known Ghanaian dish.
5.  **NO "UNKNOWN" FALLBACK**: You MUST NOT return "Unknown food" or a vague label like "dish". If you cannot identify a specific named dish, your fallback is to identify the primary ingredient and its preparation method (e.g., 'Fried Yam,' 'Grilled Tilapia,' 'Boiled Plantain').

--- USER CONTEXT (for personalization) ---
{{#if userProfile}}
The user's primary goal is '{{#if userProfile.health.primaryGoal}}{{userProfile.health.primaryGoal}}{{else}}Not specified{{/if}}'.
Their dietary preferences are: {{#if userProfile.health.dietaryPreferences.length}}{{#each userProfile.health.dietaryPreferences}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}None specified.{{/if}}
{{else}}
The user has not provided their profile. Provide a general health analysis.
{{/if}}

--- IMAGE TO ANALYZE ---
{{media url=photoDataUri}}

--- CRITICAL OUTPUT INSTRUCTIONS ---
1.  **Initial Analysis**: First, determine if the image contains food. If not, set 'isFood' to false and return an empty 'predictions' array. If it is food, proceed.
2.  **Identify Composite Meals**: If the image shows a meal with multiple distinct components (e.g., a main staple with a stew and a protein), your primary \`foodName\` should describe the entire plate (e.g., "Waakye with Shito and Fish", "Banku with Grilled Tilapia"). Your nutritional analysis must then be for the entire meal shown. If you are uncertain about the main dish, you may return up to 2 alternative predictions for the entire meal.
3.  **MANDATORY FIELDS FOR EVERY PREDICTION**: For every single food prediction you return, you MUST provide a full nutritional profile, including:
    *   \`foodName\`, \`estimatedWeightGrams\`, \`calories\`, \`macronutrientBreakdown\`, \`micronutrientBreakdown\`.
    *   **\`suitability\`**: You MUST classify the food as 'Suitable', 'Moderately Suitable', or 'Not Suitable'. Base this on the user context. If no context, use general health knowledge. This field is non-negotiable.
    *   **\`healthAnalysis\`**: You MUST provide a comprehensive analysis explaining your suitability rating. Personalize it if user context exists. This field is non-negotiable.

Provide your response strictly in the specified JSON format.`,
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

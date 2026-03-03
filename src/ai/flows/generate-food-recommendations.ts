'use server';
/**
 * @fileOverview A Genkit flow for generating personalized food recommendations.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// This schema represents a food item as it is passed to the AI.
// We simplify the field names for a cleaner prompt.
const AiFoodItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
  fiber: z.number().optional(),
  iron: z.number().optional(),
  calcium: z.number().optional(),
  sodium: z.number().optional(),
  isGhanaianLocal: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

const RecommendationItemSchema = z.object({
  foodId: z.string().describe("The original ID of the food item from the input list."),
  name: z.string().describe("The name of the recommended food."),
  calories: z.number().describe("Calories per 100g."),
  protein: z.number().describe("Protein in grams per 100g."),
  carbs: z.number().describe("Carbohydrates in grams per 100g."),
  fat: z.number().describe("Fat in grams per 100g."),
  micronutrients: z.object({
      fiber: z.number().optional(),
      iron: z.number().optional(),
      calcium: z.number().optional(),
      sodium: z.number().optional(),
  }).describe("A summary of key micronutrients per 100g."),
  reason: z.string().describe("A concise (1-2 sentences) explanation for why this food was recommended based on the user's goal."),
});

const GenerateFoodRecommendationsInputSchema = z.object({
  userProfile: z.object({
    primaryGoal: z.string().describe("User's primary health goal (e.g., 'lose-weight', 'gain-weight', 'maintain-weight')."),
    dietaryPreferences: z.array(z.string()).describe("An array of dietary restrictions or preferences (e.g., 'Vegan', 'Halal')."),
  }),
  userGoals: z.object({
    dailyCalorieGoal: z.number().describe("The user's target daily calorie intake."),
    proteinPercentageGoal: z.number().describe("Target percentage of daily calories from protein."),
    carbsPercentageGoal: z.number().describe("Target percentage of daily calories from carbohydrates."),
    fatPercentageGoal: z.number().describe("Target percentage of daily calories from fats."),
  }),
  availableFoods: z.array(AiFoodItemSchema).describe("A list of all available food items from the database."),
});

const GenerateFoodRecommendationsOutputSchema = z.object({
  recommendations: z.array(RecommendationItemSchema).describe("A list of 3-5 recommended food items, sorted by score."),
  insightTips: z.array(z.string()).describe("A list of 2-3 actionable, insightful tips based on the user's goal and the recommendations provided."),
});

export type GenerateFoodRecommendationsInput = z.infer<typeof GenerateFoodRecommendationsInputSchema>;
export type GenerateFoodRecommendationsOutput = z.infer<typeof GenerateFoodRecommendationsOutputSchema>;

export async function generateFoodRecommendations(input: GenerateFoodRecommendationsInput): Promise<GenerateFoodRecommendationsOutput> {
  return generateFoodRecommendationsFlow(input);
}

const generateFoodRecommendationsPrompt = ai.definePrompt({
  name: 'generateFoodRecommendationsPrompt',
  input: { schema: GenerateFoodRecommendationsInputSchema },
  output: { schema: GenerateFoodRecommendationsOutputSchema },
  prompt: `You are an expert nutritionist for the Nutrify app, specializing in Ghanaian and West African cuisine. You are designed to be fast. Your task is to generate personalized food recommendations for a user based on their profile, goals, and a list of available foods.

--- User Information ---
Primary Goal: {{userProfile.primaryGoal}}
Dietary Preferences: {{#if userProfile.dietaryPreferences.length}}{{#each userProfile.dietaryPreferences}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}None{{/if}}
Daily Calorie Goal: {{userGoals.dailyCalorieGoal}}
Target Macro Split (P/C/F): {{userGoals.proteinPercentageGoal}}% / {{userGoals.carbsPercentageGoal}}% / {{userGoals.fatPercentageGoal}}%

--- Instructions ---
1.  **Filter Foods**: From the \`availableFoods\` list provided below, first filter out any foods that do not match the user's \`dietaryPreferences\`. Check the 'tags' array for each food. Then, exclude any single food item that has more than 70% of the user's total \`dailyCalorieGoal\`.
2.  **Select Foods**: Based on the user's \`primaryGoal\`, select the most appropriate foods from the filtered list. Your selection MUST prioritize Ghanaian and other West African local foods (\`isGhanaianLocal\` is true).
    *   **If goal is 'lose-weight'**: Prioritize foods that are lower in calories and higher in protein.
    *   **If goal is 'gain-weight'**: Prioritize foods that are higher in calories and protein.
    *   **If goal is 'maintain-weight' or 'eat-healthier'**: Prioritize balanced, nutrient-dense foods.
3.  **Generate Recommendations**: For each of the top 3-5 foods, create the full recommendation object.
    *   **Nutrients**: Map the food properties (name, calories, protein, carbs, fat) directly. Include a \`micronutrients\` object with values for fiber, iron, calcium, and sodium from the input data.
    *   **Reason**: Create a short, encouraging \`reason\` (1-2 sentences) explaining why it's a good choice for their goal.
4.  **Generate Insight Tips**: Provide 2-3 actionable \`insightTips\` related to the user's goal and the recommendations provided.
5.  **Final Output**: Return the top 3-5 foods from the selection. Ensure the output strictly adheres to the JSON schema. Use the original 'id' from the food item as the 'foodId' in the output.

--- Available Foods ---
{{{json availableFoods}}}

Generate your response in the specified JSON format.
`,
});

const generateFoodRecommendationsFlow = ai.defineFlow(
  {
    name: 'generateFoodRecommendationsFlow',
    inputSchema: GenerateFoodRecommendationsInputSchema,
    outputSchema: GenerateFoodRecommendationsOutputSchema,
  },
  async (input) => {
    const { output } = await generateFoodRecommendationsPrompt(input, {
      config: { temperature: 0.2 },
    });
    if (!output) {
      return { recommendations: [], insightTips: [] };
    }
    // The prompt handles sorting and selection, so we just return the output.
    return output;
  }
);

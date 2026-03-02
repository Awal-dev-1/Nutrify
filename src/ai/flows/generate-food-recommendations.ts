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
  reason: z.string().describe("A concise explanation for why this food was recommended based on the user's goal."),
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
export type GenerateFoodRecommendationsInput = z.infer<typeof GenerateFoodRecommendationsInputSchema>;

const GenerateFoodRecommendationsOutputSchema = z.object({
  recommendations: z.array(RecommendationItemSchema).describe("A list of 3-5 recommended food items, sorted by score."),
  insightTips: z.array(z.string()).describe("A list of 2-3 actionable, insightful tips based on the user's goal and the recommendations provided."),
});
export type GenerateFoodRecommendationsOutput = z.infer<typeof GenerateFoodRecommendationsOutputSchema>;

export async function generateFoodRecommendations(input: GenerateFoodRecommendationsInput): Promise<GenerateFoodRecommendationsOutput> {
  return generateFoodRecommendationsFlow(input);
}

const generateFoodRecommendationsPrompt = ai.definePrompt({
  name: 'generateFoodRecommendationsPrompt',
  input: { schema: GenerateFoodRecommendationsInputSchema },
  output: { schema: GenerateFoodRecommendationsOutputSchema },
  prompt: `You are an expert nutritionist for the Nutrify app. Your task is to generate personalized food recommendations for a user based on their profile, goals, and a list of available foods.

--- User Information ---
Primary Goal: {{{userProfile.primaryGoal}}}
Dietary Preferences: {{#if userProfile.dietaryPreferences.length}}{{#each userProfile.dietaryPreferences}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}None{{/if}}
Daily Calorie Goal: {{{userGoals.dailyCalorieGoal}}}
Target Macro Split (P/C/F): {{{userGoals.proteinPercentageGoal}}% / {{{userGoals.carbsPercentageGoal}}% / {{{userGoals.fatPercentageGoal}}}%

--- Instructions ---
1.  **Filter Foods**: From the \`availableFoods\` list provided below, first filter out any foods that do not match the user's \`dietaryPreferences\`. Check the 'tags' array for each food.
2.  **Calorie Filter**: Exclude any single food item that has more than 70% of the user's total \`dailyCalorieGoal\`.
3.  **Score Filtered Foods**: Score the remaining foods based on the user's \`primaryGoal\`.
    *   **If goal is 'lose-weight'**: Prioritize lower-calorie, higher-protein foods. Base Score: 50. Add 30 points if calories < 400. Add 20 points if protein > 20. Add 10 points if fat < 15.
    *   **If goal is 'gain-weight'**: Prioritize higher-calorie, higher-protein/carb foods. Base Score: 50. Add 30 points if calories > 500. Add 20 points if protein > 25.
    *   **If goal is 'maintain-weight' or 'eat-healthier'**: Prioritize balanced, nutrient-dense foods. Give a higher score to foods with a macro split (protein/carbs/fat) that is closer to the user's target. Give a base score of 70 to all items that passed the filter.
4.  **Generate Recommendations**: For each of the top foods, create the full recommendation object.
    *   **Nutrients**: Map the food properties (name, calories, protein, carbs, fat) directly. Include a \`micronutrients\` object with values for fiber, iron, calcium, and sodium from the input data.
    *   **Reason**: Create a short, encouraging \`reason\` explaining why it's a good choice for their goal.
        *   Example for 'lose-weight': "High in protein to keep you full, and lower in calories."
        *   Example for 'gain-weight': "A high-energy meal to help you meet your calorie surplus goals."
        *   Example for 'maintain-weight': "A balanced and nutritious option to maintain your current weight."
5.  **Generate Insight Tips**: Provide 2-3 actionable \`insightTips\`. These should be general nutritional advice related to the user's goal.
    *   Example for 'lose-weight': "Remember to drink plenty of water, it can help you feel full."
    *   Example for 'gain-weight': "Try to eat every 3-4 hours to keep your body fueled for growth."
    *   Example for 'maintain-weight': "Focus on whole foods and listen to your body's hunger cues."
6.  **Sort and Select**: Sort all scored foods by their final score in descending order.
7.  **Add Randomness**: From the top 10 sorted foods, shuffle them slightly to ensure variety on each request.
8.  **Final Output**: Return the top 3-5 foods from the shuffled list. If fewer than 5 foods are available after filtering, return all of them. Ensure the output strictly adheres to the JSON schema. Use the original 'id' from the food item as the 'foodId' in the output.

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
    const { output } = await generateFoodRecommendationsPrompt(input);
    if (!output) {
      return { recommendations: [], insightTips: [] };
    }
    // The prompt handles sorting and selection, so we just return the output.
    return output;
  }
);

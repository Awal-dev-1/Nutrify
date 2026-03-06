'use server';
/**
 * @fileOverview A Genkit flow for generating personalized food recommendations.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const RecommendationItemSchema = z.object({
  foodId: z.string().describe("A unique kebab-case ID for the food item (e.g., 'jollof-rice-with-chicken')."),
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
  prompt: `You are an expert nutritionist for the Nutrify app, specializing in Ghanaian and West African cuisine. You are designed to be extremely fast. Your task is to generate personalized food recommendations for a user based on their profile and goals.

--- User Information ---
Primary Goal: {{userProfile.primaryGoal}}
Dietary Preferences: {{#if userProfile.dietaryPreferences.length}}{{#each userProfile.dietaryPreferences}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}None{{/if}}
Daily Calorie Goal: {{userGoals.dailyCalorieGoal}}
Target Macro Split (P/C/F): {{userGoals.proteinPercentageGoal}}% / {{userGoals.carbsPercentageGoal}}% / {{userGoals.fatPercentageGoal}}%

--- Instructions ---
1.  **Generate Recommendations**: Generate a list of 3-5 food items suitable for the user. Your selection MUST prioritize Ghanaian and other West African local foods.
    *   Based on the user's \`primaryGoal\`:
        *   'lose-weight': Prioritize foods lower in calories and higher in protein.
        *   'gain-weight': Prioritize foods higher in calories and protein.
        *   'maintain-weight' or 'eat-healthier': Prioritize balanced, nutrient-dense foods.
    *   Adhere to the user's \`dietaryPreferences\`.
2.  **Provide Full Nutritional Details**: For each recommended food, you MUST provide the following details, all calculated per 100g:
    *   \`foodId\`: Use the food's name in kebab-case (e.g., 'jollof-rice-with-chicken').
    *   \`name\`: The common name of the food.
    *   \`calories\`, \`protein\`, \`carbs\`, \`fat\`: All in grams per 100g.
    *   \`micronutrients\`: An object with optional values for \`fiber\`, \`iron\`, \`calcium\`, and \`sodium\`.
    *   \`reason\`: A short, encouraging explanation (1-2 sentences) explaining why it's a good choice for their goal.
3.  **Generate Insight Tips**: Provide 2-3 actionable \`insightTips\` related to the user's goal and the recommendations you've provided.
4.  **Final Output**: Ensure the output strictly adheres to the JSON schema.

Generate your response in the specified JSON format. Do not use any external food lists; generate the recommendations from your own knowledge base.`,
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

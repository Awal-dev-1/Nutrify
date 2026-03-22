
'use server';
/**
 * @fileOverview A Genkit flow for generating personalized daily recommendations, tips, and recipes.
 *
 * - generateDailyRecommendations - A function that handles the daily recommendation generation process.
 * - GenerateDailyRecommendationsInput - The input type for the generateDailyRecommendations function.
 * - GenerateDailyRecommendationsOutput - The return type for the generateDailyRecommendations function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateDailyRecommendationsInputSchema = z.object({
  calorieTarget: z.number().describe("User's daily calorie goal in kcal."),
  caloriesConsumed: z.number().describe('Calories the user has already consumed today.'),
  goals: z.string().describe('User\'s primary health goal (e.g., "Lose Weight").'),
  preferences: z.array(z.string()).describe('List of user\'s dietary preferences (e.g., "Vegan").'),
});
export type GenerateDailyRecommendationsInput = z.infer<typeof GenerateDailyRecommendationsInputSchema>;

const MealSuggestionSchema = z.object({
  mealType: z.string().describe("The suggested meal slot (e.g., 'Lunch', 'Dinner')."),
  name: z.string().describe('The name of the suggested food item.'),
  calories: z.number().describe('Estimated calories for the suggested portion.'),
  protein: z.number().describe('Estimated protein in grams.'),
  carbs: z.number().describe('Estimated carbohydrates in grams.'),
  fat: z.number().describe('Estimated fat in grams.'),
  portionSize: z.string().describe('A suggested portion size (e.g., "1 cup", "150g").'),
  reason: z.string().describe('A brief, encouraging reason why this meal is suggested.'),
});

const RecipeIdeaSchema = z.object({
  name: z.string().describe('The name of the recipe.'),
  prepTime: z.string().describe('Estimated preparation time (e.g., "15 minutes").'),
  calories: z.number().describe('Estimated calories per serving.'),
  description: z.string().describe('A short, appealing description of the recipe.'),
  ingredients: z.array(z.string()).describe('List of ingredients for the recipe.'),
  instructions: z.array(z.string()).describe('A brief, summarized list of preparation steps (2-3 steps max).'),
});

const GenerateDailyRecommendationsOutputSchema = z.object({
  mealSuggestions: z.array(MealSuggestionSchema).describe('A list of 3 specific meal suggestions for the rest of the day.'),
  aiTips: z.array(z.string()).describe('A list of 2-3 actionable, insightful tips based on the user\'s data.'),
  recipeIdeas: z.array(RecipeIdeaSchema).describe('A list of 2-3 new recipe ideas that align with the user\'s goals.'),
});
export type GenerateDailyRecommendationsOutput = z.infer<typeof GenerateDailyRecommendationsOutputSchema>;

export async function generateDailyRecommendations(input: GenerateDailyRecommendationsInput): Promise<GenerateDailyRecommendationsOutput> {
  return generateDailyRecommendationsFlow(input);
}

const generateDailyRecommendationsPrompt = ai.definePrompt({
  name: 'generateDailyRecommendationsPrompt',
  input: { schema: GenerateDailyRecommendationsInputSchema },
  output: { schema: GenerateDailyRecommendationsOutputSchema },
  prompt: `You are a world-class nutritionist and personal motivation coach with a deep specialization in Ghanaian and West African foods, designed to be extremely fast. A user needs personalized recommendations based on their daily progress and goals.

Analyze the user's data below:
- Calorie Goal: {{{calorieTarget}}} kcal
- Consumed So Far: {{{caloriesConsumed}}} kcal
- Primary Goal: {{{goals}}}
- Dietary Preferences: {{#if preferences.length}}{{#each preferences}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}None{{/if}}

Your task is to generate a set of recommendations to help the user achieve their goals for the rest of the day.

1.  **Meal Suggestions:** Provide 3 specific meal suggestions (e.g., for breakfast, lunch, or dinner) that fit within their remaining calorie budget. For each meal, provide the mealType, name, estimated calories, protein, carbs, fat, a suggested portionSize, and a brief reason for the suggestion.
2.  **AI Tips:** Provide 2-3 actionable, insightful tips. These should be directly related to the user's data (e.g., if they are low on protein, give a tip about protein sources).
3.  **Recipe Ideas:** Provide 2-3 new and interesting recipe ideas that align with their goals and preferences. For each recipe, include the name, prep time, calories, a short description, a list of ingredients, and a brief, summarized list of preparation instructions (2-3 steps max).

Strongly prioritize Ghanaian and other West African dishes in all suggestions. Be encouraging and supportive in your tone.

Generate the output in JSON format according to the provided schema.`,
});

const generateDailyRecommendationsFlow = ai.defineFlow(
  {
    name: 'generateDailyRecommendationsFlow',
    inputSchema: GenerateDailyRecommendationsInputSchema,
    outputSchema: GenerateDailyRecommendationsOutputSchema,
  },
  async (input) => {
    const { output } = await generateDailyRecommendationsPrompt(input, {
      config: {
        temperature: 0.2,
        safetySettings: [
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_ONLY_HIGH',
          },
        ],
      },
    });
    if (!output) {
      throw new Error("The AI failed to generate daily recommendations. The response was empty.");
    }
    return output;
  }
);

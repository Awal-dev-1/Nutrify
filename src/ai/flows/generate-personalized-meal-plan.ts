
'use server';
/**
 * @fileOverview A Genkit flow for generating a personalized weekly meal plan based on user's dietary goals, preferences, and tracked nutrient intake.
 *
 * - generatePersonalizedMealPlan - A function that handles the personalized meal plan generation process.
 * - GeneratePersonalizedMealPlanInput - The input type for the generatePersonalizedMealPlan function.
 * - GeneratePersonalizedMealPlanOutput - The return type for the generatePersonalizedMealPlan function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// A single planned meal item. This will be part of a flat list.
const PlannedMealItemSchema = z.object({
  day: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']).describe('The day of the week for the meal.'),
  mealType: z.enum(['Breakfast', 'Lunch', 'Dinner']).describe("The type of meal (e.g., 'Breakfast')."),
  foodName: z.string().describe('Name of the food item.'),
  quantityGrams: z.number().describe('The recommended quantity of this food item in grams.'),
  calories: z.number().describe('Calories for this food item at the recommended quantity.'),
  proteinGrams: z.number().optional().describe('Protein in grams for this food item.'),
  carbsGrams: z.number().optional().describe('Carbohydrates in grams for this food item.'),
  fatGrams: z.number().optional().describe('Fat in grams for this food item.'),
});

const GeneratePersonalizedMealPlanInputSchema = z.object({
  // Personal Details (Flattened)
  gender: z.enum(['male', 'female', 'other']).describe("User's gender."),
  age: z.number().min(0).max(120).describe("User's age in years."),
  heightCm: z.number().min(50).max(250).describe("User's height in centimeters."),
  weightKg: z.number().min(20).max(300).describe("User's weight in kilograms."),
  activityLevel: z.enum(['low', 'moderate', 'active', 'very-active']).describe("User's physical activity level."),

  // Dietary Goals (Flattened)
  goal: z.enum(['lose weight', 'maintain weight', 'gain weight', 'eat healthier']).describe('Overall dietary goal.'),
  targetCalories: z.number().optional().describe('Optional: Target daily calorie intake.'),
  proteinPercentageGoal: z.number().min(0).max(100).describe('Target protein percentage.'),
  carbsPercentageGoal: z.number().min(0).max(100).describe('Target carbohydrate percentage.'),
  fatPercentageGoal: z.number().min(0).max(100).describe('Target fat percentage.'),
  ironTargetMg: z.number().min(0).optional().describe('Optional: Target daily Iron intake in mg.'),
  vitaminATargetMcg: z.number().min(0).optional().describe('Optional: Target daily Vitamin A in mcg.'),
  
  // Dietary Preferences
  dietaryPreferences: z.array(z.string()).describe("List of user's dietary preferences (e.g., Vegan, Halal)."),
  
  // Recent Nutrient Intake (Flattened)
  averageDailyCalories: z.number().describe('Average daily calorie intake.'),
  averageDailyProtein: z.number().describe('Average daily protein intake in grams.'),
  averageDailyCarbs: z.number().describe('Average daily carbohydrate intake in grams.'),
  averageDailyFat: z.number().describe('Average daily fat in grams.'),
  averageDailyIron: z.number().describe('Average daily Iron intake in mg.'),
  averageDailyVitaminA: z.number().describe('Average daily Vitamin A in mcg.'),
  recentDeficiencies: z.array(z.string()).optional().describe('Optional: List of recently detected nutrient deficiencies.'),
  recentExcesses: z.array(z.string()).optional().describe('Optional: List of recently detected nutrient excesses.'),
});
export type GeneratePersonalizedMealPlanInput = z.infer<typeof GeneratePersonalizedMealPlanInputSchema>;

const GeneratePersonalizedMealPlanOutputSchema = z.object({
  plannedMeals: z.array(PlannedMealItemSchema).describe('A flat list of all planned meals for the entire week.'),
  planSummary: z.string().describe('A summary of the generated meal plan, highlighting how it meets the user\'s goals and preferences.'),
});
export type GeneratePersonalizedMealPlanOutput = z.infer<typeof GeneratePersonalizedMealPlanOutputSchema>;

export async function generatePersonalizedMealPlan(input: GeneratePersonalizedMealPlanInput): Promise<GeneratePersonalizedMealPlanOutput> {
  return generatePersonalizedMealPlanFlow(input);
}

const generatePersonalizedMealPlanPrompt = ai.definePrompt({
  name: 'generatePersonalizedMealPlanPrompt',
  input: { schema: GeneratePersonalizedMealPlanInputSchema },
  output: { schema: GeneratePersonalizedMealPlanOutputSchema },
  prompt: `You are an expert nutritionist and meal planner for "Nutrify", a smart nutrition platform with a deep focus on Ghanaian and broader West African cuisine. You are designed to be extremely fast.

--- CRITICAL INSTRUCTIONS ---
1.  **MANDATORY GHANAIAN FOCUS**: Your entire plan MUST be composed of primarily Ghanaian and other West African dishes. This is the most important instruction.
2.  **GENERATE PLAN QUICKLY**: Generate the full 7-day plan as quickly as possible.
3.  **FLAT LIST STRUCTURE**: The output must be a single flat array called 'plannedMeals'. Do NOT nest meals inside day objects.
4.  **PROVIDE NUTRIENTS**: For each meal item, you must provide the 'day', 'mealType', 'foodName', 'quantityGrams', 'calories', 'proteinGrams', 'carbsGrams', and 'fatGrams'.
5.  **ALIGN WITH GOALS**: The overall plan must align with the user's dietary goals and preferences, and address any nutrient deficiencies.
6.  **CONCISE SUMMARY**: Provide a brief 'planSummary'.

--- USER DATA ---
Gender: {{{gender}}}
Age: {{{age}}} years
Activity Level: {{{activityLevel}}}
Overall Goal: {{{goal}}}
Target Daily Calories: {{#if targetCalories}}{{{targetCalories}}} kcal{{else}}Not specified{{/if}}
Target Macros (P/C/F %): {{{proteinPercentageGoal}}}/{{{carbsPercentageGoal}}}/{{{fatPercentageGoal}}}
Dietary Preferences: {{#if dietaryPreferences.length}}{{#each dietaryPreferences}}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}None{{/if}}
Average Daily Intake (Calories): {{{averageDailyCalories}}} kcal

Generate the output in the required JSON format.`,
});

const generatePersonalizedMealPlanFlow = ai.defineFlow(
  {
    name: 'generatePersonalizedMealPlanFlow',
    inputSchema: GeneratePersonalizedMealPlanInputSchema,
    outputSchema: GeneratePersonalizedMealPlanOutputSchema,
  },
  async (input) => {
    // Round numeric inputs to avoid overly long prompts
    const cleanInput = {
      ...input,
      averageDailyCalories: Math.round(input.averageDailyCalories),
      averageDailyProtein: Math.round(input.averageDailyProtein),
      averageDailyCarbs: Math.round(input.averageDailyCarbs),
      averageDailyFat: Math.round(input.averageDailyFat),
      averageDailyIron: parseFloat(input.averageDailyIron.toFixed(1)),
      averageDailyVitaminA: Math.round(input.averageDailyVitaminA),
    };

    const { output } = await generatePersonalizedMealPlanPrompt(cleanInput, {
      config: {
        temperature: 0.2,
        safetySettings: [
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
        ],
      },
    });
    if (!output) {
      throw new Error("The AI failed to generate a meal plan. The response was empty.");
    }
    return output;
  }
);

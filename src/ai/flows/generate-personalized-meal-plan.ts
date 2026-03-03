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
  mealType: z.enum(['Breakfast', 'Lunch', 'Dinner', 'Snacks']).describe("The type of meal (e.g., 'Breakfast')."),
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
  activityLevel: z.enum(['low', 'moderate', 'active', 'very active']).describe("User's physical activity level."),

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
  prompt: `You are an expert nutritionist and meal planner for "Nutrify", a smart nutrition platform focused on Ghanaian users.
Your task is to generate a personalized weekly meal plan based on the user's details, goals, preferences, and recent nutrient intake.
The plan should be balanced, culturally appropriate (considering Ghanaian food if possible), and help the user achieve their health goals.

Here is the user's information:

--- User Profile ---
Gender: {{{gender}}}
Age: {{{age}}} years
Height: {{{heightCm}}} cm
Weight: {{{weightKg}}} kg
Activity Level: {{{activityLevel}}}

--- Dietary Goals ---
Overall Goal: {{{goal}}}
{{#if targetCalories}}Target Daily Calories: {{{targetCalories}}} kcal{{/if}}
Target Macronutrient Distribution (Percentages): Protein {{{proteinPercentageGoal}}}%, Carbs {{{carbsPercentageGoal}}}%, Fat {{{fatPercentageGoal}}}%
{{#if ironTargetMg}}Target Iron: {{{ironTargetMg}}} mg{{/if}}
{{#if vitaminATargetMcg}}Target Vitamin A: {{{vitaminATargetMcg}}} mcg{{/if}}

--- Dietary Preferences ---
{{#if dietaryPreferences.length}}
Preferences: {{#each dietaryPreferences}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
{{else}}
No specific dietary preferences.
{{/if}}

--- Recent Nutrient Intake (Daily Average) ---
Calories: {{{averageDailyCalories}}} kcal
Protein: {{{averageDailyProtein}}} g
Carbs: {{{averageDailyCarbs}}} g
Fat: {{{averageDailyFat}}} g
Iron: {{{averageDailyIron}}} mg
Vitamin A: {{{averageDailyVitaminA}}} mcg
{{#if recentDeficiencies.length}}
Recent Deficiencies Noted: {{#each recentDeficiencies}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
{{/if}}
{{#if recentExcesses.length}}
Recent Excesses Noted: {{#each recentExcesses}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
{{/if}}

--- Instructions for Meal Plan Generation ---
1.  Generate a FLAT LIST of meal items for a full 7-day week (Monday to Sunday).
2.  For each item in the list, you must specify the 'day' (e.g., 'Monday'), 'mealType' (e.g., 'Breakfast'), 'foodName', 'quantityGrams', and estimated nutritional information ('calories', 'proteinGrams', etc.).
3.  Do NOT nest meals inside days. The output must be a single array called 'plannedMeals'.
4.  Ensure the plan aligns with the user's \`Overall Goal\` and any specified \`Target Daily Calories\`, \`Target Macronutrient Distribution\`, and target micronutrients.
5.  Incorporate \`Dietary Preferences\`. For example, if 'Vegan' is selected, all meals must be vegan.
6.  Address any \`Recent Deficiencies\` by recommending foods rich in those nutrients. Avoid foods causing \`Recent Excesses\`.
7.  Prioritize healthy, whole foods and include a variety of Ghanaian dishes where appropriate.
8.  The total calories for each day should be consistent with the user's goals.
9.  Provide a concise \`planSummary\` explaining how the meal plan meets the user's specific needs and goals.

Generate the output in JSON format according to the provided schema.`,
});

const generatePersonalizedMealPlanFlow = ai.defineFlow(
  {
    name: 'generatePersonalizedMealPlanFlow',
    inputSchema: GeneratePersonalizedMealPlanInputSchema,
    outputSchema: GeneratePersonalizedMealPlanOutputSchema,
  },
  async (input) => {
    const { output } = await generatePersonalizedMealPlanPrompt(input, {
      config: { temperature: 0.2 },
    });
    if (!output) {
      throw new Error("The AI failed to generate a meal plan. The response was empty.");
    }
    return output;
  }
);

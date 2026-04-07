
'use server';
/**
 * @fileOverview A Genkit flow for generating personalized nutritional goals.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateNutrientGoalsInputSchema = z.object({
  gender: z.string().describe("User's gender."),
  age: z.number().describe("User's age in years."),
  heightCm: z.number().describe("User's height in centimeters."),
  weightKg: z.number().describe("User's weight in kilograms."),
  activityLevel: z.string().describe("User's physical activity level."),
  primaryGoal: z.string().describe("User's primary health goal (e.g., 'lose weight')."),
});

const GenerateNutrientGoalsOutputSchema = z.object({
  dailyCalorieGoal: z.number().describe("Recommended daily calorie intake."),
  proteinPercentageGoal: z.number().describe("Recommended protein percentage."),
  carbsPercentageGoal: z.number().describe("Recommended carbohydrate percentage."),
  fatPercentageGoal: z.number().describe("Recommended fat percentage."),
  ironTargetMg: z.number().describe("Recommended daily iron intake in mg."),
  calciumTargetMg: z.number().describe("Recommended daily calcium intake in mg."),
  magnesiumTargetMg: z.number().describe("Recommended daily magnesium intake in mg."),
  vitaminDTargetMcg: z.number().describe("Recommended daily Vitamin D intake in mcg."),
  vitaminATargetMcg: z.number().describe("Recommended daily Vitamin A intake in mcg."),
});

export type GenerateNutrientGoalsInput = z.infer<typeof GenerateNutrientGoalsInputSchema>;
export type GenerateNutrientGoalsOutput = z.infer<typeof GenerateNutrientGoalsOutputSchema>;

export async function generateNutrientGoals(input: GenerateNutrientGoalsInput): Promise<GenerateNutrientGoalsOutput> {
  return generateNutrientGoalsFlow(input);
}

const generateNutrientGoalsPrompt = ai.definePrompt({
  name: 'generateNutrientGoalsPrompt',
  input: { schema: GenerateNutrientGoalsInputSchema },
  output: { schema: GenerateNutrientGoalsOutputSchema },
  prompt: `You are an expert nutritionist. Based on the following user profile, calculate and recommend a full set of daily nutritional goals.

--- User Profile ---
- Gender: {{{gender}}}
- Age: {{{age}}}
- Height: {{{heightCm}}} cm
- Weight: {{{weightKg}}} kg
- Activity Level: {{{activityLevel}}}
- Primary Goal: {{{primaryGoal}}}

--- Instructions ---
1.  Calculate an appropriate daily calorie goal.
2.  Determine a balanced macronutrient split (protein, carbs, fat).
3.  Recommend targets for the following key micronutrients based on general health guidelines, gender, and age:
    - Iron (mg)
    - Calcium (mg)
    - Magnesium (mg)
    - Vitamin D (mcg)
    - Vitamin A (mcg)
4.  Return the response in the specified JSON format. The values should be reasonable and based on established nutritional science.
`,
});


const generateNutrientGoalsFlow = ai.defineFlow(
  {
    name: 'generateNutrientGoalsFlow',
    inputSchema: GenerateNutrientGoalsInputSchema,
    outputSchema: GenerateNutrientGoalsOutputSchema,
  },
  async (input) => {
    const { output } = await generateNutrientGoalsPrompt(input, {
        config: {
            temperature: 0.1
        }
    });
    if (!output) {
      throw new Error("The AI failed to generate nutrient goals.");
    }
    return output;
  }
);


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
  
  // All 27 micronutrients
  fiberTargetG: z.number().describe("Recommended daily Fiber intake in grams."),
  sugarTargetG: z.number().describe("Recommended daily Sugar limit in grams."),
  sodiumTargetMg: z.number().describe("Recommended daily Sodium limit in milligrams."),
  ironTargetMg: z.number().describe("Recommended daily Iron intake in mg."),
  calciumTargetMg: z.number().describe("Recommended daily Calcium intake in mg."),
  magnesiumTargetMg: z.number().describe("Recommended daily Magnesium intake in mg."),
  vitaminDTargetMcg: z.number().describe("Recommended daily Vitamin D intake in mcg."),
  vitaminATargetMcg: z.number().describe("Recommended daily Vitamin A intake in mcg."),
  vitaminCTargetMg: z.number().describe("Recommended daily Vitamin C intake in mg."),
  vitaminB12TargetMcg: z.number().describe("Recommended daily Vitamin B12 intake in mcg."),
  zincTargetMg: z.number().describe("Recommended daily Zinc intake in mg."),
  potassiumTargetMg: z.number().describe("Recommended daily Potassium intake in mg."),
  phosphorusTargetMg: z.number().describe("Recommended daily Phosphorus intake in milligrams."),
  iodineTargetMcg: z.number().describe("Recommended daily Iodine intake in micrograms."),
  seleniumTargetMcg: z.number().describe("Recommended daily Selenium intake in micrograms."),
  copperTargetMg: z.number().describe("Recommended daily Copper intake in milligrams."),
  manganeseTargetMg: z.number().describe("Recommended daily Manganese intake in milligrams."),
  chromiumTargetMcg: z.number().describe("Recommended daily Chromium intake in micrograms."),
  molybdenumTargetMcg: z.number().describe("Recommended daily Molybdenum intake in micrograms."),
  chlorideTargetMg: z.number().describe("Recommended daily Chloride intake in milligrams."),
  vitaminETargetMg: z.number().describe("Recommended daily Vitamin E intake in milligrams."),
  vitaminKTargetMcg: z.number().describe("Recommended daily Vitamin K intake in micrograms."),
  vitaminB1TargetMg: z.number().describe("Recommended daily Thiamine (B1) intake in milligrams."),
  vitaminB2TargetMg: z.number().describe("Recommended daily Riboflavin (B2) intake in milligrams."),
  vitaminB3TargetMg: z.number().describe("Recommended daily Niacin (B3) intake in milligrams."),
  vitaminB5TargetMg: z.number().describe("Recommended daily Pantothenic Acid (B5) intake in milligrams."),
  vitaminB6TargetMg: z.number().describe("Recommended daily Vitamin B6 intake in milligrams."),
  vitaminB7TargetMcg: z.number().describe("Recommended daily Biotin (B7) intake in micrograms."),
  folateTargetMcg: z.number().describe("Recommended daily Folate (B9) intake in micrograms."),
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
  prompt: `You are an expert nutritionist. Based on the following user profile, calculate and recommend a full set of daily nutritional goals, including all 27 key micronutrients.

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
3.  Recommend targets for the following 27 key micronutrients based on general health guidelines, gender, and age:
    - Fiber (g)
    - Sugar (g, as a limit)
    - Sodium (mg, as a limit)
    - Calcium (mg)
    - Iron (mg)
    - Potassium (mg)
    - Magnesium (mg)
    - Zinc (mg)
    - Phosphorus (mg)
    - Iodine (mcg)
    - Selenium (mcg)
    - Copper (mg)
    - Manganese (mg)
    - Chromium (mcg)
    - Molybdenum (mcg)
    - Chloride (mg)
    - Vitamin A (mcg)
    - Vitamin C (mg)
    - Vitamin D (mcg)
    - Vitamin E (mg)
    - Vitamin K (mcg)
    - Thiamine (B1) (mg)
    - Riboflavin (B2) (mg)
    - Niacin (B3) (mg)
    - Pantothenic Acid (B5) (mg)
    - Vitamin B6 (mg)
    - Biotin (B7) (mcg)
    - Folate (B9) (mcg)
    - Vitamin B12 (mcg)
4.  Return the response in the specified JSON format. The values should be reasonable and based on established nutritional science. The keys must match the output schema exactly (e.g., 'fiberTargetG', 'vitaminB1TargetMg').
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

    
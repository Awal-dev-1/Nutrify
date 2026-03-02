'use client';

import {
  collection,
  doc,
  getDoc,
  addDoc,
  setDoc,
  serverTimestamp,
  type Firestore,
} from 'firebase/firestore';
import type { UserProfile } from '@/firebase';
import {
  generateFoodRecommendations,
  type GenerateFoodRecommendationsInput,
} from '@/ai/flows/generate-food-recommendations';
import { searchFoods, type FoodItem } from '@/ai/flows/search-foods-flow';

export interface Recommendation {
  foodId: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  micronutrients: {
      fiber?: number;
      iron?: number;
      calcium?: number;
      sodium?: number;
  };
  reason: string;
}

export interface RecommendationResult {
  goal: string;
  recommendations: Recommendation[];
  insightTips: string[];
}

const getSearchQueriesForGoal = (goal: string): string[] => {
    switch (goal) {
        case 'lose-weight':
            return ["low calorie high protein ghanaian lunch", "healthy breakfast for weight loss", "light dinner ideas"];
        case 'gain-weight':
            return ["high calorie ghanaian dinner", "protein shake for muscle gain", "energy dense snacks"];
        case 'eat-healthier':
            return ["balanced ghanaian meal with vegetables", "quinoa salad with chicken", "omega-3 rich fish recipe"];
        case 'maintain-weight':
        default:
            return ["typical ghanaian lunch", "healthy pasta recipe", "balanced breakfast bowl"];
    }
}

export async function generateRecommendations(
  db: Firestore,
  userId: string
): Promise<RecommendationResult> {
  // Step 1: Fetch user data
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    throw new Error('User profile not found. Please complete onboarding.');
  }
  const userProfile = userSnap.data() as UserProfile;
  const primaryGoal = userProfile.health?.primaryGoal;
  const dietaryPreferences = userProfile.health?.dietaryPreferences;
  const goals = userProfile.goals;

  if (!primaryGoal || !goals?.dailyCalorieGoal) {
    throw new Error('Please set your goals to receive personalized recommendations.');
  }

  // Step 1.5: Use AI to generate a list of candidate foods
  const searchQueries = getSearchQueriesForGoal(primaryGoal);
  const foodPromises = searchQueries.map(query => searchFoods({ query, userGoal: primaryGoal }));
  const searchResults = await Promise.all(foodPromises);
  
  const foodMap = new Map<string, FoodItem>();
  searchResults.flatMap(result => result.foodItems).forEach(food => {
      if (!foodMap.has(food.foodName)) {
          foodMap.set(food.foodName, food);
      }
  });
  const candidateFoods = Array.from(foodMap.values());

  // Asynchronously populate the foodItems collection for recipe lookups later
  candidateFoods.forEach(food => {
      const foodRef = doc(db, 'foodItems', food.foodName);
      // This populates our DB for the "View Recipe" feature. We don't await this.
      setDoc(foodRef, food, { merge: true });
  });

  if (candidateFoods.length === 0) {
    throw new Error('AI was unable to generate any food suggestions. Please try again.');
  }

  // Step 2: Prepare input for the AI recommendation flow
  const flowInput: GenerateFoodRecommendationsInput = {
    userProfile: {
      primaryGoal: primaryGoal,
      dietaryPreferences: dietaryPreferences || [],
    },
    userGoals: {
      dailyCalorieGoal: goals.dailyCalorieGoal,
      proteinPercentageGoal: goals.proteinPercentageGoal,
      carbsPercentageGoal: goals.carbsPercentageGoal,
      fatPercentageGoal: goals.fatPercentageGoal,
    },
    availableFoods: candidateFoods.map(food => ({
        id: food.foodName, // Use the name as the ID
        name: food.foodName,
        calories: food.calories,
        protein: food.macronutrientBreakdown.protein,
        carbs: food.macronutrientBreakdown.carbohydrates,
        fat: food.macronutrientBreakdown.fat,
        fiber: food.micronutrientBreakdown?.fiber,
        iron: food.micronutrientBreakdown?.iron,
        calcium: food.micronutrientBreakdown?.calcium,
        sodium: food.micronutrientBreakdown?.sodium,
        tags: food.tags || []
    }))
  };

  // Step 3: Call the AI flow to get ranked recommendations
  const aiResult = await generateFoodRecommendations(flowInput);

  // Step 4: Save the result to user's history
  const recommendationsToStore = aiResult.recommendations.map(r => ({
    foodId: r.foodId,
    name: r.name,
    calories: r.calories,
    protein: r.protein,
    carbs: r.carbs,
    fat: r.fat,
    micronutrients: r.micronutrients,
    reason: r.reason,
    score: 0, // Score is an internal concept for the AI, not stored.
  }));

  const recommendationsCollectionRef = collection(db, 'users', userId, 'generatedRecommendations');
  await addDoc(recommendationsCollectionRef, {
    createdAt: serverTimestamp(),
    basedOnGoal: primaryGoal,
    recommendations: recommendationsToStore,
    insightTips: aiResult.insightTips,
  });

  // Step 5: Format the output for the frontend
  return {
    goal: primaryGoal,
    recommendations: aiResult.recommendations,
    insightTips: aiResult.insightTips,
  };
}

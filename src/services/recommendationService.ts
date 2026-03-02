'use client';

import {
  collection,
  doc,
  getDoc,
  addDoc,
  query,
  serverTimestamp,
  type Firestore,
} from 'firebase/firestore';
import type { UserProfile } from '@/firebase';
import {
  generateFoodRecommendations,
  type GenerateFoodRecommendationsInput,
} from '@/ai/flows/generate-food-recommendations';
import { mockFoods } from '@/lib/data';

// This type represents a food item as stored in the Firestore `foodItems` collection.
interface DbFoodItem {
  id: string;
  name: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  tags?: string[];
}

export interface Recommendation {
  foodId: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  reason: string;
}

export interface RecommendationResult {
  goal: string;
  recommendations: Recommendation[];
}

let allFoodsCache: DbFoodItem[] = []; // In-memory cache

async function getCachedFoods(db: Firestore): Promise<DbFoodItem[]> {
  if (allFoodsCache.length === 0) {
    allFoodsCache = mockFoods.map(food => ({
      id: food.id,
      name: food.name,
      caloriesPer100g: food.calories,
      proteinPer100g: food.protein,
      carbsPer100g: food.carbs,
      fatPer100g: food.fat,
      tags: food.tags,
    }));
  }
  return allFoodsCache;
}

export async function generateRecommendations(
  db: Firestore,
  userId: string
): Promise<RecommendationResult> {
  // Step 1: Fetch user data and food data
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

  const allFoods = await getCachedFoods(db);
  if (allFoods.length === 0) {
    throw new Error('No foods available in the database to make a recommendation.');
  }

  // Step 2: Prepare input for the AI flow
  const flowInput: GenerateFoodRecommendationsInput = {
    userProfile: {
      primaryGoal: primaryGoal,
      dietaryPreferences: dietaryPreferences || [],
    },
    userGoals: {
      dailyCalorieGoal: goals.dailyCalorieGoal,
    },
    availableFoods: allFoods.map(food => ({
        id: food.id,
        name: food.name,
        calories: food.caloriesPer100g,
        protein: food.proteinPer100g,
        carbs: food.carbsPer100g,
        fat: food.fatPer100g,
        tags: food.tags || []
    }))
  };

  // Step 3: Call the AI flow
  const aiResult = await generateFoodRecommendations(flowInput);

  // Step 4: Save the result to user's history
  const recommendationsToStore = aiResult.recommendations.map(r => ({
    foodId: r.foodId,
    name: r.name,
    calories: r.calories,
    protein: r.protein,
    carbs: r.carbs,
    fat: r.fat,
    reason: r.reason,
    score: 0, // Score is an internal concept for the AI, not stored.
  }));

  const recommendationsCollectionRef = collection(db, 'users', userId, 'generatedRecommendations');
  await addDoc(recommendationsCollectionRef, {
    createdAt: serverTimestamp(),
    basedOnGoal: primaryGoal,
    recommendations: recommendationsToStore,
  });

  // Step 5: Format the output for the frontend
  return {
    goal: primaryGoal,
    recommendations: aiResult.recommendations,
  };
}

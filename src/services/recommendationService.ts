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
  type GenerateFoodRecommendationsOutput,
} from '@/ai/flows/generate-food-recommendations';
import type { FoodItem } from '@/types/food';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

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
  detailedRecipe?: {
    ingredients: string[];
    instructions: string[];
  };
}

export interface RecommendationResult {
  goal: string;
  recommendations: Recommendation[];
  insightTips: string[];
}

// Main function to generate recommendations
export async function generateRecommendations(
  db: Firestore,
  userId: string
): Promise<RecommendationResult> {
  const userRef = doc(db, 'users', userId);
  let userSnap;
  try {
    userSnap = await getDoc(userRef);
  } catch (error) {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: userRef.path,
      operation: 'get',
    }));
    throw new Error("Could not fetch user profile. Please check your connection or permissions.");
  }

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

  // Directly prepare input for the single, powerful AI flow
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
  };

  // Single AI call to get recommendations
  const aiResult = await generateFoodRecommendations(flowInput);

  if (!aiResult || aiResult.recommendations.length === 0) {
      throw new Error("The AI couldn't generate any recommendations at this time. Please try again.");
  }
  
  // Non-blocking: Save the generated food details to the global foodItems collection for caching.
  // This allows us to have a recipe page for these items later.
  aiResult.recommendations.forEach(rec => {
    const foodItem: FoodItem = {
        foodName: rec.name,
        estimatedWeightGrams: 100, // Recommendations are per 100g
        calories: rec.calories,
        macronutrientBreakdown: {
            protein: rec.protein,
            carbohydrates: rec.carbs,
            fat: rec.fat,
        },
        micronutrientBreakdown: rec.micronutrients || {},
        isGhanaianLocal: true, // Assume local as per prompt
        detailedRecipe: rec.detailedRecipe || { ingredients: [], instructions: [] },
        foodHistory: '',
        healthAnalysis: rec.reason,
    };
    const foodDocRef = doc(db, 'foodItems', rec.foodId);
    setDoc(foodDocRef, foodItem, { merge: true }).catch(error => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: foodDocRef.path,
            operation: 'write',
            requestResourceData: foodItem,
        }));
    });
  });

  // Non-blocking: Store the set of recommendations for the user's history.
  const recommendationsToStore = {
    createdAt: serverTimestamp(),
    basedOnGoal: primaryGoal,
    recommendations: aiResult.recommendations.map(r => ({
        foodId: r.foodId,
        name: r.name,
        calories: r.calories,
        protein: r.protein,
        carbs: r.carbs,
        fat: r.fat,
        micronutrients: r.micronutrients,
        reason: r.reason,
        score: 0, // Score is no longer calculated, can be removed later
    })),
    insightTips: aiResult.insightTips,
  };

  const recommendationsCollectionRef = collection(db, 'users', userId, 'generatedRecommendations');
  addDoc(recommendationsCollectionRef, recommendationsToStore).catch(error => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: recommendationsCollectionRef.path,
        operation: 'create',
        requestResourceData: recommendationsToStore
    }));
  });

  // Return the result to the UI immediately.
  return {
    goal: primaryGoal,
    recommendations: aiResult.recommendations,
    insightTips: aiResult.insightTips,
  };
}

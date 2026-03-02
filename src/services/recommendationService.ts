'use client';

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  addDoc,
  query,
  serverTimestamp,
  type Firestore,
} from 'firebase/firestore';
import { format } from 'date-fns';
import type { UserProfile } from '@/firebase';
import type { DailyLog } from '@/types/analytics';
import type { FoodItem } from '@/types/food';

export interface Recommendation extends FoodItem {
  id: string;
  reason: string;
  matchScore: number;
}

export interface RecommendationResult {
  goal: string;
  recommendations: Recommendation[];
}

let allFoods: (FoodItem & { id: string })[] = []; // In-memory cache

async function getCachedFoods(db: Firestore): Promise<(FoodItem & { id: string })[]> {
  if (allFoods.length === 0) {
    const foodsQuery = query(collection(db, 'foodItems'), limit(100));
    const foodsSnap = await getDocs(foodsQuery);
    allFoods = foodsSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as FoodItem) }));
  }
  return allFoods;
}

export async function generateRecommendations(
  db: Firestore,
  userId: string
): Promise<RecommendationResult> {
  const userRef = doc(db, 'users', userId);
  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const dailyLogRef = doc(db, 'users', userId, 'dailyLogs', todayKey);

  const [userSnap, dailyLogSnap, foods] = await Promise.all([
    getDoc(userRef),
    getDoc(dailyLogRef),
    getCachedFoods(db),
  ]);

  if (!userSnap.exists()) {
    throw new Error('User profile not found. Please complete onboarding.');
  }
  const userProfile = userSnap.data() as UserProfile;
  const dailyLog = dailyLogSnap.exists() ? (dailyLogSnap.data() as DailyLog) : null;

  const primaryGoal = userProfile.health?.primaryGoal || 'maintain-weight';
  const calorieGoal = userProfile.goals?.dailyCalorieGoal || 2200;
  const currentCalories = dailyLog?.totalCalories || 0;
  const calorieRemaining = calorieGoal - currentCalories;

  const scoredFoods: Recommendation[] = foods.map(food => {
    let score = 0;
    let reason = 'A balanced and nutritious option.';
    const protein = food.macronutrientBreakdown.protein;
    const fat = food.macronutrientBreakdown.fat;

    if (primaryGoal === 'lose-weight') {
      if (food.calories < 400) score += 30;
      if (protein > 20) score += 20;
      if (fat < 15) score += 10;
      if (score > 30) reason = 'High in protein and low in calories for weight loss.';
    } else if (primaryGoal === 'gain-weight') {
      if (food.calories > 500) score += 30;
      if (protein > 25) score += 20;
      if (score > 30) reason = 'A high-energy meal to support weight gain.';
    } else {
      score += 20;
      reason = 'A balanced choice to help maintain your weight.'
    }

    if (calorieRemaining > 0 && food.calories > calorieRemaining * 1.2) {
      score -= 50;
    } else if (calorieRemaining > 0 && food.calories < calorieRemaining * 0.8) {
      score += 15;
    }

    return { ...food, reason, matchScore: score };
  });

  const topRecommendations = scoredFoods
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5);

  const recommendationsToStore = topRecommendations.map(r => ({
    foodId: r.id,
    name: r.foodName,
    calories: r.calories,
    protein: r.macronutrientBreakdown.protein,
    carbs: r.macronutrientBreakdown.carbohydrates,
    fat: r.macronutrientBreakdown.fat,
    reason: r.reason,
    score: r.matchScore,
  }));

  const recommendationsCollectionRef = collection(db, 'users', userId, 'generatedRecommendations');
  await addDoc(recommendationsCollectionRef, {
    createdAt: serverTimestamp(),
    basedOnGoal: primaryGoal,
    recommendations: recommendationsToStore,
  });

  return {
    goal: primaryGoal,
    recommendations: topRecommendations,
  };
}

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
import type { Food } from '@/lib/data';

// This matches the RecommendationItem entity
export interface Recommendation extends Food {
  reason: string;
  matchScore: number;
}

// This matches the return structure for the frontend
export interface RecommendationResult {
  goal: string;
  recommendations: Recommendation[];
}

let allFoods: Food[] = []; // In-memory cache for the global food list

// Fetches all foods from the 'foodItems' collection and caches them.
async function getCachedFoods(db: Firestore): Promise<Food[]> {
  if (allFoods.length === 0) {
    const foodsQuery = query(collection(db, 'foodItems'), limit(100));
    const foodsSnap = await getDocs(foodsQuery);
    allFoods = foodsSnap.docs.map(doc => ({ ...(doc.data() as Food), id: doc.id }));
  }
  return allFoods;
}

// Main function to generate recommendations.
export async function generateRecommendations(
  db: Firestore,
  userId: string
): Promise<RecommendationResult> {
  // 1. Fetch user profile, today's log, and food data
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

  // 2. Define goals and current state
  const primaryGoal = userProfile.health?.primaryGoal || 'maintain-weight';
  const calorieGoal = userProfile.goals?.dailyCalorieGoal || 2200;
  const currentCalories = dailyLog?.totalCalories || 0;
  const calorieRemaining = calorieGoal - currentCalories;

  // 3. Filter foods based on dietary preferences
  const userPreferences = userProfile.health?.dietaryPreferences?.map(p => p.toLowerCase()) || [];
  let filteredFoods = foods;

  if (userPreferences.length > 0 && !userPreferences.includes('none')) {
    filteredFoods = foods.filter(food => {
      const foodTags = food.tags.map(t => t.toLowerCase());
      return userPreferences.every(pref => foodTags.includes(pref));
    });
  }

  // 4. Score foods based on goals and current state
  const scoredFoods: Recommendation[] = filteredFoods.map(food => {
    let score = 0;
    let reason = 'A balanced and nutritious option.';

    // Goal-based scoring
    if (primaryGoal === 'lose-weight') {
      if (food.calories < 400) score += 30;
      if (food.protein > 20) score += 20;
      if (food.fat < 15) score += 10;
      if (score > 30) reason = 'High in protein and low in calories for weight loss.';
    } else if (primaryGoal === 'gain-weight') {
      if (food.calories > 500) score += 30;
      if (food.protein > 25) score += 20;
      if (score > 30) reason = 'A high-energy meal to support weight gain.';
    } else { // Maintain weight
      score += 20; // Base score for balanced foods
      reason = 'A balanced choice to help maintain your weight.'
    }

    // Adjust score based on remaining calories
    if (calorieRemaining > 0 && food.calories > calorieRemaining * 1.2) {
      score -= 50; // Heavily penalize foods that would push user way over the goal
    } else if (calorieRemaining > 0 && food.calories < calorieRemaining * 0.8) {
      score += 15; // Reward foods that fit well within remaining budget
    }

    return { ...food, reason, matchScore: score };
  });

  // 5. Sort and select top 5
  const topRecommendations = scoredFoods
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5);

  // 6. Store the generated recommendations in Firestore
  const recommendationsToStore = topRecommendations.map(r => ({
    foodId: r.id,
    name: r.name,
    calories: r.calories,
    protein: r.protein,
    carbs: r.carbs,
    fat: r.fat,
    reason: r.reason,
    score: r.matchScore,
  }));

  const recommendationsCollectionRef = collection(db, 'users', userId, 'generatedRecommendations');
  await addDoc(recommendationsCollectionRef, {
    createdAt: serverTimestamp(),
    basedOnGoal: primaryGoal,
    recommendations: recommendationsToStore,
  });

  // 7. Return the result for the frontend
  return {
    goal: primaryGoal,
    recommendations: topRecommendations,
  };
}

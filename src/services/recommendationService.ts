'use client';

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  type Firestore,
} from 'firebase/firestore';
import { format } from 'date-fns';
import type { UserProfile } from '@/firebase';
import type { DailyLog } from '@/types/analytics';
import type { Food } from '@/lib/data';

export interface Recommendation extends Food {
    reason: string;
    matchScore: number;
}

export interface RecommendationResult {
    calorieRemaining: number;
    goals: { calories: number; protein: number; carbs: number; fat: number; };
    macroStatus: {
        proteinDeficit: number;
        carbDeficit: number;
        fatDeficit: number;
    };
    recommendations: Recommendation[];
}

export async function getRecommendations(
  db: Firestore,
  userId: string
): Promise<RecommendationResult> {
  // 1. Fetch data in parallel
  const today = format(new Date(), 'yyyy-MM-dd');
  const userRef = doc(db, 'users', userId);
  const dailyLogRef = doc(db, 'users', userId, 'dailyLogs', today);
  const foodsQuery = query(collection(db, 'foodItems'), limit(100)); // Limit for performance

  const [userSnap, dailyLogSnap, foodsSnap] = await Promise.all([
    getDoc(userRef),
    getDoc(dailyLogRef),
    getDocs(foodsQuery),
  ]);

  // 2. Check for data existence
  if (!userSnap.exists()) {
    throw new Error('User profile not found. Please complete onboarding.');
  }
  const userProfile = userSnap.data() as UserProfile;
  const dailyLog = dailyLogSnap.exists()
    ? (dailyLogSnap.data() as DailyLog)
    : null;
  const allFoods = foodsSnap.docs.map(doc => ({ ...(doc.data() as Food), id: doc.id }));

  // 3. Calculate User State
  const goals = userProfile.goals || { dailyCalorieGoal: 2200, proteinPercentageGoal: 30, carbsPercentageGoal: 40, fatPercentageGoal: 30 };
  const intake = dailyLog || { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 };

  const calorieRemaining = goals.dailyCalorieGoal - intake.totalCalories;

  const proteinGoalGrams = (goals.dailyCalorieGoal * (goals.proteinPercentageGoal / 100)) / 4;
  const carbsGoalGrams = (goals.dailyCalorieGoal * (goals.carbsPercentageGoal / 100)) / 4;
  const fatGoalGrams = (goals.dailyCalorieGoal * (goals.fatPercentageGoal / 100)) / 9;

  const proteinProgress = proteinGoalGrams > 0 ? intake.totalProtein / proteinGoalGrams : 1;
  const carbsProgress = carbsGoalGrams > 0 ? intake.totalCarbs / carbsGoalGrams : 1;
  const fatProgress = fatGoalGrams > 0 ? intake.totalFat / fatGoalGrams : 1;

  const macroStatus = {
    proteinDeficit: Math.max(0, 1 - proteinProgress),
    carbDeficit: Math.max(0, 1 - carbsProgress),
    fatDeficit: Math.max(0, 1 - fatProgress),
  };

  // 4. Filter Foods
  const userPreferences = userProfile.health?.dietaryPreferences?.map(p => p.toLowerCase()) || [];
  let filteredFoods = allFoods;

  if (userPreferences.length > 0 && !userPreferences.includes('none')) {
    filteredFoods = allFoods.filter(food => {
      const foodTags = food.tags.map(t => t.toLowerCase());
      return userPreferences.every(pref => foodTags.includes(pref));
    });
  }

  // 5. Score Foods
  const scoredFoods: Recommendation[] = filteredFoods.map(food => {
    let score = 100;
    let reason = '';
    const primaryGoal = userProfile.health?.primaryGoal || 'maintain-weight';

    // Goal-based scoring
    if (primaryGoal === 'lose-weight') {
        if (food.calories > 450) score -= 40;
        if (food.calories < 350) score += 20;
        score += food.protein * 2;
        score -= food.fat * 1.5;
        score += (food.nutrients.fiber || 0) * 3;
    } else if (primaryGoal === 'gain-weight') {
        score += food.calories * 0.2;
        score += food.protein * 2.5;
        score += food.carbs * 1.5;
    } else { // maintain or eat-healthier
        score -= Math.abs(food.calories - 400) * 0.1;
        score += food.protein * 1.5;
        score += (food.nutrients.fiber || 0) * 2;
    }

    // Macro deficiency scoring
    if (macroStatus.proteinDeficit > 0.5) score += food.protein * (macroStatus.proteinDeficit * 2);
    if (macroStatus.carbDeficit > 0.6) score += food.carbs * macroStatus.carbDeficit;
    
    // Calorie remaining scoring
    if (food.calories > calorieRemaining && calorieRemaining > 0) {
      score -= 30; // Penalize foods that would make user exceed goal
    } else if (calorieRemaining < 200) { // If not many calories left, prioritize smaller meals
      if (food.calories > 300) score -= 50;
    }

    // Generate Reason
    if (food.protein > 20 && macroStatus.proteinDeficit > 0.4) {
      reason = 'Excellent source of protein to help you meet your daily target.';
    } else if (food.calories < 300 && primaryGoal === 'lose-weight') {
      reason = 'A low-calorie option to help you stay within your goals.';
    } else if ((food.nutrients.fiber || 0) > 5) {
      reason = 'High in fiber, which can help with satiety and digestion.';
    } else if (primaryGoal === 'gain-weight' && food.calories > 500) {
      reason = 'A calorie-dense choice to support your muscle-gaining goals.';
    } else {
      reason = 'A balanced and nutritious option to add to your day.';
    }
    
    // Time-based reason adjustments
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11 && food.category === 'Grains') {
      reason = 'A great high-energy start to your morning.';
    }
    if (hour >= 18 && food.calories < 400) {
      reason = 'A lighter, balanced option perfect for dinner.';
    }

    return { ...food, reason, matchScore: score };
  });

  // 6. Sort and return
  const recommendations = scoredFoods
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5);

  return {
    calorieRemaining,
    goals: {
        calories: goals.dailyCalorieGoal,
        protein: proteinGoalGrams,
        carbs: carbsGoalGrams,
        fat: fatGoalGrams,
    },
    macroStatus,
    recommendations,
  };
}

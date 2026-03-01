'use client';

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
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
  goals: { calories: number; protein: number; carbs: number; fat: number };
  macroStatus: {
    proteinDeficit: number;
    carbDeficit: number;
    fatDeficit: number;
  };
  recommendations: Recommendation[];
}

let allFoods: Food[] = []; // In-memory cache for the global food list

async function getCachedFoods(db: Firestore): Promise<Food[]> {
  if (allFoods.length === 0) {
    const foodsQuery = query(collection(db, 'foodItems'), limit(100));
    const foodsSnap = await getDocs(foodsQuery);
    allFoods = foodsSnap.docs.map(doc => ({ ...(doc.data() as Food), id: doc.id }));
  }
  return allFoods;
}

export function subscribeToRealtimeRecommendations(
  db: Firestore,
  userId: string,
  callback: (result: RecommendationResult) => void,
  onError: (error: Error) => void
): () => void {
  const processRecommendations = async (dailyLog: DailyLog | null) => {
    try {
      // 1. Fetch user profile and foods (uses cache for foods)
      const userRef = doc(db, 'users', userId);
      const [userSnap, foods] = await Promise.all([
        getDoc(userRef),
        getCachedFoods(db),
      ]);

      if (!userSnap.exists()) {
        throw new Error('User profile not found. Please complete onboarding.');
      }
      const userProfile = userSnap.data() as UserProfile;

      // 2. Calculate User State
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

      // 3. Filter Foods
      const userPreferences = userProfile.health?.dietaryPreferences?.map(p => p.toLowerCase()) || [];
      let filteredFoods = foods;

      if (userPreferences.length > 0 && !userPreferences.includes('none')) {
        filteredFoods = foods.filter(food => {
          const foodTags = food.tags.map(t => t.toLowerCase());
          return userPreferences.every(pref => foodTags.includes(pref));
        });
      }

      // 4. Score Foods
      const scoredFoods: Recommendation[] = filteredFoods.map(food => {
        let score = 100;
        let reason = '';
        const primaryGoal = userProfile.health?.primaryGoal || 'maintain-weight';

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
        } else {
            score -= Math.abs(food.calories - 400) * 0.1;
            score += food.protein * 1.5;
            score += (food.nutrients.fiber || 0) * 2;
        }

        if (macroStatus.proteinDeficit > 0.5) score += food.protein * (macroStatus.proteinDeficit * 2);
        if (macroStatus.carbDeficit > 0.6) score += food.carbs * macroStatus.carbDeficit;
        
        if (food.calories > calorieRemaining && calorieRemaining > 0) {
          score -= 30;
        } else if (calorieRemaining < 200 && food.calories > 300) {
          score -= 50;
        }

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
        
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 11 && food.category === 'Grains') {
          reason = 'A great high-energy start to your morning.';
        }
        if (hour >= 18 && food.calories < 400) {
          reason = 'A lighter, balanced option perfect for dinner.';
        }

        return { ...food, reason, matchScore: score };
      });

      // 5. Sort and return
      const recommendations = scoredFoods
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 5);

      const result: RecommendationResult = {
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

      callback(result);

    } catch (err: any) {
      onError(err);
    }
  };

  const today = format(new Date(), 'yyyy-MM-dd');
  const dailyLogRef = doc(db, 'users', userId, 'dailyLogs', today);

  const unsubscribe = onSnapshot(dailyLogRef, 
    (docSnap) => {
      const dailyLog = docSnap.exists() ? (docSnap.data() as DailyLog) : null;
      processRecommendations(dailyLog);
    },
    (err) => {
      console.error("Realtime recommendations listener error:", err);
      onError(err);
    }
  );

  return unsubscribe;
}

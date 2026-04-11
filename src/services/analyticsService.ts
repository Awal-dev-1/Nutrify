
'use client';

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
  type Firestore,
} from 'firebase/firestore';
import { format, subDays } from 'date-fns';
import type { UserProfile } from '@/firebase';
import type { DailyLog, AnalyticsData, AnalyticsSummary } from '@/types/analytics';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { ALL_TRACKABLE_NUTRIENT_KEYS, NUTRIENT_DRV, NUTRIENT_GOAL_KEYS, MicronutrientKey, NUTRIENT_UNITS, TrackableNutrientKey } from '@/lib/nutrients';

/**
 * Calculates summary metrics from a given array of analytics data.
 */
function calculateSummary(data: AnalyticsData[], goal: number): AnalyticsSummary {
  const numDays = data.length > 0 ? data.length : 1;

  const summary: Partial<AnalyticsSummary> = {};

  ALL_TRACKABLE_NUTRIENT_KEYS.forEach(key => {
    const total = data.reduce((acc, day) => acc + ((day as any)[key] || 0), 0);
    const averageKey = `average${key.charAt(0).toUpperCase() + key.slice(1)}` as keyof AnalyticsSummary;
    (summary as any)[averageKey] = total / numDays;
  });
  
  (summary as any).averageWaterIntake = data.reduce((acc, day) => acc + (day.waterIntake || 0), 0) / numDays;


  if (data.length === 0) {
    return {
      ...(summary as AnalyticsSummary),
      goalAchievementRate: 0, highestCalorieDay: null, lowestCalorieDay: null,
      consistencyScore: 0,
    };
  }

  const daysGoalMet = data.filter(d => d.calories > 0 && d.calories <= goal).length;
  
  const nonZeroDays = data.filter(d => d.calories > 0);
  const highestCalorieDay = [...nonZeroDays].sort((a, b) => b.calories - a.calories)[0] || null;
  const lowestCalorieDay = [...nonZeroDays].sort((a, b) => a.calories - b.calories)[0] || null;
  
  const averageCalories = summary.averageCalories || 0;
  const calorieVariance = data.reduce((acc, day) => acc + Math.abs(day.calories - averageCalories), 0) / data.length;
  const consistencyScore = Math.max(0, 100 - (calorieVariance / (goal * 0.25)) * 100);

  return {
    ...(summary as AnalyticsSummary),
    goalAchievementRate: (daysGoalMet / data.length) * 100,
    highestCalorieDay,
    lowestCalorieDay,
    consistencyScore: Math.min(100, consistencyScore),
  };
}


/**
 * Generates simple rule-based insights from the summary data.
 */
function generateInsights(summary: AnalyticsSummary, goals: any, period: number): string[] {
  const insights: string[] = [];

  if (summary.goalAchievementRate >= 80) {
    insights.push(`Excellent consistency! You met your calorie goal on ${summary.goalAchievementRate.toFixed(0)}% of the days.`);
  } else if (summary.goalAchievementRate >= 50) {
    insights.push(`Good job! You're meeting your calorie goal more than half the time.`);
  } else {
    insights.push(`Let's focus on consistency. You met your calorie goal ${summary.goalAchievementRate.toFixed(0)}% of the time.`);
  }

  if (summary.averageCalories > goals.calories * 1.1) {
    insights.push(`Your average calorie intake of ${summary.averageCalories.toFixed(0)} kcal is a bit above your goal.`);
  } else if (summary.averageCalories < goals.calories * 0.9) {
    insights.push(`Your average calorie intake of ${summary.averageCalories.toFixed(0)} kcal is slightly below your goal. Make sure you're eating enough!`);
  }

  if (summary.averageIron < goals.iron * 0.7) {
    insights.push(`You seem to be low on Iron. Consider iron-rich foods like spinach or lentils.`);
  }

  if (summary.consistencyScore >= 85) {
    insights.push(`Your daily intake is very consistent, which is great for stable energy levels.`);
  }

  return insights;
}

const createEmptyAnalyticsData = (days: number, today: Date, goals: any): any => {
    const chartData: AnalyticsData[] = [];
    
    for (let i = 0; i < days; i++) {
        const date = subDays(today, days - 1 - i);
        const dateKey = format(date, 'yyyy-MM-dd');
        const emptyDay: any = { date: dateKey, goal: goals.calories, waterIntake: 0 };
        ALL_TRACKABLE_NUTRIENT_KEYS.forEach(key => {
            emptyDay[key] = 0;
        });
        chartData.push(emptyDay as AnalyticsData);
    }
    
    return {
        chartData,
        summary: calculateSummary(chartData, goals.calories),
        insights: ["Log your first meal to start seeing personalized analytics."],
        goals: goals,
        loggedDaysCount: 0,
    };
};

/**
 * Fetches and processes analytics data for a given user and timeframe.
 */
export async function getAnalyticsData(
  db: Firestore,
  userId: string,
  timeframe: '7d' | '30d' | '90d'
) {
  const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
  const today = new Date();
  const startDate = format(subDays(today, days - 1), 'yyyy-MM-dd');

  // 1. Fetch user goals
  const userDocRef = doc(db, 'users', userId);
  let userDocSnap;
  try {
    userDocSnap = await getDoc(userDocRef);
  } catch (error) {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: userDocRef.path,
      operation: 'get',
    }));
    throw error;
  }
  
  const defaultGoals = { calories: 2000, protein: 120, carbs: 250, fat: 70, water: 8, ...NUTRIENT_DRV };

  if (!userDocSnap.exists()) {
    console.warn(`Analytics Service: User profile not found for user ${userId}. Returning empty data.`);
    return createEmptyAnalyticsData(days, today, defaultGoals);
  }

  const userProfile = userDocSnap.data() as UserProfile;
  const calorieGoal = userProfile.goals?.dailyCalorieGoal || 2000;
  
  const goals: Record<string, number> = {
    calories: calorieGoal,
    protein: (calorieGoal * ((userProfile.goals?.proteinPercentageGoal || 30) / 100)) / 4,
    carbs: (calorieGoal * ((userProfile.goals?.carbsPercentageGoal || 40) / 100)) / 4,
    fat: (calorieGoal * ((userProfile.goals?.fatPercentageGoal || 30) / 100)) / 9,
    water: 8, // Default water goal
  };

  NUTRIENT_GOAL_KEYS.forEach(goalKey => {
      const nutrientKey = goalKey.replace(/Target(G|Mg|Mcg)$/, '') as MicronutrientKey;
      goals[nutrientKey] = (userProfile.goals as any)?.[goalKey] ?? NUTRIENT_DRV[nutrientKey] ?? 0;
  });


  // 2. Fetch daily logs for the period
  const logsQuery = query(
    collection(db, 'users', userId, 'dailyLogs'),
    where('__name__', '>=', startDate),
    orderBy('__name__', 'asc')
  );
  let querySnapshot;
  try {
    querySnapshot = await getDocs(logsQuery);
  } catch (error) {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: `users/${userId}/dailyLogs`,
      operation: 'list',
    }));
    throw error;
  }

  const logsByDate = new Map<string, DailyLog>();
  querySnapshot.forEach((doc) => {
    logsByDate.set(doc.id, doc.data() as DailyLog);
  });

  // 3. Create chart data, filling in missing days
  const chartData: AnalyticsData[] = [];
  for (let i = 0; i < days; i++) {
    const date = subDays(today, days - 1 - i);
    const dateKey = format(date, 'yyyy-MM-dd');
    const log = logsByDate.get(dateKey);

    const dayData: any = { date: dateKey, goal: calorieGoal, waterIntake: log?.waterIntake || 0 };
    ALL_TRACKABLE_NUTRIENT_KEYS.forEach(key => {
        const totalKey = `total${key.charAt(0).toUpperCase() + key.slice(1)}`;
        dayData[key] = (log as any)?.[totalKey] || 0;
    });

    chartData.push(dayData as AnalyticsData);
  }

  const loggedDaysCount = chartData.filter(day => day.calories > 0).length;

  // 4. Calculate summary and insights
  const summary = calculateSummary(chartData, calorieGoal);
  const insights = generateInsights(summary, goals, days);

  // 5. Return structured data
  return {
    chartData,
    summary,
    insights,
    goals,
    loggedDaysCount,
  };
}

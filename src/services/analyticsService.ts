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

/**
 * Calculates summary metrics from a given array of analytics data.
 */
function calculateSummary(data: AnalyticsData[], goal: number): AnalyticsSummary {
  if (data.length === 0) {
    return {
      averageCalories: 0,
      averageProtein: 0,
      averageCarbs: 0,
      averageFat: 0,
      averageIron: 0,
      averageVitaminA: 0,
      averageSodium: 0,
      goalAchievementRate: 0,
      highestCalorieDay: null,
      lowestCalorieDay: null,
      consistencyScore: 0,
    };
  }

  const total = data.reduce(
    (acc, day) => {
      acc.calories += day.calories;
      acc.protein += day.protein;
      acc.carbs += day.carbs;
      acc.fat += day.fat;
      acc.iron += day.iron || 0;
      acc.vitaminA += day.vitaminA || 0;
      acc.sodium += day.sodium || 0;
      if (day.calories > 0 && day.calories <= goal) {
        acc.daysGoalMet++;
      }
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0, iron: 0, vitaminA: 0, sodium: 0, daysGoalMet: 0 }
  );

  const nonZeroDays = data.filter(d => d.calories > 0);
  const highestCalorieDay = [...nonZeroDays].sort((a, b) => b.calories - a.calories)[0] || null;
  const lowestCalorieDay = [...nonZeroDays].sort((a, b) => a.calories - b.calories)[0] || null;
  
  const averageCalories = total.calories / data.length;
  const calorieVariance = data.reduce((acc, day) => acc + Math.abs(day.calories - averageCalories), 0) / data.length;
  const consistencyScore = Math.max(0, 100 - (calorieVariance / (goal * 0.25)) * 100);

  return {
    averageCalories: averageCalories,
    averageProtein: total.protein / data.length,
    averageCarbs: total.carbs / data.length,
    averageFat: total.fat / data.length,
    averageIron: total.iron / data.length,
    averageVitaminA: total.vitaminA / data.length,
    averageSodium: total.sodium / data.length,
    goalAchievementRate: (total.daysGoalMet / data.length) * 100,
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
  const userDocSnap = await getDoc(userDocRef);
  if (!userDocSnap.exists()) {
    throw new Error('User profile not found.');
  }
  const userProfile = userDocSnap.data() as UserProfile;
  const calorieGoal = userProfile.goals?.dailyCalorieGoal || 2000;
  const proteinGoal = (calorieGoal * ((userProfile.goals?.proteinPercentageGoal || 30) / 100)) / 4;
  const carbsGoal = (calorieGoal * ((userProfile.goals?.carbsPercentageGoal || 40) / 100)) / 4;
  const fatGoal = (calorieGoal * ((userProfile.goals?.fatPercentageGoal || 30) / 100)) / 9;
  const ironGoal = userProfile.goals?.ironTargetMg || 18;
  const vitaminAGoal = userProfile.goals?.vitaminATargetMcg || 900;
  const sodiumGoal = 2300; // General recommendation


  // 2. Fetch daily logs for the period
  const logsQuery = query(
    collection(db, 'users', userId, 'dailyLogs'),
    where('__name__', '>=', startDate),
    orderBy('__name__', 'asc')
  );
  const querySnapshot = await getDocs(logsQuery);
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

    chartData.push({
      date: dateKey,
      calories: log?.totalCalories || 0,
      goal: calorieGoal,
      protein: log?.totalProtein || 0,
      carbs: log?.totalCarbs || 0,
      fat: log?.totalFat || 0,
      iron: log?.totalIron || 0,
      vitaminA: log?.totalVitaminA || 0,
      sodium: log?.totalSodium || 0,
    });
  }

  const goals = {
    calories: calorieGoal,
    protein: proteinGoal,
    carbs: carbsGoal,
    fat: fatGoal,
    iron: ironGoal,
    vitaminA: vitaminAGoal,
    sodium: sodiumGoal,
  };

  // 4. Calculate summary and insights
  const summary = calculateSummary(chartData, calorieGoal);
  const insights = generateInsights(summary, goals, days);

  // 5. Return structured data
  return {
    chartData,
    summary,
    insights,
    goals,
  };
}

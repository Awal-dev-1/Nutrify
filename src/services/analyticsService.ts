
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
import { NUTRIENT_DRV } from '@/lib/nutrients';

/**
 * Calculates summary metrics from a given array of analytics data.
 */
function calculateSummary(data: AnalyticsData[], goal: number): AnalyticsSummary {
  const emptySummary: AnalyticsSummary = {
    averageCalories: 0, averageProtein: 0, averageCarbs: 0, averageFat: 0,
    averageFiber: 0, averageSugar: 0, averageSodium: 0, averageCalcium: 0, averageIron: 0,
    averagePotassium: 0, averageMagnesium: 0, averageZinc: 0, averagePhosphorus: 0,
    averageIodine: 0, averageSelenium: 0, averageCopper: 0, averageManganese: 0,
    averageChromium: 0, averageMolybdenum: 0, averageChloride: 0,
    averageVitaminA: 0, averageVitaminC: 0, averageVitaminD: 0, averageVitaminE: 0, averageVitaminK: 0,
    averageVitaminB1: 0, averageVitaminB2: 0, averageVitaminB3: 0, averageVitaminB5: 0, averageVitaminB6: 0,
    averageVitaminB7: 0, averageFolate: 0, averageVitaminB12: 0,
    goalAchievementRate: 0, highestCalorieDay: null, lowestCalorieDay: null,
    consistencyScore: 0,
  };

  if (data.length === 0) {
    return emptySummary;
  }

  const total: Omit<AnalyticsSummary, 'goalAchievementRate' | 'highestCalorieDay' | 'lowestCalorieDay' | 'consistencyScore' | keyof typeof emptySummary> & { daysGoalMet: number, [key: string]: any } = { daysGoalMet: 0 };
  
  Object.keys(emptySummary).forEach(key => {
    if (key.startsWith('average')) {
      const dataKey = key.replace('average', '');
      const lowerCaseKey = dataKey.charAt(0).toLowerCase() + dataKey.slice(1);
      total[lowerCaseKey] = data.reduce((acc, day) => acc + ((day as any)[lowerCaseKey] || 0), 0);
    }
  });
  total.daysGoalMet = data.filter(d => d.calories > 0 && d.calories <= goal).length;

  const averages: any = {};
  Object.keys(total).forEach(key => {
      if (key !== 'daysGoalMet') {
        averages[`average${key.charAt(0).toUpperCase() + key.slice(1)}`] = total[key] / data.length;
      }
  });

  const nonZeroDays = data.filter(d => d.calories > 0);
  const highestCalorieDay = [...nonZeroDays].sort((a, b) => b.calories - a.calories)[0] || null;
  const lowestCalorieDay = [...nonZeroDays].sort((a, b) => a.calories - b.calories)[0] || null;
  
  const averageCalories = averages.averageCalories;
  const calorieVariance = data.reduce((acc, day) => acc + Math.abs(day.calories - averageCalories), 0) / data.length;
  const consistencyScore = Math.max(0, 100 - (calorieVariance / (goal * 0.25)) * 100);

  return {
    ...averages,
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
  
  const emptyAnalyticsData = () => {
    const chartData: AnalyticsData[] = [];
    for (let i = 0; i < days; i++) {
        const date = subDays(today, days - 1 - i);
        const dateKey = format(date, 'yyyy-MM-dd');
        chartData.push({
            date: dateKey, goal: 2000,
            calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0, calcium: 0, iron: 0,
            potassium: 0, magnesium: 0, zinc: 0, phosphorus: 0, iodine: 0, selenium: 0, copper: 0, manganese: 0,
            chromium: 0, molybdenum: 0, chloride: 0,
            vitaminA: 0, vitaminC: 0, vitaminD: 0, vitaminE: 0, vitaminK: 0, vitaminB1: 0, vitaminB2: 0,
            vitaminB3: 0, vitaminB5: 0, vitaminB6: 0, vitaminB7: 0, folate: 0, vitaminB12: 0
        });
    }

    const defaultGoals = {
        calories: 2000, protein: 120, carbs: 250, fat: 70, ...NUTRIENT_DRV,
    };

    return {
        chartData,
        summary: calculateSummary(chartData, defaultGoals.calories),
        insights: ["Log your first meal to start seeing personalized analytics."],
        goals: defaultGoals,
        loggedDaysCount: 0,
    };
  };
  
  if (!userDocSnap.exists()) {
    console.warn(`Analytics Service: User profile not found for user ${userId}. Returning empty data.`);
    return emptyAnalyticsData();
  }

  const userProfile = userDocSnap.data() as UserProfile;
  const calorieGoal = userProfile.goals?.dailyCalorieGoal || 2000;
  
  const goals = {
    ...NUTRIENT_DRV,
    calories: calorieGoal,
    protein: (calorieGoal * ((userProfile.goals?.proteinPercentageGoal || 30) / 100)) / 4,
    carbs: (calorieGoal * ((userProfile.goals?.carbsPercentageGoal || 40) / 100)) / 4,
    fat: (calorieGoal * ((userProfile.goals?.fatPercentageGoal || 30) / 100)) / 9,
    iron: userProfile.goals?.ironTargetMg || NUTRIENT_DRV.iron,
    vitaminA: userProfile.goals?.vitaminATargetMcg || NUTRIENT_DRV.vitaminA,
  };


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

    chartData.push({
      date: dateKey,
      goal: calorieGoal,
      calories: log?.totalCalories || 0,
      protein: log?.totalProtein || 0,
      carbs: log?.totalCarbs || 0,
      fat: log?.totalFat || 0,
      fiber: log?.totalFiber || 0,
      sugar: log?.totalSugar || 0,
      sodium: log?.totalSodium || 0,
      calcium: log?.totalCalcium || 0,
      iron: log?.totalIron || 0,
      potassium: log?.totalPotassium || 0,
      magnesium: log?.totalMagnesium || 0,
      zinc: log?.totalZinc || 0,
      phosphorus: log?.totalPhosphorus || 0,
      iodine: log?.totalIodine || 0,
      selenium: log?.totalSelenium || 0,
      copper: log?.totalCopper || 0,
      manganese: log?.totalManganese || 0,
      chromium: log?.totalChromium || 0,
      molybdenum: log?.totalMolybdenum || 0,
      chloride: log?.totalChloride || 0,
      vitaminA: log?.totalVitaminA || 0,
      vitaminC: log?.totalVitaminC || 0,
      vitaminD: log?.totalVitaminD || 0,
      vitaminE: log?.totalVitaminE || 0,
      vitaminK: log?.totalVitaminK || 0,
      vitaminB1: log?.totalVitaminB1 || 0,
      vitaminB2: log?.totalVitaminB2 || 0,
      vitaminB3: log?.totalVitaminB3 || 0,
      vitaminB5: log?.totalVitaminB5 || 0,
      vitaminB6: log?.totalVitaminB6 || 0,
      vitaminB7: log?.totalVitaminB7 || 0,
      folate: log?.totalFolate || 0,
      vitaminB12: log?.totalVitaminB12 || 0,
    });
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

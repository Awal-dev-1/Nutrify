import { subDays, format } from 'date-fns';

export type DailyRecord = {
  date: string; // "YYYY-MM-DD"
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  iron: number;
  vitaminA: number;
  calcium: number;
};

export const userAnalyticsGoals = {
  calories: 2200,
  protein: 120,
  carbs: 250,
  fat: 70,
  iron: 18, // mg
  vitaminA: 900, // mcg RAE
  calcium: 1300, // mg
};

export const generateMockAnalyticsData = (): DailyRecord[] => {
  const data: DailyRecord[] = [];
  const today = new Date();
  // Generate for 90 days to support all timeframes
  for (let i = 89; i >= 0; i--) {
    const date = subDays(today, i);
    data.push({
      date: format(date, 'yyyy-MM-dd'),
      calories: Math.floor(userAnalyticsGoals.calories * (0.8 + Math.random() * 0.5)), // 80% to 130% of goal
      protein: Math.floor(userAnalyticsGoals.protein * (0.7 + Math.random() * 0.6)),
      carbs: Math.floor(userAnalyticsGoals.carbs * (0.8 + Math.random() * 0.4)),
      fat: Math.floor(userAnalyticsGoals.fat * (0.75 + Math.random() * 0.5)),
      iron: Math.floor(userAnalyticsGoals.iron * (0.5 + Math.random() * 0.8)),
      vitaminA: Math.floor(userAnalyticsGoals.vitaminA * (0.4 + Math.random() * 0.8)),
      calcium: Math.floor(userAnalyticsGoals.calcium * (0.4 + Math.random() * 0.7)),
    });
  }
  return data;
};

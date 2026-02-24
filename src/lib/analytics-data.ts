import { subDays, format } from 'date-fns';

export type DailyRecord = {
  date: string; // "YYYY-MM-DD"
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export const userAnalyticsGoals = {
  calories: 2200,
  protein: 120,
  carbs: 250,
  fat: 70,
};

export const generateMockAnalyticsData = (): DailyRecord[] => {
  const data: DailyRecord[] = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = subDays(today, i);
    data.push({
      date: format(date, 'yyyy-MM-dd'),
      calories: Math.floor(userAnalyticsGoals.calories * (0.8 + Math.random() * 0.5)), // 80% to 130% of goal
      protein: Math.floor(userAnalyticsGoals.protein * (0.7 + Math.random() * 0.6)),
      carbs: Math.floor(userAnalyticsGoals.carbs * (0.8 + Math.random() * 0.4)),
      fat: Math.floor(userAnalyticsGoals.fat * (0.75 + Math.random() * 0.5)),
    });
  }
  return data;
};

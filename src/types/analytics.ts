
export type LoggedFoodItem = {
    logId: string;
    foodId: string;
    name: string;
    quantity: number; // in grams
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    imageUrl: string;
};
  
export type DailyLog = {
    date: string; // YYYY-MM-DD
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
    waterIntake: number;
    meals: {
      Breakfast: LoggedFoodItem[];
      Lunch: LoggedFoodItem[];
      Dinner: LoggedFoodItem[];
      Snacks: LoggedFoodItem[];
    };
};
  
export type AnalyticsData = {
    date: string;
    calories: number;
    goal: number;
    protein: number;
    carbs: number;
    fat: number;
};
  
export type AnalyticsSummary = {
    averageCalories: number;
    averageProtein: number;
    averageCarbs: number;
    averageFat: number;
    goalAchievementRate: number;
    highestCalorieDay: AnalyticsData | null;
    lowestCalorieDay: AnalyticsData | null;
    consistencyScore: number;
};


export type LoggedFoodItem = {
    logId: string;
    foodId: string;
    name: string;
    quantity: number; // in grams
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    iron: number;
    vitaminA: number;
    sodium: number;
    imageUrl: string;
};
  
export type DailyLog = {
    date: string; // YYYY-MM-DD
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
    totalIron: number;
    totalVitaminA: number;
    totalSodium: number;
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
    iron: number;
    vitaminA: number;
    sodium: number;
};
  
export type AnalyticsSummary = {
    averageCalories: number;
    averageProtein: number;
    averageCarbs: number;
    averageFat: number;
    averageIron: number;
    averageVitaminA: number;
    averageSodium: number;
    goalAchievementRate: number;
    highestCalorieDay: AnalyticsData | null;
    lowestCalorieDay: AnalyticsData | null;
    consistencyScore: number;
};

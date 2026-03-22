

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
    fiber: number;
    sugar: number;
    calcium: number;
    vitaminC: number;
    vitaminD?: number;
    vitaminE?: number;
    vitaminK?: number;
    vitaminB1?: number;
    vitaminB2?: number;
    vitaminB3?: number;
    vitaminB6?: number;
    vitaminB12?: number;
    folate?: number;
    magnesium?: number;
    potassium?: number;
    zinc?: number;
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
    totalFiber: number;
    totalSugar: number;
    totalCalcium: number;
    totalVitaminC: number;
    totalVitaminD: number;
    totalVitaminE: number;
    totalVitaminK: number;
    totalVitaminB1: number;
    totalVitaminB2: number;
    totalVitaminB3: number;
    totalVitaminB6: number;
    totalVitaminB12: number;
    totalFolate: number;
    totalMagnesium: number;
    totalPotassium: number;
    totalZinc: number;
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
    fiber: number;
    sugar: number;
    calcium: number;
    vitaminC: number;
    vitaminD: number;
    vitaminE: number;
    vitaminK: number;
    vitaminB1: number;
    vitaminB2: number;
    vitaminB3: number;
    vitaminB6: number;
    vitaminB12: number;
    folate: number;
    magnesium: number;
    potassium: number;
    zinc: number;
};
  
export type AnalyticsSummary = {
    averageCalories: number;
    averageProtein: number;
    averageCarbs: number;
    averageFat: number;
    averageIron: number;
    averageVitaminA: number;
    averageSodium: number;
    averageFiber: number;
    averageSugar: number;
    averageCalcium: number;
    averageVitaminC: number;
    averageVitaminD: number;
    averageVitaminE: number;
    averageVitaminK: number;
    averageVitaminB1: number;
    averageVitaminB2: number;
    averageVitaminB3: number;
    averageVitaminB6: number;
    averageVitaminB12: number;
    averageFolate: number;
    averageMagnesium: number;
    averagePotassium: number;
    averageZinc: number;
    goalAchievementRate: number;
    highestCalorieDay: AnalyticsData | null;
    lowestCalorieDay: AnalyticsData | null;
    consistencyScore: number;
};

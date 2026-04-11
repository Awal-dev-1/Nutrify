
'use client';

import { doc, getDoc, setDoc, collection, Firestore } from 'firebase/firestore';
import { format } from 'date-fns';
import type { DailyLog, LoggedFoodItem } from '@/types/analytics';
import type { FoodItem as AiFoodItem } from '@/types/food';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { NUTRIENT_GOAL_KEYS } from '@/lib/nutrients';

const updateLog = (dailyLogRef: any, dailyLog: DailyLog) => {
    setDoc(dailyLogRef, dailyLog, { merge: true }).catch(error => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: dailyLogRef.path,
            operation: 'write',
            requestResourceData: dailyLog
        }));
    });
}

const getEmptyLog = (dateKey: string): DailyLog => {
    const emptyLog: DailyLog = {
      date: dateKey,
      totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0,
      waterIntake: 0,
      meals: { Breakfast: [], Lunch: [], Dinner: [] },
    } as any; // Cast to any to allow dynamic property setting

    // Initialize all nutrient totals to 0
    NUTRIENT_GOAL_KEYS.map(key => key.replace(/Target(G|Mg|Mcg)$/, ''))
        .forEach(nutrientKey => {
            const totalKey = `total${nutrientKey.charAt(0).toUpperCase() + nutrientKey.slice(1)}`;
            (emptyLog as any)[totalKey] = 0;
        });

    return emptyLog;
}

const calculateAllTotals = (meals: LoggedFoodItem[]): Omit<DailyLog, 'date' | 'meals' | 'waterIntake'> => {
    const totals: any = {};

    const nutrientKeys: (keyof Omit<LoggedFoodItem, 'logId' | 'foodId' | 'name' | 'quantity'>)[] = [
        'calories', 'protein', 'carbs', 'fat', 'fiber', 'sugar', 'sodium', 'calcium',
        'iron', 'potassium', 'magnesium', 'zinc', 'phosphorus', 'iodine', 'selenium',
        'copper', 'manganese', 'chromium', 'molybdenum', 'chloride', 'vitaminA', 'vitaminC',
        'vitaminD', 'vitaminE', 'vitaminK', 'vitaminB1', 'vitaminB2', 'vitaminB3', 'vitaminB5',
        'vitaminB6', 'vitaminB7', 'folate', 'vitaminB12'
    ];
    
    nutrientKeys.forEach(key => {
        const totalKey = `total${key.charAt(0).toUpperCase() + key.slice(1)}`;
        totals[totalKey] = meals.reduce((sum, item) => sum + (item[key] || 0), 0);
    });

    return totals;
};

export async function addFoodToLog(
  db: Firestore,
  userId: string,
  mealType: "Breakfast" | "Lunch" | "Dinner",
  foodData: AiFoodItem,
  quantity: number
) {
  const date = new Date();
  const dateKey = format(date, 'yyyy-MM-dd');
  const dailyLogRef = doc(db, 'users', userId, 'dailyLogs', dateKey);

  const ratio = quantity / (foodData.estimatedWeightGrams || 100);
  
  const newLogItem: LoggedFoodItem = {
    logId: doc(collection(db, 'temp')).id,
    foodId: foodData.foodName,
    name: foodData.foodName,
    quantity,
    calories: (foodData.calories || 0) * ratio,
    protein: (foodData.macronutrientBreakdown.protein || 0) * ratio,
    carbs: (foodData.macronutrientBreakdown.carbohydrates || 0) * ratio,
    fat: (foodData.macronutrientBreakdown.fat || 0) * ratio,
    fiber: (foodData.micronutrientBreakdown?.fiber || 0) * ratio,
    sugar: (foodData.micronutrientBreakdown?.sugar || 0) * ratio,
    sodium: (foodData.micronutrientBreakdown?.sodium || 0) * ratio,
    calcium: (foodData.micronutrientBreakdown?.calcium || 0) * ratio,
    iron: (foodData.micronutrientBreakdown?.iron || 0) * ratio,
    potassium: (foodData.micronutrientBreakdown?.potassium || 0) * ratio,
    magnesium: (foodData.micronutrientBreakdown?.magnesium || 0) * ratio,
    zinc: (foodData.micronutrientBreakdown?.zinc || 0) * ratio,
    phosphorus: (foodData.micronutrientBreakdown?.phosphorus || 0) * ratio,
    iodine: (foodData.micronutrientBreakdown?.iodine || 0) * ratio,
    selenium: (foodData.micronutrientBreakdown?.selenium || 0) * ratio,
    copper: (foodData.micronutrientBreakdown?.copper || 0) * ratio,
    manganese: (foodData.micronutrientBreakdown?.manganese || 0) * ratio,
    chromium: (foodData.micronutrientBreakdown?.chromium || 0) * ratio,
    molybdenum: (foodData.micronutrientBreakdown?.molybdenum || 0) * ratio,
    chloride: (foodData.micronutrientBreakdown?.chloride || 0) * ratio,
    vitaminA: (foodData.micronutrientBreakdown?.vitaminA || 0) * ratio,
    vitaminC: (foodData.micronutrientBreakdown?.vitaminC || 0) * ratio,
    vitaminD: (foodData.micronutrientBreakdown?.vitaminD || 0) * ratio,
    vitaminE: (foodData.micronutrientBreakdown?.vitaminE || 0) * ratio,
    vitaminK: (foodData.micronutrientBreakdown?.vitaminK || 0) * ratio,
    vitaminB1: (foodData.micronutrientBreakdown?.vitaminB1 || 0) * ratio,
    vitaminB2: (foodData.micronutrientBreakdown?.vitaminB2 || 0) * ratio,
    vitaminB3: (foodData.micronutrientBreakdown?.vitaminB3 || 0) * ratio,
    vitaminB5: (foodData.micronutrientBreakdown?.vitaminB5 || 0) * ratio,
    vitaminB6: (foodData.micronutrientBreakdown?.vitaminB6 || 0) * ratio,
    vitaminB7: (foodData.micronutrientBreakdown?.vitaminB7 || 0) * ratio,
    folate: (foodData.micronutrientBreakdown?.folate || 0) * ratio,
    vitaminB12: (foodData.micronutrientBreakdown?.vitaminB12 || 0) * ratio,
  };

  let dailyLog: DailyLog;
  try {
    const docSnap = await getDoc(dailyLogRef);
    if (docSnap.exists()) {
      dailyLog = docSnap.data() as DailyLog;
    } else {
      dailyLog = getEmptyLog(dateKey);
    }
  } catch (error) {
     errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: dailyLogRef.path,
        operation: 'get',
      }));
      // Stop execution if we can't read the log
      return;
  }
  
  if (!dailyLog.meals[mealType]) {
    dailyLog.meals[mealType] = [];
  }
  dailyLog.meals[mealType].push(newLogItem);

  const allMeals = Object.values(dailyLog.meals).flat();
  const newTotals = calculateAllTotals(allMeals);
  
  const updatedLog = { ...dailyLog, ...newTotals };
  updateLog(dailyLogRef, updatedLog);
}

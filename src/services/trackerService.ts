
'use client';

import { doc, getDoc, setDoc, collection, Firestore } from 'firebase/firestore';
import { format } from 'date-fns';
import type { DailyLog, LoggedFoodItem } from '@/types/analytics';
import type { FoodItem as AiFoodItem } from '@/types/food';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


const updateLog = (dailyLogRef: any, dailyLog: DailyLog) => {
    setDoc(dailyLogRef, dailyLog, { merge: true }).catch(error => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: dailyLogRef.path,
            operation: 'write',
            requestResourceData: dailyLog
        }));
    });
}

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

  const ratio = quantity / 100;
  
  const newLogItem: LoggedFoodItem = {
    logId: doc(collection(db, 'temp')).id,
    foodId: foodData.foodName,
    name: foodData.foodName,
    quantity,
    calories: (foodData.calories || 0) * ratio,
    protein: (foodData.macronutrientBreakdown.protein || 0) * ratio,
    carbs: (foodData.macronutrientBreakdown.carbohydrates || 0) * ratio,
    fat: (foodData.macronutrientBreakdown.fat || 0) * ratio,
    iron: (foodData.micronutrientBreakdown?.iron || 0) * ratio,
    vitaminA: (foodData.micronutrientBreakdown?.vitaminA || 0) * ratio,
    sodium: (foodData.micronutrientBreakdown?.sodium || 0) * ratio,
    fiber: (foodData.micronutrientBreakdown?.fiber || 0) * ratio,
    sugar: (foodData.micronutrientBreakdown?.sugar || 0) * ratio,
    calcium: (foodData.micronutrientBreakdown?.calcium || 0) * ratio,
    vitaminC: (foodData.micronutrientBreakdown?.vitaminC || 0) * ratio,
    vitaminD: (foodData.micronutrientBreakdown?.vitaminD || 0) * ratio,
    vitaminE: (foodData.micronutrientBreakdown?.vitaminE || 0) * ratio,
    vitaminK: (foodData.micronutrientBreakdown?.vitaminK || 0) * ratio,
    vitaminB1: (foodData.micronutrientBreakdown?.vitaminB1 || 0) * ratio,
    vitaminB2: (foodData.micronutrientBreakdown?.vitaminB2 || 0) * ratio,
    vitaminB3: (foodData.micronutrientBreakdown?.vitaminB3 || 0) * ratio,
    vitaminB6: (foodData.micronutrientBreakdown?.vitaminB6 || 0) * ratio,
    vitaminB12: (foodData.micronutrientBreakdown?.vitaminB12 || 0) * ratio,
    folate: (foodData.micronutrientBreakdown?.folate || 0) * ratio,
    magnesium: (foodData.micronutrientBreakdown?.magnesium || 0) * ratio,
    potassium: (foodData.micronutrientBreakdown?.potassium || 0) * ratio,
    zinc: (foodData.micronutrientBreakdown?.zinc || 0) * ratio,
  };

  let dailyLog: DailyLog;
  try {
    const docSnap = await getDoc(dailyLogRef);
    if (docSnap.exists()) {
      dailyLog = docSnap.data() as DailyLog;
    } else {
      dailyLog = {
        date: dateKey,
        totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0,
        totalIron: 0, totalVitaminA: 0, totalSodium: 0, totalFiber: 0,
        totalSugar: 0, totalCalcium: 0, totalVitaminC: 0, totalVitaminD: 0,
        totalVitaminE: 0, totalVitaminK: 0, totalVitaminB1: 0, totalVitaminB2: 0,
        totalVitaminB3: 0, totalVitaminB6: 0, totalVitaminB12: 0, totalFolate: 0,
        totalMagnesium: 0, totalPotassium: 0, totalZinc: 0,
        waterIntake: 0,
        meals: { Breakfast: [], Lunch: [], Dinner: [] },
      };
    }
  } catch (error) {
     errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: dailyLogRef.path,
        operation: 'get',
      }));
      // Stop execution if we can't read the log
      return;
  }
  

  dailyLog.meals[mealType].push(newLogItem);

  const allMeals = Object.values(dailyLog.meals).flat();
  dailyLog.totalCalories = allMeals.reduce((sum, item) => sum + item.calories, 0);
  dailyLog.totalProtein = allMeals.reduce((sum, item) => sum + item.protein, 0);
  dailyLog.totalCarbs = allMeals.reduce((sum, item) => sum + item.carbs, 0);
  dailyLog.totalFat = allMeals.reduce((sum, item) => sum + item.fat, 0);
  dailyLog.totalIron = allMeals.reduce((sum, item) => sum + (item.iron || 0), 0);
  dailyLog.totalVitaminA = allMeals.reduce((sum, item) => sum + (item.vitaminA || 0), 0);
  dailyLog.totalSodium = allMeals.reduce((sum, item) => sum + (item.sodium || 0), 0);
  dailyLog.totalFiber = allMeals.reduce((sum, item) => sum + (item.fiber || 0), 0);
  dailyLog.totalSugar = allMeals.reduce((sum, item) => sum + (item.sugar || 0), 0);
  dailyLog.totalCalcium = allMeals.reduce((sum, item) => sum + (item.calcium || 0), 0);
  dailyLog.totalVitaminC = allMeals.reduce((sum, item) => sum + (item.vitaminC || 0), 0);
  dailyLog.totalVitaminD = allMeals.reduce((sum, item) => sum + (item.vitaminD || 0), 0);
  dailyLog.totalVitaminE = allMeals.reduce((sum, item) => sum + (item.vitaminE || 0), 0);
  dailyLog.totalVitaminK = allMeals.reduce((sum, item) => sum + (item.vitaminK || 0), 0);
  dailyLog.totalVitaminB1 = allMeals.reduce((sum, item) => sum + (item.vitaminB1 || 0), 0);
  dailyLog.totalVitaminB2 = allMeals.reduce((sum, item) => sum + (item.vitaminB2 || 0), 0);
  dailyLog.totalVitaminB3 = allMeals.reduce((sum, item) => sum + (item.vitaminB3 || 0), 0);
  dailyLog.totalVitaminB6 = allMeals.reduce((sum, item) => sum + (item.vitaminB6 || 0), 0);
  dailyLog.totalVitaminB12 = allMeals.reduce((sum, item) => sum + (item.vitaminB12 || 0), 0);
  dailyLog.totalFolate = allMeals.reduce((sum, item) => sum + (item.folate || 0), 0);
  dailyLog.totalMagnesium = allMeals.reduce((sum, item) => sum + (item.magnesium || 0), 0);
  dailyLog.totalPotassium = allMeals.reduce((sum, item) => sum + (item.potassium || 0), 0);
  dailyLog.totalZinc = allMeals.reduce((sum, item) => sum + (item.zinc || 0), 0);

  updateLog(dailyLogRef, dailyLog);
}

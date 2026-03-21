
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
        totalSugar: 0, totalCalcium: 0, totalVitaminC: 0,
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

  updateLog(dailyLogRef, dailyLog);
}

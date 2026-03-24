
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
      dailyLog = {
        date: dateKey,
        totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0,
        totalFiber: 0, totalSugar: 0, totalSodium: 0, totalCalcium: 0, totalIron: 0,
        totalPotassium: 0, totalMagnesium: 0, totalZinc: 0, totalPhosphorus: 0,
        totalIodine: 0, totalSelenium: 0, totalCopper: 0, totalManganese: 0,
        totalChromium: 0, totalMolybdenum: 0, totalChloride: 0,
        totalVitaminA: 0, totalVitaminC: 0, totalVitaminD: 0, totalVitaminE: 0, totalVitaminK: 0,
        totalVitaminB1: 0, totalVitaminB2: 0, totalVitaminB3: 0, totalVitaminB5: 0, totalVitaminB6: 0,
        totalVitaminB7: 0, totalFolate: 0, totalVitaminB12: 0,
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
  
  if (!dailyLog.meals[mealType]) {
    dailyLog.meals[mealType] = [];
  }
  dailyLog.meals[mealType].push(newLogItem);

  const allMeals = Object.values(dailyLog.meals).flat();
  const newTotals: Omit<DailyLog, 'date' | 'meals' | 'waterIntake'> = {
    totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0,
    totalFiber: 0, totalSugar: 0, totalSodium: 0, totalCalcium: 0, totalIron: 0,
    totalPotassium: 0, totalMagnesium: 0, totalZinc: 0, totalPhosphorus: 0,
    totalIodine: 0, totalSelenium: 0, totalCopper: 0, totalManganese: 0,
    totalChromium: 0, totalMolybdenum: 0, totalChloride: 0,
    totalVitaminA: 0, totalVitaminC: 0, totalVitaminD: 0, totalVitaminE: 0, totalVitaminK: 0,
    totalVitaminB1: 0, totalVitaminB2: 0, totalVitaminB3: 0, totalVitaminB5: 0, totalVitaminB6: 0,
    totalVitaminB7: 0, totalFolate: 0, totalVitaminB12: 0,
  };
  
  const nutrientKeys = Object.keys(newTotals) as (keyof typeof newTotals)[];

  for (const item of allMeals) {
    for (const key of nutrientKeys) {
        const foodKey = key.replace('total', '').toLowerCase() as keyof LoggedFoodItem;
        newTotals[key] += (item[foodKey] as number || 0);
    }
  }
  
  const updatedLog = { ...dailyLog, ...newTotals };
  updateLog(dailyLogRef, updatedLog);
}

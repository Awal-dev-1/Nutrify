
'use client';

import { doc, getDoc, setDoc, collection, Firestore } from 'firebase/firestore';
import { format } from 'date-fns';
import type { DailyLog, LoggedFoodItem } from '@/types/analytics';
import type { FoodItem as AiFoodItem } from '@/types/food';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { ALL_TRACKABLE_NUTRIENT_KEYS, type TrackableNutrientKey } from '@/lib/nutrients';

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
      waterIntake: 0,
      meals: { Breakfast: [], Lunch: [], Dinner: [] },
    } as any; // Cast to any to allow dynamic property setting

    // Initialize all nutrient totals to 0
    ALL_TRACKABLE_NUTRIENT_KEYS.forEach(nutrientKey => {
        const totalKey = `total${nutrientKey.charAt(0).toUpperCase() + nutrientKey.slice(1)}`;
        (emptyLog as any)[totalKey] = 0;
    });

    return emptyLog;
}

const calculateAllTotals = (meals: LoggedFoodItem[]): Omit<DailyLog, 'date' | 'meals' | 'waterIntake'> => {
    const totals: any = {};

    ALL_TRACKABLE_NUTRIENT_KEYS.forEach(key => {
        const totalKey = `total${key.charAt(0).toUpperCase() + key.slice(1)}`;
        totals[totalKey] = meals.reduce((sum, item) => sum + ((item as any)[key] || 0), 0);
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
  const dateKey = format(date, "yyyy-MM-dd");
  const dailyLogRef = doc(db, 'users', userId, 'dailyLogs', dateKey);

  const ratio = quantity / (foodData.estimatedWeightGrams || 100);
  
  const newLogItem: LoggedFoodItem = {
    logId: doc(collection(db, 'temp')).id,
    foodId: foodData.foodName,
    name: foodData.foodName,
    quantity,
  } as any;

  // Dynamically calculate all nutrients from the food item
  ALL_TRACKABLE_NUTRIENT_KEYS.forEach((key: TrackableNutrientKey) => {
    let sourceValue: number | undefined;
    if (key === 'calories' || key === 'protein' || key === 'carbs' || key === 'fat') {
        const macroMap = {
            'calories': foodData.calories,
            'protein': foodData.macronutrientBreakdown.protein,
            'carbs': foodData.macronutrientBreakdown.carbohydrates,
            'fat': foodData.macronutrientBreakdown.fat
        };
        sourceValue = macroMap[key as keyof typeof macroMap];
    } else {
        sourceValue = foodData.micronutrientBreakdown?.[key as keyof typeof foodData.micronutrientBreakdown];
    }
    (newLogItem as any)[key] = (sourceValue || 0) * ratio;
  });


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

'use client';

import { doc, getDoc, setDoc, collection, Firestore } from 'firebase/firestore';
import { format } from 'date-fns';
import type { DailyLog, LoggedFoodItem } from '@/types/analytics';
import type { FoodItem as AiFoodItem } from '@/types/food';
import type { Food } from '@/lib/data';

/**
 * Adds a food item (from AI search) to a daily log for a specific user.
 */
export async function addFoodToLog(
  db: Firestore,
  userId: string,
  mealType: "Breakfast" | "Lunch" | "Dinner" | "Snacks",
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
    calories: foodData.calories * ratio,
    protein: foodData.macronutrientBreakdown.protein * ratio,
    carbs: foodData.macronutrientBreakdown.carbohydrates * ratio,
    fat: foodData.macronutrientBreakdown.fat * ratio,
    imageUrl: `https://picsum.photos/seed/${encodeURIComponent(foodData.foodName)}/100/100`,
  };

  const docSnap = await getDoc(dailyLogRef);
  let dailyLog: DailyLog;

  if (docSnap.exists()) {
    dailyLog = docSnap.data() as DailyLog;
  } else {
    dailyLog = {
      date: dateKey,
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
      waterIntake: 0,
      meals: { Breakfast: [], Lunch: [], Dinner: [], Snacks: [] },
    };
  }

  dailyLog.meals[mealType].push(newLogItem);

  const allMeals = Object.values(dailyLog.meals).flat();
  dailyLog.totalCalories = allMeals.reduce((sum, item) => sum + item.calories, 0);
  dailyLog.totalProtein = allMeals.reduce((sum, item) => sum + item.protein, 0);
  dailyLog.totalCarbs = allMeals.reduce((sum, item) => sum + item.carbs, 0);
  dailyLog.totalFat = allMeals.reduce((sum, item) => sum + item.fat, 0);

  await setDoc(dailyLogRef, dailyLog);
}

/**
 * Adds a confirmed food item from the database to a daily log.
 */
export async function addFoodItemToLog(
  db: Firestore,
  userId: string,
  mealType: "Breakfast" | "Lunch" | "Dinner" | "Snacks",
  foodItem: Food,
  quantity: number
) {
  const date = new Date();
  const dateKey = format(date, 'yyyy-MM-dd');
  const dailyLogRef = doc(db, 'users', userId, 'dailyLogs', dateKey);

  const ratio = quantity / 100;

  const newLogItem: LoggedFoodItem = {
    logId: doc(collection(db, 'temp')).id,
    foodId: foodItem.id, // Use the real foodId
    name: foodItem.name,
    quantity,
    calories: foodItem.calories * ratio,
    protein: foodItem.protein * ratio,
    carbs: foodItem.carbs * ratio,
    fat: foodItem.fat * ratio,
    imageUrl: foodItem.image,
  };

  const docSnap = await getDoc(dailyLogRef);
  let dailyLog: DailyLog;

  if (docSnap.exists()) {
    dailyLog = docSnap.data() as DailyLog;
  } else {
    dailyLog = {
      date: dateKey,
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
      waterIntake: 0,
      meals: { Breakfast: [], Lunch: [], Dinner: [], Snacks: [] },
    };
  }

  dailyLog.meals[mealType].push(newLogItem);

  const allMeals = Object.values(dailyLog.meals).flat();
  dailyLog.totalCalories = allMeals.reduce((sum, item) => sum + item.calories, 0);
  dailyLog.totalProtein = allMeals.reduce((sum, item) => sum + item.protein, 0);
  dailyLog.totalCarbs = allMeals.reduce((sum, item) => sum + item.carbs, 0);
  dailyLog.totalFat = allMeals.reduce((sum, item) => sum + item.fat, 0);

  await setDoc(dailyLogRef, dailyLog);
}

'use client';

import { doc, getDoc, setDoc, collection, Firestore } from 'firebase/firestore';
import { format } from 'date-fns';
import type { DailyLog, LoggedFoodItem } from '@/types/analytics';
import type { FoodItem as AiFoodItem } from '@/ai/flows/search-foods-flow';

/**
 * Adds a food item to a daily log for a specific user.
 * It fetches the current log, adds the new item, recalculates totals, and writes it back.
 * If no log exists for the day, it creates a new one.
 * @param db - The Firestore instance.
 * @param userId - The ID of the user.
 * @param mealType - The meal category to add the food to.
 * @param foodData - The nutritional data of the food from the AI service.
 * @param quantity - The quantity of the food in grams.
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

  // The AI `searchFoods` flow returns nutrients for a "standard portion".
  // To make this usable, we'll assume the provided numbers are roughly equivalent to a 100g serving.
  // This is a simplification for the MVP.
  const ratio = quantity / 100;
  
  const newLogItem: LoggedFoodItem = {
    logId: doc(collection(db, 'temp')).id, // Generate a unique client-side ID
    foodId: foodData.foodName, // The AI doesn't return a persistent ID, so we use the name.
    name: foodData.foodName,
    quantity,
    calories: foodData.calories * ratio,
    protein: foodData.macronutrientBreakdown.protein * ratio,
    carbs: foodData.macronutrientBreakdown.carbohydrates * ratio,
    fat: foodData.macronutrientBreakdown.fat * ratio,
    // The search flow doesn't return an image, so we generate a consistent placeholder.
    imageUrl: `https://picsum.photos/seed/${encodeURIComponent(foodData.foodName)}/100/100`,
  };

  // Fetch current log or create a new one
  const docSnap = await getDoc(dailyLogRef);
  let dailyLog: DailyLog;

  if (docSnap.exists()) {
    dailyLog = docSnap.data() as DailyLog;
  } else {
    // If no log exists for today, create a blank one.
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

  // Add the new item to the correct meal array
  dailyLog.meals[mealType].push(newLogItem);

  // Recalculate all totals to ensure consistency
  const allMeals = Object.values(dailyLog.meals).flat();
  dailyLog.totalCalories = allMeals.reduce((sum, item) => sum + item.calories, 0);
  dailyLog.totalProtein = allMeals.reduce((sum, item) => sum + item.protein, 0);
  dailyLog.totalCarbs = allMeals.reduce((sum, item) => sum + item.carbs, 0);
  dailyLog.totalFat = allMeals.reduce((sum, item) => sum + item.fat, 0);

  // Write the entire updated log back to Firestore
  await setDoc(dailyLogRef, dailyLog);
}

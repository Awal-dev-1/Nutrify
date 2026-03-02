'use client';

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  getDocs,
  query,
  serverTimestamp,
  type Firestore,
} from 'firebase/firestore';
import type { FoodItem } from '@/types/food';

// Add a meal to the planner
export const addPlannedMeal = async (
  db: Firestore,
  userId: string,
  day: string,
  mealType: string,
  food: FoodItem,
  quantity: number
) => {
  const plannedMealsColRef = collection(db, 'users', userId, 'plannedMeals');
  
  const ratio = quantity / (food.estimatedWeightGrams || 100);

  const newPlannedMeal = {
    foodId: food.foodName,
    foodName: food.foodName,
    day,
    mealType,
    quantity,
    calories: (food.calories || 0) * ratio,
    protein: (food.macronutrientBreakdown.protein || 0) * ratio,
    carbs: (food.macronutrientBreakdown.carbohydrates || 0) * ratio,
    fat: (food.macronutrientBreakdown.fat || 0) * ratio,
    createdAt: serverTimestamp(),
  };

  await addDoc(plannedMealsColRef, newPlannedMeal);
};

// Update a planned meal's quantity and nutrients
export const updatePlannedMeal = async (
  db: Firestore,
  userId: string,
  mealId: string,
  updates: {
    quantity: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }
) => {
  const mealDocRef = doc(db, 'users', userId, 'plannedMeals', mealId);
  await updateDoc(mealDocRef, updates);
};

// Delete a planned meal
export const deletePlannedMeal = async (db: Firestore, userId: string, mealId: string) => {
  const mealDoc = doc(db, 'users', userId, 'plannedMeals', mealId);
  await deleteDoc(mealDoc);
};

// Clear all planned meals for a user
export const clearPlan = async (db: Firestore, userId: string) => {
  const plannedMealsColRef = collection(db, 'users', userId, 'plannedMeals');
  const q = query(plannedMealsColRef);
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) return;

  const batch = writeBatch(db);
  querySnapshot.forEach((doc) => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
};

    
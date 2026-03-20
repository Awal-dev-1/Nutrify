
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
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

// Add a meal to the planner
export const addPlannedMeal = (
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

  addDoc(plannedMealsColRef, newPlannedMeal).catch(error => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: plannedMealsColRef.path,
      operation: 'create',
      requestResourceData: newPlannedMeal,
    }));
  });
};

export const addGeneratedMealToPlan = (
  db: Firestore,
  userId: string,
  day: string,
  mealType: string,
  mealItem: {
    foodName: string;
    quantityGrams: number;
    calories: number;
    proteinGrams?: number;
    carbsGrams?: number;
    fatGrams?: number;
  }
) => {
  const plannedMealsColRef = collection(db, 'users', userId, 'plannedMeals');
  
  const newPlannedMeal = {
    foodId: mealItem.foodName,
    foodName: mealItem.foodName,
    day,
    mealType,
    quantity: mealItem.quantityGrams,
    calories: mealItem.calories,
    protein: mealItem.proteinGrams || 0,
    carbs: mealItem.carbsGrams || 0,
    fat: mealItem.fatGrams || 0,
    createdAt: serverTimestamp(),
  };

  return addDoc(plannedMealsColRef, newPlannedMeal).catch(error => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: plannedMealsColRef.path,
      operation: 'create',
      requestResourceData: newPlannedMeal,
    }));
    throw error;
  });
};

// Update a planned meal's quantity and nutrients
export const updatePlannedMeal = (
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
  updateDoc(mealDocRef, updates).catch(error => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: mealDocRef.path,
      operation: 'update',
      requestResourceData: updates,
    }));
  });
};

// Delete a planned meal
export const deletePlannedMeal = (db: Firestore, userId: string, mealId: string) => {
  const mealDocRef = doc(db, 'users', userId, 'plannedMeals', mealId);
  deleteDoc(mealDocRef).catch(error => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: mealDocRef.path,
      operation: 'delete',
    }));
  });
};

// Clear all planned meals for a user
export const clearPlan = async (db: Firestore, userId: string) => {
  const plannedMealsColRef = collection(db, 'users', userId, 'plannedMeals');
  const q = query(plannedMealsColRef);
  
  try {
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return;

    const batch = writeBatch(db);
    querySnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
  } catch (error) {
     const permissionError = new FirestorePermissionError({
        path: plannedMealsColRef.path,
        operation: 'list', // or 'delete' depending on where it fails
      });
      errorEmitter.emit('permission-error', permissionError);
      // Re-throw so the UI can know the clear failed.
      throw permissionError;
  }
};

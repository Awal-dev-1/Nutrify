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
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) return;

  const batch = writeBatch(db);
  querySnapshot.forEach((doc) => {
    batch.delete(doc.ref);
  });
  
  batch.commit().catch(error => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: plannedMealsColRef.path,
      operation: 'delete', // Batch delete is a series of deletes
    }));
  });
};


'use client';

import { doc, updateDoc, Firestore, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export interface UserGoals {
  dailyCalorieGoal: number;
  proteinPercentageGoal: number;
  carbsPercentageGoal: number;
  fatPercentageGoal: number;
}

export interface GoalCalculationData {
    weightKg: number;
    activityLevel: string;
    primaryGoal: string;
}

export const calculateRecommendedGoals = (data: GoalCalculationData) => {
    let dailyCalorieGoal = data.weightKg * 24;

    switch (data.activityLevel) {
        case 'moderate': dailyCalorieGoal *= 1.2; break;
        case 'active': dailyCalorieGoal *= 1.4; break;
        case 'very active': dailyCalorieGoal *= 1.6; break;
    }

    switch (data.primaryGoal) {
        case 'lose-weight': dailyCalorieGoal -= 400; break;
        case 'gain-weight': dailyCalorieGoal += 400; break;
    }

    const goals = {
        dailyCalorieGoal: Math.round(dailyCalorieGoal),
        proteinPercentageGoal: 30,
        carbsPercentageGoal: 40,
        fatPercentageGoal: 30,
    };

    switch (data.primaryGoal) {
        case 'lose-weight':
            goals.proteinPercentageGoal = 35;
            goals.carbsPercentageGoal = 35;
            goals.fatPercentageGoal = 30;
            break;
        case 'gain-weight':
            goals.proteinPercentageGoal = 30;
            goals.carbsPercentageGoal = 45;
            goals.fatPercentageGoal = 25;
            break;
        case 'maintain-weight':
        case 'eat-healthier':
            goals.proteinPercentageGoal = 30;
            goals.carbsPercentageGoal = 40;
            goals.fatPercentageGoal = 30;
            break;
    }
    return goals;
}

export const updateUserGoalsAndProfile = async (
  db: Firestore,
  userId: string,
  updates: Record<string, any>
) => {
  const userRef = doc(db, 'users', userId);
  const dataToUpdate = {
    ...updates,
    updatedAt: serverTimestamp(),
  };

  try {
    await updateDoc(userRef, dataToUpdate);
  } catch (error) {
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: userRef.path,
        operation: 'update',
        requestResourceData: dataToUpdate,
      })
    );
    throw error;
  }
};

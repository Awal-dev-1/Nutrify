
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

export const updateUserGoals = async (
  db: Firestore,
  userId: string,
  newGoals: UserGoals
) => {
  const userRef = doc(db, 'users', userId);
  const dataToUpdate = {
    goals: newGoals,
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

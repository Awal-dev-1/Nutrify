'use client';

import { doc, updateDoc, Firestore, serverTimestamp } from 'firebase/firestore';

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
  await updateDoc(userRef, {
    goals: newGoals,
    updatedAt: serverTimestamp()
  });
};
'use client';
import { doc, updateDoc, serverTimestamp, Firestore } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { calculateRecommendedGoals } from './goalsService';

interface OnboardingData {
  gender: 'male' | 'female' | 'other';
  age: number;
  height: number;
  weight: number;
  goal: 'lose-weight' | 'maintain-weight' | 'gain-weight' | 'eat-healthier';
  preferences: string[];
  activityLevel: 'low' | 'moderate' | 'active' | 'very-active';
}

export const completeOnboarding = (
  db: Firestore,
  userId: string,
  onboardingData: OnboardingData
): void => {
  const userRef = doc(db, 'users', userId);
  
  const calculatedGoals = calculateRecommendedGoals({
      weightKg: onboardingData.weight,
      activityLevel: onboardingData.activityLevel,
      primaryGoal: onboardingData.goal
  });

  const userDataToUpdate = {
    onboardingCompleted: true,
    profile: {
      gender: onboardingData.gender,
      age: onboardingData.age,
      heightCm: onboardingData.height,
      weightKg: onboardingData.weight,
      activityLevel: onboardingData.activityLevel,
    },
    health: {
      primaryGoal: onboardingData.goal,
      dietaryPreferences: onboardingData.preferences,
    },
    goals: {
        dailyCalorieGoal: calculatedGoals.dailyCalorieGoal,
        proteinPercentageGoal: calculatedGoals.proteinPercentageGoal,
        carbsPercentageGoal: calculatedGoals.carbsPercentageGoal,
        fatPercentageGoal: calculatedGoals.fatPercentageGoal,
    },
    updatedAt: serverTimestamp(),
  };

  updateDoc(userRef, userDataToUpdate).catch(error => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: userRef.path,
        operation: 'update',
        requestResourceData: userDataToUpdate
    }));
    // We don't re-throw the error to keep this non-blocking.
    // The global error listener will handle displaying the error.
  });
};


'use client';
import { doc, updateDoc, serverTimestamp, Firestore } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { calculateRecommendedGoals } from './goalsService';

interface OnboardingData {
  gender: 'male' | 'female' | 'other';
  age: number;
  heightCm: number;
  weightKg: number;
  goal: 'lose-weight' | 'maintain-weight' | 'gain-weight' | 'eat-healthier';
  preferences: string[];
  activityLevel: 'low' | 'moderate' | 'active' | 'very-active';
}

export const completeOnboarding = async (
  db: Firestore,
  userId: string,
  onboardingData: OnboardingData
): Promise<void> => {
  const userRef = doc(db, 'users', userId);

  const calculatedGoals = calculateRecommendedGoals({
      weightKg: onboardingData.weightKg,
      activityLevel: onboardingData.activityLevel,
      primaryGoal: onboardingData.goal
  });

  const userDataToUpdate = {
    onboardingCompleted: true,
    profile: {
      gender: onboardingData.gender,
      age: onboardingData.age,
      heightCm: onboardingData.heightCm,
      weightKg: onboardingData.weightKg,
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

  try {
    await updateDoc(userRef, userDataToUpdate);
  } catch (error) {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: userRef.path,
        operation: 'update',
        requestResourceData: userDataToUpdate
    }));
    // Re-throw the error to be caught by the UI component
    throw error;
  }
};

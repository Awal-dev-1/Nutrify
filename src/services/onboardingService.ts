'use client';
import { doc, updateDoc, serverTimestamp, Firestore } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { calculateRecommendedGoals } from './goalsService';

interface OnboardingData {
  gender: 'male' | 'female' | 'other';
  age: number;
  height: number;
  heightUnit: 'cm' | 'm' | 'ft-in';
  heightInches?: number;
  weight: number;
  weightUnit: 'kg' | 'g' | 'lb' | 'oz';
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

  let heightCm = 0;
  switch (onboardingData.heightUnit) {
    case 'cm':
      heightCm = onboardingData.height;
      break;
    case 'm':
      heightCm = onboardingData.height * 100;
      break;
    case 'ft-in':
      heightCm = (onboardingData.height * 30.48) + ((onboardingData.heightInches || 0) * 2.54);
      break;
  }

  let weightKg = 0;
  switch (onboardingData.weightUnit) {
    case 'kg':
      weightKg = onboardingData.weight;
      break;
    case 'g':
      weightKg = onboardingData.weight / 1000;
      break;
    case 'lb':
      weightKg = onboardingData.weight * 0.453592;
      break;
    case 'oz':
      weightKg = onboardingData.weight * 0.0283495;
      break;
  }
  
  const calculatedGoals = calculateRecommendedGoals({
      weightKg: weightKg,
      activityLevel: onboardingData.activityLevel,
      primaryGoal: onboardingData.goal
  });

  const userDataToUpdate = {
    onboardingCompleted: true,
    profile: {
      gender: onboardingData.gender,
      age: onboardingData.age,
      heightCm: Math.round(heightCm),
      weightKg: parseFloat(weightKg.toFixed(2)),
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

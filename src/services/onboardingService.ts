'use client';
import { doc, updateDoc, serverTimestamp, Firestore } from 'firebase/firestore';

interface OnboardingData {
  gender: 'male' | 'female' | 'other';
  age: number;
  height: number;
  weight: number;
  goal: 'lose-weight' | 'maintain-weight' | 'gain-weight' | 'eat-healthier';
  preferences: string[];
  activityLevel: 'low' | 'moderate' | 'active' | 'very-active';
}

const calculateGoals = (data: OnboardingData) => {
    let dailyCalorieGoal = data.weight * 24;

    switch (data.activityLevel) {
        case 'moderate': dailyCalorieGoal *= 1.2; break;
        case 'active': dailyCalorieGoal *= 1.4; break;
        case 'very-active': dailyCalorieGoal *= 1.6; break;
    }

    switch (data.goal) {
        case 'lose-weight': dailyCalorieGoal -= 400; break;
        case 'gain-weight': dailyCalorieGoal += 400; break;
    }

    const goals = {
        dailyCalorieGoal: Math.round(dailyCalorieGoal),
        proteinPercentageGoal: 30,
        carbsPercentageGoal: 40,
        fatPercentageGoal: 30,
    };

    switch (data.goal) {
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

export const completeOnboarding = async (
  db: Firestore,
  userId: string,
  onboardingData: OnboardingData
) => {
  const userRef = doc(db, 'users', userId);
  const calculatedGoals = calculateGoals(onboardingData);

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

  await updateDoc(userRef, userDataToUpdate);
};


import type { Food } from './data';

export type LoggedFood = {
  logId: string;
  foodId: string;
  mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks';
  quantity: number; // in grams
};

export const mockTrackerData: LoggedFood[] = [
  {
    logId: '1',
    foodId: 'jollof-rice',
    mealType: 'Lunch',
    quantity: 250,
  },
  {
    logId: '2',
    foodId: 'grilled-tilapia',
    mealType: 'Lunch',
    quantity: 150,
  },
  {
    logId: '3',
    foodId: 'oats',
    mealType: 'Breakfast',
    quantity: 80,
  },
   {
    logId: '4',
    foodId: 'banana',
    mealType: 'Breakfast',
    quantity: 120,
  },
  {
    logId: '5',
    foodId: 'apple',
    mealType: 'Snacks',
    quantity: 150,
  },
    {
    logId: '6',
    foodId: 'kelewele',
    mealType: 'Dinner',
    quantity: 100,
  },
];

export const userGoals = {
  calories: 2200,
  protein: 120,
  carbs: 250,
  fat: 70,
  water: 8, // glasses
};

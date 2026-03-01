import { mockFoods, type Food } from './data';

export type LoggedFood = {
  logId: string;
  mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks';
  quantity: number; // in grams
  foodData: {
    id: string; // Can be food name or a generated ID
    name: string;
    calories: number; // Per 100g
    protein: number;  // Per 100g
    carbs: number;    // Per 100g
    fat: number;      // Per 100g
  }
};

const foodMap = mockFoods.reduce((acc, food) => {
  acc[food.id] = food;
  return acc;
}, {} as Record<string, Food>);

export const mockTrackerData: LoggedFood[] = [
  {
    logId: '1',
    mealType: 'Lunch',
    quantity: 250,
    foodData: {
      id: 'jollof-rice',
      name: foodMap['jollof-rice'].name,
      calories: foodMap['jollof-rice'].calories,
      protein: foodMap['jollof-rice'].protein,
      carbs: foodMap['jollof-rice'].carbs,
      fat: foodMap['jollof-rice'].fat,
    }
  },
  {
    logId: '2',
    mealType: 'Lunch',
    quantity: 150,
    foodData: {
      id: 'grilled-tilapia',
      name: foodMap['grilled-tilapia'].name,
      calories: foodMap['grilled-tilapia'].calories,
      protein: foodMap['grilled-tilapia'].protein,
      carbs: foodMap['grilled-tilapia'].carbs,
      fat: foodMap['grilled-tilapia'].fat,
    }
  },
  {
    logId: '3',
    mealType: 'Breakfast',
    quantity: 80,
    foodData: {
      id: 'oats',
      name: foodMap['oats'].name,
      calories: foodMap['oats'].calories,
      protein: foodMap['oats'].protein,
      carbs: foodMap['oats'].carbs,
      fat: foodMap['oats'].fat,
    }
  },
   {
    logId: '4',
    mealType: 'Breakfast',
    quantity: 120,
    foodData: {
      id: 'banana',
      name: foodMap['banana'].name,
      calories: foodMap['banana'].calories,
      protein: foodMap['banana'].protein,
      carbs: foodMap['banana'].carbs,
      fat: foodMap['banana'].fat,
    }
  },
  {
    logId: '5',
    mealType: 'Snacks',
    quantity: 150,
    foodData: {
      id: 'apple',
      name: foodMap['apple'].name,
      calories: foodMap['apple'].calories,
      protein: foodMap['apple'].protein,
      carbs: foodMap['apple'].carbs,
      fat: foodMap['apple'].fat,
    }
  },
  {
    logId: '6',
    mealType: 'Dinner',
    quantity: 100,
    foodData: {
      id: 'kelewele',
      name: foodMap['kelewele'].name,
      calories: foodMap['kelewele'].calories,
      protein: foodMap['kelewele'].protein,
      carbs: foodMap['kelewele'].carbs,
      fat: foodMap['kelewele'].fat,
    }
  },
];

export const userGoals = {
  calories: 2200,
  protein: 120,
  carbs: 250,
  fat: 70,
  water: 8, // glasses
};

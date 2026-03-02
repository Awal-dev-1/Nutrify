export type PlannedMeal = {
  id: string;
  foodId: string;
  day: string; // e.g., 'Monday', '2023-10-27'
  mealType: string; // 'Breakfast', 'Lunch', 'Dinner', 'Snacks'
  quantity: number; // in grams
};

// This mock data is no longer used by the planner page but is kept for reference.
export const mockPlannerData: PlannedMeal[] = [
  {
    id: 'plan-1',
    foodId: 'jollof-rice',
    day: 'Monday',
    mealType: 'Lunch',
    quantity: 250,
  },
  {
    id: 'plan-2',
    foodId: 'grilled-tilapia',
    day: 'Monday',
    mealType: 'Lunch',
    quantity: 150,
  },
  {
    id: 'plan-3',
    foodId: 'oats',
    day: 'Tuesday',
    mealType: 'Breakfast',
    quantity: 80,
  },
  {
    id: 'plan-4',
    foodId: 'apple',
    day: 'Wednesday',
    mealType: 'Snacks',
    quantity: 150,
  },
];


export const mockUserGoals = {
    calories: 2200,
    protein: 120,
    carbs: 250,
    fat: 70
}

    
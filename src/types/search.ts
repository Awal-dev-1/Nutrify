import type { FoodItem } from './food';

export interface RecentSearch {
  id: string;
  foodName: string;
  searchedAt: any; // Firestore Timestamp
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  foodData: string; // JSON string of FoodItem
}

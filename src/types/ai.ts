import type { FoodItem } from './food';

export type AIPrediction = FoodItem;

export type AIScan = {
  id: string;
  status: 'processing' | 'completed' | 'failed';
  imageUrl: string;
  predictions: AIPrediction[];
  createdAt: any; // Firestore Timestamp
  error?: string;
};

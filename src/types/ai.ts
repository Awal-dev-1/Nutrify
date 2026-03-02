import type { FoodItem } from './food';

export type AIPrediction = FoodItem & {
  confidence: number;
};

export type AIScan = {
  id: string;
  status: 'processing' | 'completed' | 'failed';
  imageUrl: string;
  predictions: AIPrediction[];
  createdAt: any; // Firestore Timestamp
  error?: string;
};

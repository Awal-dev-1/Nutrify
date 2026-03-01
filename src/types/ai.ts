import type { FoodItem } from './food';

export type AiScan = {
    id: string;
    imageUrl: string;
    status: "processing" | "completed" | "failed";
    predictions: FoodItem[];
    selectedFoodId: string | null;
    createdAt: any; // Firestore timestamp
    reason?: string; // Optional field for failure reason
}

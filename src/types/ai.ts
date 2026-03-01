export type AiScan = {
    id: string;
    imageUrl: string;
    status: "processing" | "completed" | "failed";
    predictions: {
      name: string;
      confidence: number;
    }[];
    selectedFoodId: string | null;
    createdAt: any; // Firestore timestamp
    reason?: string; // Optional field for failure reason
}

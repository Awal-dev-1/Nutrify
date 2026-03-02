
export type RecommendationItem = {
    foodId: string;
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    micronutrients: {
        fiber?: number;
        iron?: number;
        calcium?: number;
        sodium?: number;
    };
    reason: string;
    score: number;
};

export type GeneratedRecommendations = {
    id: string;
    createdAt: any; // Firestore timestamp
    basedOnGoal: string;
    recommendations: RecommendationItem[];
    insightTips?: string[];
};

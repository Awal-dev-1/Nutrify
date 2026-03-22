

export type RecommendationItem = {
    foodId: string;
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    micronutrients?: {
        fiber?: number;
        sugar?: number;
        iron?: number;
        calcium?: number;
        vitaminA?: number;
        vitaminC?: number;
        sodium?: number;
        vitaminD?: number;
        vitaminE?: number;
        vitaminK?: number;
        vitaminB1?: number;
        vitaminB2?: number;
        vitaminB3?: number;
        vitaminB6?: number;
        vitaminB12?: number;
        folate?: number;
        magnesium?: number;
        potassium?: number;
        zinc?: number;
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

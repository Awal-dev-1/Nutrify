

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
        sodium?: number;
        calcium?: number;
        iron?: number;
        potassium?: number;
        magnesium?: number;
        zinc?: number;
        phosphorus?: number;
        iodine?: number;
        selenium?: number;
        copper?: number;
        manganese?: number;
        chromium?: number;
        molybdenum?: number;
        chloride?: number;
        vitaminA?: number;
        vitaminC?: number;
        vitaminD?: number;
        vitaminE?: number;
        vitaminK?: number;
        vitaminB1?: number;
        vitaminB2?: number;
        vitaminB3?: number;
        vitaminB5?: number;
        vitaminB6?: number;
        vitaminB7?: number;
        folate?: number;
        vitaminB12?: number;
    };
    reason: string;
};

export type GeneratedRecommendations = {
    id: string;
    createdAt: any; // Firestore timestamp
    basedOnGoal: string;
    recommendations: RecommendationItem[];
    insightTips?: string[];
};

    
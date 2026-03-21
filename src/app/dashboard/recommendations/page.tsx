'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, RefreshCw, Lightbulb, AlertCircle } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { RecommendationCard } from '@/components/recommendations/recommendation-card';
import { generateRecommendations, type RecommendationResult, type Recommendation } from '@/services/recommendationService';
import { useUser, useFirestore } from '@/firebase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RecipeDetailModal } from '@/components/recommendations/recipe-detail-modal';
import { FoodConfirmationModal } from '@/components/recognize/food-confirmation-modal';
import Link from 'next/link';

export default function RecommendationsPage() {
  const { user, userProfile } = useUser();
  const db = useFirestore();
  const [data, setData] = useState<RecommendationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedFoodForModal, setSelectedFoodForModal] = useState<Recommendation | null>(null);
  const [selectedFoodId, setSelectedFoodId] = useState<string | null>(null);

  const fetchRecommendations = async () => {
    if (!user || !db) return;

    if (!userProfile?.goals?.dailyCalorieGoal) {
      setError("Please set your nutritional goals first to get personalized recommendations.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await generateRecommendations(db, user.uid);
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch recommendations.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewRecipe = (foodId: string) => {
    setSelectedFoodId(foodId);
    setIsRecipeModalOpen(true);
  };

  const handleAddToCart = (food: Recommendation) => {
    const foodItemForModal = {
        foodName: food.name,
        estimatedWeightGrams: 100, // Default to 100g, user can adjust
        calories: food.calories,
        macronutrientBreakdown: {
            protein: food.protein,
            carbohydrates: food.carbs,
            fat: food.fat,
        },
        micronutrientBreakdown: food.micronutrients || {}, // Pass along micros
        detailedRecipe: { ingredients: [], instructions: [] }, // Not needed for add modal
        foodHistory: '', // Not needed
        healthAnalysis: '', // Not needed
    }
    setSelectedFoodForModal(foodItemForModal as any);
    setIsAddModalOpen(true);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center text-center p-8 space-y-3 min-h-[400px]">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
          <h3 className="text-xl font-semibold">Generating personalized recommendations...</h3>
          <p className="text-muted-foreground">This may take a few moments.</p>
        </div>
      );
    }

    if (error && !data) {
      return (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}
            {error.includes("goals") && (
              <Button asChild variant="link" className="p-0 h-auto mt-2">
                <Link href="/dashboard/goals">Go to Goals Page</Link>
              </Button>
            )}
          </AlertDescription>
        </Alert>
      );
    }

    if (!data) {
      return (
        <EmptyState
          icon={<Sparkles className="h-16 w-16 text-muted-foreground" />}
          title="Generate Meal Recommendations"
          description="Click the button to get AI-powered meal suggestions based on your goals and today's intake."
        >
          <Button onClick={fetchRecommendations} size="lg" disabled={isLoading}>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Recommendations
          </Button>
        </EmptyState>
      );
    }

    if (data.recommendations.length === 0) {
      return (
        <EmptyState
          title="No matching foods found"
          description="We couldn't find any suitable recommendations based on your preferences. Try adjusting your goals."
        />
      );
    }
    
    return (
      <div className="space-y-6">
        <p className="text-base text-muted-foreground">
            Recommendations based on your goal to <span className="font-semibold text-primary">{data.goal.replace('-', ' ')}</span>.
        </p>

        {data.insightTips && data.insightTips.length > 0 && (
          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertTitle>Insightful Tips</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1">
                {data.insightTips.map((tip, index) => <li key={index}>{tip}</li>)}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data.recommendations.map((rec) => (
            <RecommendationCard
              key={rec.foodId}
              recommendation={rec}
              onViewRecipe={() => handleViewRecipe(rec.foodId)}
              onAddToCart={() => handleAddToCart(rec)}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Smart Food Recommendations</h1>
            <p className="text-base text-muted-foreground max-w-2xl">
              Get meal suggestions based on your goals and preferences.
            </p>
        </div>
        {data && (
            <Button variant="outline" onClick={fetchRecommendations} disabled={isLoading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Regenerate
            </Button>
        )}
      </div>

      <div className="min-h-[400px]">
        {renderContent()}
      </div>

      <RecipeDetailModal
        isOpen={isRecipeModalOpen}
        onClose={() => setIsRecipeModalOpen(false)}
        foodId={selectedFoodId}
      />
      
      <FoodConfirmationModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        foodItem={selectedFoodForModal}
      />
    </div>
  );
}

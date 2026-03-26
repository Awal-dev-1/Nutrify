
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, RefreshCw, Lightbulb, AlertCircle } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { RecommendationCard } from '@/components/recommendations/recommendation-card';
import { generateRecommendations, type RecommendationResult, type Recommendation } from '@/services/recommendationService';
import { useUser, useFirestore } from '@/firebase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RecipeDetailModal } from '@/components/recommendations/recipe-detail-modal';
import { FoodConfirmationModal } from '@/components/recognize/food-confirmation-modal';
import { TransitionLink } from '@/components/shared/transition-link';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

export default function RecommendationsPage() {
  const { user, userProfile, isProfileLoading } = useUser();
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
    if (isLoading || isProfileLoading) {
      return <RecommendationsPageSkeleton />;
    }

    if (error) {
      return (
        <Alert variant="destructive" className="max-w-xl mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Generating Recommendations</AlertTitle>
          <AlertDescription>
            {error}
            {error.includes("goals") && (
              <Button asChild variant="link" className="p-0 h-auto mt-2 text-destructive">
                <TransitionLink href="/dashboard/goals">Go to Goals Page to fix this</TransitionLink>
              </Button>
            )}
          </AlertDescription>
        </Alert>
      );
    }
    
    if (!data || data.recommendations.length === 0) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <EmptyState
            icon={<Lightbulb className="h-16 w-16 text-muted-foreground" />}
            title="No recommendations yet"
            description="Click the button to get AI-powered meal suggestions based on your goals."
          >
            <Button onClick={fetchRecommendations} size="lg" disabled={isLoading}>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Recommendations
            </Button>
          </EmptyState>
        </motion.div>
      );
    }
    
    return (
      <div className="space-y-6">
        <p className="text-base text-muted-foreground">
            Recommendations based on your goal to <span className="font-semibold text-primary">{data.goal.replace('-', ' ')}</span>.
        </p>

        {data.insightTips && data.insightTips.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.05 }}
          >
            <Alert>
              <Lightbulb className="h-4 w-4" />
              <AlertTitle>Insightful Tips</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {data.insightTips.map((tip, index) => <li key={index}>{tip}</li>)}
                </ul>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data.recommendations.map((rec, index) => (
            <motion.div
              key={rec.foodId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.1 + index * 0.05 }}
            >
              <RecommendationCard
                recommendation={rec}
                onViewRecipe={() => handleViewRecipe(rec.foodId)}
                onAddToCart={() => handleAddToCart(rec)}
              />
            </motion.div>
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
            <h1 className="text-h1 font-bold tracking-tight text-primary flex items-center gap-2">
                <Sparkles className="h-6 w-6" />
                Smart Food Recommendations
            </h1>
            <p className="text-base text-muted-foreground max-w-2xl">
              Get meal suggestions based on your goals and preferences.
            </p>
        </div>
        
        <Button variant="outline" onClick={fetchRecommendations} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Regenerate
        </Button>
        
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

const RecommendationCardSkeleton = () => (
    <div className="border-2 rounded-lg p-4 space-y-4 h-full flex flex-col">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex flex-wrap gap-2 pt-1">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <div className="flex-grow">
          <Skeleton className="h-16 w-full" />
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>
    </div>
)

const RecommendationsPageSkeleton = () => (
    <div className="space-y-6 animate-pulse">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-20 w-full" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <RecommendationCardSkeleton />
            <RecommendationCardSkeleton />
            <RecommendationCardSkeleton />
        </div>
    </div>
)


'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, RefreshCw, Lightbulb, AlertCircle } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { RecommendationCard } from '@/components/recommendations/recommendation-card';
import { generateRecommendations, type RecommendationResult, type Recommendation } from '@/services/recommendationService';
import { useUser, useFirestore } from '@/firebase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FoodConfirmationModal } from '@/components/recognize/food-confirmation-modal';
import { TransitionLink } from '@/components/shared/transition-link';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

const RecommendationCardSkeleton = () => (
  <div className="flex items-center gap-4 border-2 rounded-2xl p-4">
      <Skeleton className="h-12 w-12 rounded-full shrink-0" />
      <div className="flex-grow space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <div className="flex gap-2 pt-1">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-24 rounded-full" />
          </div>
      </div>
      <Skeleton className="h-10 w-10 rounded-full shrink-0" />
  </div>
);

export default function RecommendationsPage() {
  const { user, userProfile, isProfileLoading } = useUser();
  const db = useFirestore();
  const [data, setData] = useState<RecommendationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedFoodForModal, setSelectedFoodForModal] = useState<any | null>(null);
  
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
        micronutrientBreakdown: food.micronutrients || {},
        healthAnalysis: food.reason,
        suitability: "Suitable",
        isGhanaianLocal: true,
        detailedRecipe: food.detailedRecipe || { ingredients: [], instructions: [] },
    }
    setSelectedFoodForModal(foodItemForModal as any);
    setIsAddModalOpen(true);
  };

  const renderContent = () => {
    if (isLoading || isProfileLoading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-5 w-1/3" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
              <RecommendationCardSkeleton />
              <RecommendationCardSkeleton />
              <RecommendationCardSkeleton />
          </div>
        </div>
      );
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
            icon={<Lightbulb className="h-12 w-12 text-muted-foreground" />}
            title="No recommendations yet"
            description="Click the button to get AI-powered meal suggestions based on your goals."
          >
            <Button
              onClick={fetchRecommendations}
              size="lg"
              disabled={isLoading}
              className="animate-pulse-glow"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Recommendations
            </Button>
          </EmptyState>
        </motion.div>
      );
    }
    
    return (
      <div className="space-y-6">
        <p className="text-sm text-muted-foreground">
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
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {data.insightTips.map((tip, index) => <li key={index}>{tip}</li>)}
                </ul>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
          {data.recommendations.map((rec, index) => (
            <motion.div
              key={rec.foodId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.1 + index * 0.05 }}
            >
              <RecommendationCard
                recommendation={rec}
                onViewRecipe={() => { /* No longer used in this UI */ }}
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
            <p className="text-body text-muted-foreground max-w-2xl">
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
      
      <FoodConfirmationModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        foodItem={selectedFoodForModal}
      />
    </div>
  );
}

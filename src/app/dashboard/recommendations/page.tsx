
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, RefreshCw, Lightbulb, AlertCircle } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { RecommendationCard } from '@/components/recommendations/recommendation-card';
import { generateRecommendations, type RecommendationResult, type Recommendation } from '@/services/recommendationService';
import { useUser, useFirestore } from '@/firebase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { TransitionLink } from '@/components/shared/transition-link';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { RecipeDetailDrawer } from '@/components/recommendations/recipe-detail-drawer';
import { FoodConfirmationModal } from '@/components/recognize/food-confirmation-modal';
import type { FoodItem } from '@/types/food';

const RecommendationCardSkeleton = () => (
    <div className="flex flex-col gap-3 border-2 rounded-2xl p-3 sm:p-4">
        <div className="flex items-start gap-4">
        <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-full shrink-0" />
        <div className="flex-grow space-y-2 w-full">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3 w-full" />
        </div>
        </div>
        <div className="flex justify-end gap-2">
        <Skeleton className="h-9 w-24 rounded-md" />
        <Skeleton className="h-9 w-24 rounded-md" />
        </div>
    </div>
);


export default function RecommendationsPage() {
  const { user, userProfile, isProfileLoading } = useUser();
  const db = useFirestore();
  const [data, setData] = useState<RecommendationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for modals/drawers
  const [detailedRec, setDetailedRec] = useState<Recommendation | null>(null);
  const [foodToLog, setFoodToLog] = useState<FoodItem | null>(null);

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
  
  const handleStartLogging = (rec: Recommendation) => {
    const foodItem: FoodItem = {
      foodName: rec.name,
      estimatedWeightGrams: 100, // Recommendations are based on 100g
      calories: rec.calories,
      macronutrientBreakdown: {
        protein: rec.protein,
        carbohydrates: rec.carbs,
        fat: rec.fat,
      },
      micronutrientBreakdown: rec.micronutrients || {},
      isGhanaianLocal: true, // Assume local as per prompt
      detailedRecipe: rec.detailedRecipe || { ingredients: [], instructions: [] },
      foodHistory: '',
      healthAnalysis: rec.reason,
      suitability: 'Suitable', // Or derive this
    };
    setFoodToLog(foodItem);
  };


  const renderContent = () => {
    if (isLoading || isProfileLoading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-5 w-1/2 sm:w-1/3" />
          <div className="grid gap-4 grid-cols-1">
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
          <AlertCircle className="h-4 w-4 shrink-0" />
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
            icon={<Lightbulb className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />}
            title="No recommendations yet"
            description="Click the button to get AI-powered meal suggestions based on your goals."
          >
            <Button
              onClick={fetchRecommendations}
              size="lg"
              disabled={isLoading}
              className="w-full sm:w-auto animate-pulse-glow"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Recommendations
            </Button>
          </EmptyState>
        </motion.div>
      );
    }
    
    return (
      <div className="space-y-4 sm:space-y-6">
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
              <Lightbulb className="h-4 w-4 shrink-0" />
              <AlertTitle>Insightful Tips</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {data.insightTips.map((tip, index) => <li key={index}>{tip}</li>)}
                </ul>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        <div className="grid gap-3 sm:gap-4 grid-cols-1">
          {data.recommendations.map((rec, index) => (
            <motion.div
              key={rec.foodId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.1 + index * 0.05 }}
            >
              <RecommendationCard
                recommendation={rec}
                onViewDetails={() => setDetailedRec(rec)}
                onLog={() => handleStartLogging(rec)}
              />
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 sm:space-y-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl md:text-h1 font-bold tracking-tight text-primary flex flex-wrap items-center gap-2">
                <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 shrink-0" />
                <span>Smart Food Recommendations</span>
            </h1>
            <p className="text-sm sm:text-body text-muted-foreground max-w-2xl">
              Get meal suggestions based on your goals and preferences.
            </p>
        </div>
        
        <Button 
          variant="outline" 
          onClick={fetchRecommendations} 
          disabled={isLoading}
          className="w-full sm:w-auto"
        >
            <RefreshCw className={`mr-2 h-4 w-4 shrink-0 ${isLoading ? 'animate-spin' : ''}`} />
            Regenerate
        </Button>
        
      </div>

      <div className="min-h-[400px]">
        {renderContent()}
      </div>
      
      <RecipeDetailDrawer
        recommendation={detailedRec}
        isOpen={!!detailedRec}
        onClose={() => setDetailedRec(null)}
        onLogRequest={() => {
            if (detailedRec) {
                handleStartLogging(detailedRec);
                setDetailedRec(null);
            }
        }}
      />

      <FoodConfirmationModal
        isOpen={!!foodToLog}
        onClose={() => setFoodToLog(null)}
        foodItem={foodToLog}
      />
    </div>
  );
}

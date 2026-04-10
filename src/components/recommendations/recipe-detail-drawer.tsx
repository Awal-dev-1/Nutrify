'use client';

import { useState, useEffect, useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useUser } from '@/firebase';
import type { Recommendation } from '@/services/recommendationService';
import { CheckCircle, AlertTriangle, PlusCircle, Heart } from 'lucide-react';
import { FoodConfirmationModal } from '@/components/recognize/food-confirmation-modal';
import type { FoodItem } from '@/types/food';
import { cn } from '@/lib/utils';

interface RecipeDetailDrawerProps {
    recommendation: Recommendation | null;
    isOpen: boolean;
    onClose: () => void;
}

export function RecipeDetailDrawer({ recommendation, isOpen, onClose }: RecipeDetailDrawerProps) {
    const { userProfile } = useUser();
    const [checkedIngredients, setCheckedIngredients] = useState<boolean[]>([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    useEffect(() => {
        if (recommendation?.detailedRecipe?.ingredients) {
            setCheckedIngredients(new Array(recommendation.detailedRecipe.ingredients.length).fill(false));
        }
    }, [recommendation]);

    const handleIngredientCheck = (index: number) => {
        setCheckedIngredients(prev => {
            const newChecked = [...prev];
            newChecked[index] = !newChecked[index];
            return newChecked;
        });
    };

    const healthMatch = useMemo(() => {
        if (!recommendation || !userProfile?.goals?.dailyCalorieGoal) return null;

        const mealCalorieGoal = userProfile.goals.dailyCalorieGoal / 3;
        const calorieRatio = recommendation.calories / mealCalorieGoal;

        if (calorieRatio <= 1.1) {
            return {
                status: 'good',
                icon: CheckCircle,
                text: `Fits perfectly within your daily calorie goal.`,
                color: 'text-green-600 dark:text-green-400'
            };
        }
        if (calorieRatio <= 1.4) {
            return {
                status: 'average',
                icon: AlertTriangle,
                text: `This meal is a bit high in calories for your goal.`,
                color: 'text-amber-600 dark:text-amber-400'
            };
        }
        return null;
    }, [recommendation, userProfile]);

    const foodItemForModal: FoodItem | null = useMemo(() => {
        if (!recommendation) return null;
        return {
            foodName: recommendation.name,
            estimatedWeightGrams: 100,
            calories: recommendation.calories,
            macronutrientBreakdown: {
                protein: recommendation.protein,
                carbohydrates: recommendation.carbs,
                fat: recommendation.fat,
            },
            micronutrientBreakdown: recommendation.micronutrients || {},
            isGhanaianLocal: true,
            detailedRecipe: recommendation.detailedRecipe || { ingredients: [], instructions: [] },
            foodHistory: '',
            healthAnalysis: recommendation.reason,
            suitability: "Suitable"
        };
    }, [recommendation]);

    const renderContent = () => {
        if (!recommendation) {
            return <RecipeDrawerSkeleton />;
        }

        const { reason, detailedRecipe } = recommendation;

        return (
            <div className="space-y-6">
                {healthMatch && (
                    <Alert className={cn(
                        healthMatch.status === 'good' && 'bg-green-500/10 border-green-500/20',
                        healthMatch.status === 'average' && 'bg-amber-500/10 border-amber-500/20'
                    )}>
                        <healthMatch.icon className={cn("h-4 w-4", healthMatch.color)} />
                        <AlertTitle className={cn("font-semibold", healthMatch.color)}>Health Match</AlertTitle>
                        <AlertDescription className="text-foreground/80">{healthMatch.text}</AlertDescription>
                    </Alert>
                )}

                <div className="bg-primary/5 p-4 rounded-lg">
                    <h3 className="font-semibold flex items-center gap-2 mb-2"><Heart className="h-4 w-4 text-primary"/>Why this is good for you</h3>
                    <p className="text-sm text-muted-foreground">{reason}</p>
                </div>

                {detailedRecipe?.ingredients && detailedRecipe.ingredients.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="font-semibold text-lg">Ingredients</h3>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                            {detailedRecipe.ingredients.map((ingredient, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                    <Checkbox id={`ing-${index}`} checked={checkedIngredients[index]} onCheckedChange={() => handleIngredientCheck(index)} />
                                    <Label htmlFor={`ing-${index}`} className={cn("text-sm transition-colors", checkedIngredients[index] && "line-through text-muted-foreground")}>
                                        {ingredient}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {detailedRecipe?.instructions && detailedRecipe.instructions.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="font-semibold text-lg">Instructions</h3>
                        <ol className="list-decimal list-outside pl-5 space-y-4 text-muted-foreground text-sm leading-relaxed">
                            {detailedRecipe.instructions.map((instruction, index) => (
                                <li key={index}>{instruction}</li>
                            ))}
                        </ol>
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            <Sheet open={isOpen} onOpenChange={onClose}>
                <SheetContent side="bottom" className="h-[90vh] flex flex-col rounded-t-2xl">
                    <SheetHeader className="text-left pr-10">
                        <SheetTitle className="text-2xl truncate">{recommendation?.name || <Skeleton className="h-8 w-48" />}</SheetTitle>
                        <SheetDescription>
                            {recommendation ? `${Math.round(recommendation.calories)} kcal · ${recommendation.protein.toFixed(0)}g P · ${recommendation.carbs.toFixed(0)}g C · ${recommendation.fat.toFixed(0)}g F` : <Skeleton className="h-5 w-64" />}
                        </SheetDescription>
                    </SheetHeader>
                    <ScrollArea className="flex-1 -mx-6 px-6 my-4">
                        {renderContent()}
                    </ScrollArea>
                    <SheetFooter className="bg-background pt-4 sticky bottom-0">
                        <Button size="lg" className="w-full h-14 text-lg" onClick={() => setIsAddModalOpen(true)} disabled={!recommendation}>
                            <PlusCircle className="mr-2 h-5 w-5" /> Add to Today's Log
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
            <FoodConfirmationModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                foodItem={foodItemForModal}
            />
        </>
    );
}

const RecipeDrawerSkeleton = () => (
    <div className="space-y-6 animate-pulse">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-24 w-full" />
        <div className="space-y-3">
            <Skeleton className="h-6 w-32" />
            <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
            </div>
        </div>
        <div className="space-y-3">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-4/5" />
        </div>
    </div>
);


'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useUser, useFirestore } from '@/firebase';
import type { Recommendation } from '@/services/recommendationService';
import { addFoodToLog } from '@/services/trackerService';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, AlertTriangle, PlusCircle, Heart, Coffee, Sun, Moon } from 'lucide-react';
import type { FoodItem } from '@/types/food';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface RecipeDetailDrawerProps {
    recommendation: Recommendation | null;
    isOpen: boolean;
    onClose: () => void;
}

const viewVariants = {
    enter: (direction: number) => ({
      opacity: 0,
      x: direction > 0 ? 50 : -50,
    }),
    center: {
      opacity: 1,
      x: 0,
    },
    exit: (direction: number) => ({
      opacity: 0,
      x: direction < 0 ? 50 : -50,
    }),
  };

const SuccessView = () => (
    <div className="flex flex-col items-center justify-center text-center h-full absolute inset-0">
        <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25, delay: 0.1 }}
            className="flex flex-col items-center justify-center"
        >
            <CheckCircle className="h-20 w-20 text-green-500" />
            <p className="mt-4 text-lg font-medium">Logged Successfully!</p>
            <p className="text-sm text-muted-foreground">Redirecting to your tracker...</p>
        </motion.div>
    </div>
);

const MealTypeSelector = ({ onSelect }: { onSelect: (mealType: 'Breakfast' | 'Lunch' | 'Dinner') => void }) => {
    const mealTypes = [
        { name: 'Breakfast', icon: Coffee, color: 'text-amber-500' },
        { name: 'Lunch', icon: Sun, color: 'text-orange-500' },
        { name: 'Dinner', icon: Moon, color: 'text-indigo-500' },
    ] as const;

    return (
        <div className="flex flex-col items-center justify-center h-full absolute inset-0">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-sm text-center space-y-4"
            >
                <h3 className="text-xl font-semibold">Which meal was this?</h3>
                {mealTypes.map((meal, index) => (
                    <motion.div
                        key={meal.name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: 0.1 + index * 0.05 }}
                    >
                        <Button 
                            onClick={() => onSelect(meal.name)} 
                            className="w-full h-16 text-lg rounded-xl"
                            variant="outline"
                        >
                            <meal.icon className={cn("mr-4 h-6 w-6", meal.color)} />
                            {meal.name}
                        </Button>
                    </motion.div>
                ))}
            </motion.div>
        </div>
    );
};


export function RecipeDetailDrawer({ recommendation, isOpen, onClose }: RecipeDetailDrawerProps) {
    const { user, userProfile } = useUser();
    const db = useFirestore();
    const { toast } = useToast();
    const router = useRouter();

    const [view, setView] = useState<'details' | 'selectingMeal' | 'success'>('details');
    const [direction, setDirection] = useState(1);
    const [checkedIngredients, setCheckedIngredients] = useState<boolean[]>([]);

    useEffect(() => {
        if (isOpen && recommendation) {
            setView('details');
            setCheckedIngredients(new Array(recommendation.detailedRecipe?.ingredients.length || 0).fill(false));
        }
    }, [isOpen, recommendation]);

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

    const foodItemForLogging: FoodItem | null = useMemo(() => {
        if (!recommendation) return null;
        return {
            foodName: recommendation.name,
            estimatedWeightGrams: 100, // Recommendations are based on 100g
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
    
    const handleLogMeal = async (mealType: 'Breakfast' | 'Lunch' | 'Dinner') => {
        if (!foodItemForLogging || !user || !db) return;
        
        setDirection(1);
        setView('success');
        
        toast({
            title: 'Meal Logged!',
            description: `${foodItemForLogging.foodName} added to ${mealType}.`,
        });

        setTimeout(() => {
            onClose();
            router.push('/dashboard/tracker');
        }, 1200);

        try {
            await addFoodToLog(db, user.uid, mealType, foodItemForLogging, 100);
        } catch (err) {
            console.error("Background log failed:", err);
        }
    };
    
    const handleStartLogging = () => {
        setDirection(1);
        setView('selectingMeal');
    };

    const renderDetails = () => {
        if (!recommendation) return <RecipeDrawerSkeleton />;

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
                    <h3 className="font-semibold flex items-center gap-2 mb-2"><Heart className="h-4 w-4 text-primary"/>Why it's good for you</h3>
                    <p className="text-sm text-muted-foreground">{reason}</p>
                </div>
                {detailedRecipe?.ingredients && detailedRecipe.ingredients.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="font-semibold text-lg">Ingredients</h3>
                        <div className="flex flex-col space-y-2">
                            {detailedRecipe.ingredients.map((ingredient, index) => (
                                <div key={index} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50">
                                    <Checkbox id={`ing-${index}`} checked={checkedIngredients[index]} onCheckedChange={() => handleIngredientCheck(index)} />
                                    <Label htmlFor={`ing-${index}`} className={cn("text-base transition-colors", checkedIngredients[index] && "line-through text-muted-foreground")}>
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
                        <ol className="list-decimal list-outside pl-5 space-y-4 text-muted-foreground text-base leading-relaxed">
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
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent side="bottom" className="max-h-[90vh] h-fit flex flex-col rounded-t-2xl">
                <SheetHeader className="text-left pr-10">
                    <SheetTitle className="text-2xl truncate">{recommendation?.name || <Skeleton className="h-8 w-48" />}</SheetTitle>
                    <SheetDescription>
                        {recommendation ? `${Math.round(recommendation.calories)} kcal · ${recommendation.protein.toFixed(0)}g P · ${recommendation.carbs.toFixed(0)}g C · ${recommendation.fat.toFixed(0)}g F` : <Skeleton className="h-5 w-64" />}
                    </SheetDescription>
                </SheetHeader>
                <div className="relative flex-1 my-4">
                    <AnimatePresence initial={false} custom={direction}>
                        <motion.div
                            key={view}
                            custom={direction}
                            variants={viewVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="h-full"
                        >
                            {view === 'details' && <ScrollArea className="h-full pr-4">{renderDetails()}</ScrollArea>}
                            {view === 'selectingMeal' && <MealTypeSelector onSelect={handleLogMeal} />}
                            {view === 'success' && <SuccessView />}
                        </motion.div>
                    </AnimatePresence>
                </div>
                {view === 'details' && (
                     <SheetFooter className="bg-background pt-4 sticky bottom-0">
                        <Button size="lg" className="w-full h-14 text-lg" onClick={handleStartLogging} disabled={!recommendation}>
                            <PlusCircle className="mr-2 h-5 w-5" /> Add to Today's Log
                        </Button>
                    </SheetFooter>
                )}
            </SheetContent>
        </Sheet>
    );
}

const RecipeDrawerSkeleton = () => (
    <div className="space-y-6 animate-pulse">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-24 w-full" />
        <div className="space-y-3">
            <Skeleton className="h-6 w-32" />
            <div className="flex flex-col space-y-3">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
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

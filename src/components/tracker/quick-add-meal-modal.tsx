
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUser, useFirestore, useToast } from '@/hooks';
import { searchFoods, type FoodItem } from '@/ai/flows/search-foods-flow';
import { addFoodToLog } from '@/services/trackerService';
import { Loader2, Search, Sparkles, Flame, Beef, Wheat, Droplets, Plus, Utensils, AlertCircle, Stethoscope } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import SuitabilityBadge from '../food/suitability-badge';

type ModalStep = 'search' | 'loading' | 'result' | 'error';
type MealType = "Breakfast" | "Lunch" | "Dinner";

interface QuickAddMealModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickAddMealModal({ isOpen, onClose }: QuickAddMealModalProps) {
  const [step, setStep] = useState<ModalStep>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [aiResult, setAiResult] = useState<FoodItem | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [quantity, setQuantity] = useState(100);
  const [mealType, setMealType] = useState<MealType>('Lunch');
  const [isAdding, setIsAdding] = useState(false);

  const { user, userProfile } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setStep('loading');
    try {
      const response = await searchFoods({
        query: searchQuery,
        userProfile: userProfile ? { health: userProfile.health } : undefined,
      });

      if (!response.isFoodQuery || response.foodItems.length === 0) {
        throw new Error('Our AI could not identify that food. Please try a different description.');
      }
      setAiResult(response.foodItems[0]);
      setQuantity(response.foodItems[0].estimatedWeightGrams || 100);
      setStep('result');
    } catch (err: any) {
      setErrorMessage(err.message || 'An unknown error occurred.');
      setStep('error');
    }
  };

  const handleConfirm = async () => {
    if (!aiResult || !user || !db || !mealType) return;
    setIsAdding(true);
    try {
      await addFoodToLog(db, user.uid, mealType, aiResult, quantity);
      toast({
        title: 'Meal Logged!',
        description: `${aiResult.foodName} has been added to your ${mealType}.`,
      });
      router.push('/dashboard/tracker'); // Navigate to see the result
      handleClose();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not log meal.' });
      setIsAdding(false);
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setStep('search');
      setSearchQuery('');
      setAiResult(null);
      setErrorMessage('');
      setIsAdding(false);
    }, 300); // Delay reset to allow for exit animation
  };
  
  const calculatedNutrients = aiResult ? {
      calories: (aiResult.calories / (aiResult.estimatedWeightGrams || 100)) * quantity,
      protein: (aiResult.macronutrientBreakdown.protein / (aiResult.estimatedWeightGrams || 100)) * quantity,
      carbs: (aiResult.macronutrientBreakdown.carbohydrates / (aiResult.estimatedWeightGrams || 100)) * quantity,
      fat: (aiResult.macronutrientBreakdown.fat / (aiResult.estimatedWeightGrams || 100)) * quantity,
    } : null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden backdrop-blur-xl bg-background/80">
        <div className="relative min-h-[400px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="absolute inset-0 p-6 flex flex-col"
            >
              {step === 'search' && (
                <>
                  <DialogHeader className="text-left">
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Utensils className="h-5 w-5 text-primary"/>
                        Log a Meal
                    </DialogTitle>
                    <DialogDescription>
                      Describe your meal and let our AI analyze it for you.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex-grow flex flex-col justify-center items-center gap-4 py-4">
                    <Input
                      id="meal-description"
                      placeholder="e.g., A bowl of fufu with light soup"
                      className="h-12 text-base text-center"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <Button onClick={handleSearch} disabled={!searchQuery.trim()} className="w-full h-11">
                      <Sparkles className="mr-2 h-4 w-4" /> Analyze with AI
                    </Button>
                  </div>
                </>
              )}
              {step === 'loading' && (
                <div className="flex flex-col items-center justify-center h-full text-center gap-4">
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 bg-primary/20 rounded-full animate-pulse blur-xl"></div>
                    <Loader2 className="relative h-16 w-16 text-primary animate-spin" />
                  </div>
                  <h3 className="font-semibold text-lg">Analyzing...</h3>
                  <p className="text-muted-foreground text-sm">Our AI is working its magic on your meal.</p>
                </div>
              )}
               {step === 'result' && aiResult && calculatedNutrients && (
                <div className="flex flex-col h-full">
                    <DialogHeader className="text-left">
                        <div className="flex flex-wrap items-center gap-2">
                           <DialogTitle className="text-xl">{aiResult.foodName}</DialogTitle>
                           <SuitabilityBadge suitability={aiResult.suitability} />
                        </div>
                        <DialogDescription>Here's the nutritional breakdown. Confirm to log it.</DialogDescription>
                    </DialogHeader>
                    <div className="flex-grow my-4 space-y-4 overflow-y-auto pr-2">
                        <div className="p-4 rounded-xl border bg-muted/50 text-center space-y-2">
                             <p className="text-4xl font-bold text-primary">{calculatedNutrients.calories.toFixed(0)}</p>
                             <p className="text-sm text-muted-foreground">Est. Calories</p>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="p-2 rounded-lg bg-muted/30">
                                <Beef className="mx-auto h-5 w-5 text-red-500 mb-1"/>
                                <p className="font-bold">{calculatedNutrients.protein.toFixed(1)}g</p>
                                <p className="text-xs text-muted-foreground">Protein</p>
                            </div>
                             <div className="p-2 rounded-lg bg-muted/30">
                                <Wheat className="mx-auto h-5 w-5 text-yellow-600 mb-1"/>
                                <p className="font-bold">{calculatedNutrients.carbs.toFixed(1)}g</p>
                                <p className="text-xs text-muted-foreground">Carbs</p>
                            </div>
                             <div className="p-2 rounded-lg bg-muted/30">
                                <Droplets className="mx-auto h-5 w-5 text-blue-500 mb-1"/>
                                <p className="font-bold">{calculatedNutrients.fat.toFixed(1)}g</p>
                                <p className="text-xs text-muted-foreground">Fat</p>
                            </div>
                        </div>

                        {aiResult.healthAnalysis && (
                          <Alert className="bg-primary/5 border-primary/10 text-xs">
                            <Stethoscope className="h-4 w-4 text-primary" />
                            <AlertTitle className="text-primary font-semibold">Health Analysis</AlertTitle>
                            <AlertDescription className="text-primary/90">
                              {aiResult.healthAnalysis}
                            </AlertDescription>
                          </Alert>
                        )}

                        <div className="grid grid-cols-2 gap-4 items-end">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Quantity (g)</label>
                                <Input type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Meal</label>
                                <Select value={mealType} onValueChange={(v) => setMealType(v as MealType)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Breakfast">Breakfast</SelectItem>
                                        <SelectItem value="Lunch">Lunch</SelectItem>
                                        <SelectItem value="Dinner">Dinner</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="mt-auto pt-4 border-t">
                        <Button variant="outline" onClick={() => setStep('search')}>Back</Button>
                        <Button onClick={handleConfirm} disabled={isAdding}>
                            {isAdding ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : <Plus className="mr-2 h-4 w-4"/>}
                             Log Meal
                        </Button>
                    </DialogFooter>
                </div>
              )}
              {step === 'error' && (
                <div className="flex flex-col items-center justify-center h-full text-center gap-4">
                  <AlertCircle className="h-12 w-12 text-destructive" />
                  <h3 className="font-semibold text-lg">Analysis Failed</h3>
                  <p className="text-muted-foreground text-sm">{errorMessage}</p>
                  <Button onClick={() => setStep('search')} className="w-full">Try Again</Button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}

    
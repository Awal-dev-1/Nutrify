
'use client';

import type { FC } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Beef, Wheat, Droplets, PlusCircle, Stethoscope, Sparkles, Utensils } from 'lucide-react';
import type { AIPrediction } from '@/types/ai';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';


export const AiFoodResultCard: FC<{
  item: AIPrediction;
  onAdd: (item: AIPrediction) => void;
  onAddToPlan: (item: AIPrediction) => void;
  imageUrl: string | null;
}> = ({ item, onAdd, onAddToPlan, imageUrl }) => {
  const hasMicros = item.micronutrientBreakdown && 
                    Object.values(item.micronutrientBreakdown).some(v => v !== undefined && v !== null && v > 0);

  return (
    <Card className="overflow-hidden border-2 border-primary/10 shadow-lg">
      <CardHeader className="p-0">
        {imageUrl && (
          <div className="relative w-full h-64 bg-muted">
              <Image src={imageUrl} alt={item.foodName} fill className="object-contain" />
          </div>
        )}
        <div className="p-4 md:p-6">
            <div className="flex flex-wrap items-center gap-4 justify-between">
                <CardTitle className="text-2xl font-bold">{item.foodName}</CardTitle>
                <Badge variant="secondary" className="text-xs sm:text-sm">
                    <Sparkles className="h-3 w-3 mr-1.5" />
                    AI Analyzed
                </Badge>
            </div>
            <div className="text-3xl font-extrabold text-primary pt-2">
                {item.calories.toFixed(0)}{' '}
                <span className="text-lg font-medium text-muted-foreground">kcal (for ~{item.estimatedWeightGrams}g)</span>
            </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 md:p-6 pt-0 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Macronutrients</CardTitle>
                    <CardDescription>For the estimated {item.estimatedWeightGrams}g portion</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-2 text-center">
                    <div className="space-y-1">
                        <div className="inline-flex p-2 rounded-full bg-red-50 dark:bg-red-950/20"><Beef className="h-4 w-4 text-red-500" /></div>
                        <p className="text-xs text-muted-foreground">Protein</p>
                        <p className="font-bold">{item.macronutrientBreakdown.protein.toFixed(1)}g</p>
                    </div>
                    <div className="space-y-1">
                            <div className="inline-flex p-2 rounded-full bg-yellow-50 dark:bg-yellow-950/20"><Wheat className="h-4 w-4 text-yellow-600" /></div>
                        <p className="text-xs text-muted-foreground">Carbs</p>
                        <p className="font-bold">{item.macronutrientBreakdown.carbohydrates.toFixed(1)}g</p>
                    </div>
                    <div className="space-y-1">
                            <div className="inline-flex p-2 rounded-full bg-blue-50 dark:bg-blue-950/20"><Droplets className="h-4 w-4 text-blue-500" /></div>
                        <p className="text-xs text-muted-foreground">Fat</p>
                        <p className="font-bold">{item.macronutrientBreakdown.fat.toFixed(1)}g</p>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Micronutrients</CardTitle>
                    <CardDescription>For the estimated {item.estimatedWeightGrams}g portion</CardDescription>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                    <ul className="space-y-1 max-h-48 overflow-y-auto">
                        {hasMicros ? (
                            Object.entries(item.micronutrientBreakdown).map(([key, value]) => {
                                if (value === undefined || value === null || value === 0) {
                                    return null;
                                }
                                const keyToLabel: Record<string, string> = {
                                    fiber: "Fiber",
                                    sugar: "Sugar",
                                    iron: "Iron",
                                    calcium: "Calcium",
                                    vitaminA: "Vitamin A",
                                    vitaminC: "Vitamin C",
                                    sodium: "Sodium",
                                };
                                const keyToUnit: Record<string, string> = {
                                    fiber: "g",
                                    sugar: "g",
                                    iron: "mg",
                                    calcium: "mg",
                                    vitaminA: "µg",
                                    vitaminC: "mg",
                                    sodium: "mg",
                                };
                                return (
                                <li key={key} className="flex justify-between p-1.5 rounded-md bg-muted/50 text-xs">
                                    <span>{keyToLabel[key] || key}</span>
                                    <span className="font-medium">{(value as number).toFixed(1)}{keyToUnit[key] || ''}</span>
                                </li>
                                );
                            })
                        ) : (
                            <p className="text-xs text-muted-foreground text-center py-4">No significant micronutrient data available.</p>
                        )}
                    </ul>
                </CardContent>
            </Card>
        </div>
        
        {item.healthAnalysis && (
          <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900 mt-4">
            <Stethoscope className="h-4 w-4 text-blue-600 dark:text-blue-300" />
            <AlertTitle className="text-blue-800 dark:text-blue-200">Health Tip</AlertTitle>
            <AlertDescription className="text-blue-700 dark:text-blue-200/90">
              {item.healthAnalysis}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
       <CardFooter className="flex-col sm:flex-row gap-2">
        <Button className="w-full" variant="secondary" onClick={() => onAddToPlan(item)}>
            <Utensils className="mr-2 h-4 w-4" /> Add to Meal Plan
        </Button>
        <Button className="w-full" onClick={() => onAdd(item)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add to Daily Tracker
        </Button>
      </CardFooter>
    </Card>
  );
};

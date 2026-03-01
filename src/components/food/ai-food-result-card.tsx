'use client';

import type { FC } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Stethoscope, BookOpen, CookingPot, Salad, Beef, Wheat, Droplets, PlusCircle } from 'lucide-react';
import type { FoodItem } from '@/types/food';

export const AiFoodResultCard: FC<{ item: FoodItem; userGoal?: string; onAdd: (item: FoodItem) => void; }> = ({ item, userGoal, onAdd }) => {
  return (
    <Card className="overflow-hidden border-2 border-primary/10 shadow-lg animate-in fade-in-50 duration-500">
      <CardHeader className="bg-primary/5">
        <CardTitle className="text-2xl font-bold">{item.foodName}</CardTitle>
        <div className="text-3xl font-extrabold text-primary pt-2">
            {item.calories.toFixed(0)}{' '}
            <span className="text-lg font-medium text-muted-foreground">kcal (estimated)</span>
        </div>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        <Tabs defaultValue="analysis" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-4">
                <TabsTrigger value="analysis"><Stethoscope className="h-4 w-4 mr-1" />Analysis</TabsTrigger>
                <TabsTrigger value="nutrients"><Salad className="h-4 w-4 mr-1" />Nutrients</TabsTrigger>
                <TabsTrigger value="history"><BookOpen className="h-4 w-4 mr-1" />History</TabsTrigger>
                <TabsTrigger value="recipe"><CookingPot className="h-4 w-4 mr-1" />Recipe</TabsTrigger>
            </TabsList>
            
            <TabsContent value="analysis">
                <Card>
                    <CardHeader>
                        <CardTitle>Health Analysis</CardTitle>
                        <CardDescription>
                          For your goal: <span className="capitalize font-medium text-primary">{userGoal?.replace('-', ' ') || 'Not set'}</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm space-y-3">
                      <p>{item.healthAnalysis}</p>
                    </CardContent>
                </Card>
            </TabsContent>
            
            <TabsContent value="nutrients">
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Macronutrients</CardTitle>
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
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                        <ul className="space-y-1 max-h-48 overflow-y-auto">
                            {item.micronutrientBreakdown.map((nutrient, i) => (
                              <li key={i} className="flex justify-between p-1.5 rounded-md bg-muted/50 text-xs">
                                <span>{nutrient.split(':')[0]}</span>
                                <span className="font-medium">{nutrient.split(':')[1]}</span>
                              </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="history">
                <Card>
                    <CardHeader>
                        <CardTitle>Cultural History</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-3">
                        <p>{item.foodHistory}</p>
                    </CardContent>
                </Card>
            </TabsContent>
            
            <TabsContent value="recipe">
                <Card>
                    <CardHeader>
                        <CardTitle>Detailed Recipe</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-6">
                        <div>
                            <h4 className="font-semibold text-base mb-2">Ingredients</h4>
                            <ul className="list-disc list-outside pl-5 space-y-2">
                                {item.detailedRecipe.ingredients.map((ingredient, i) => <li key={i}>{ingredient}</li>)}
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-base mb-2">Instructions</h4>
                            <ol className="list-decimal list-outside pl-5 space-y-2">
                                {item.detailedRecipe.instructions.map((instruction, i) => <li key={i}>{instruction}</li>)}
                            </ol>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
      </CardContent>
       <CardFooter>
        <Button className="w-full" onClick={() => onAdd(item)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add to Daily Tracker
        </Button>
      </CardFooter>
    </Card>
  );
};

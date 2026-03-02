'use client';

import type { GenerateDailyRecommendationsOutput } from '@/ai/flows/generate-daily-recommendations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { BrainCircuit, Utensils, Lightbulb, ChefHat } from 'lucide-react';

interface AiCoachCardProps {
  data: GenerateDailyRecommendationsOutput;
}

export const AiCoachCard = ({ data }: AiCoachCardProps) => {
  return (
    <Card className="border-2 border-primary/10 shadow-lg animate-in fade-in-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <BrainCircuit className="text-primary" />
          Your AI Daily Coach
        </CardTitle>
        <CardDescription>Here are your personalized suggestions for the rest of the day.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="suggestions" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="suggestions"><Utensils className="mr-2 h-4 w-4" />Suggestions</TabsTrigger>
            <TabsTrigger value="tips"><Lightbulb className="mr-2 h-4 w-4" />Tips</TabsTrigger>
            <TabsTrigger value="recipes"><ChefHat className="mr-2 h-4 w-4" />Recipes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="suggestions" className="mt-4">
            <div className="space-y-4">
              {data.mealSuggestions.map((meal, index) => (
                <Card key={index} className="bg-muted/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{meal.name} <span className="text-muted-foreground font-normal">for {meal.mealType}</span></CardTitle>
                    <CardDescription>{meal.portionSize} &bull; ~{meal.calories} kcal</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground italic">"{meal.reason}"</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="tips" className="mt-4">
            <ul className="space-y-3 list-disc list-inside text-sm">
                {data.aiTips.map((tip, index) => (
                    <li key={index}>{tip}</li>
                ))}
            </ul>
          </TabsContent>
          
          <TabsContent value="recipes" className="mt-4">
             <Accordion type="single" collapsible className="w-full space-y-2">
                {data.recipeIdeas.map((recipe, index) => (
                    <AccordionItem key={index} value={`item-${index}`} className="border rounded-md bg-muted/30">
                        <AccordionTrigger className="px-4 text-left">
                            <div>
                                <p className="font-semibold">{recipe.name}</p>
                                <p className="text-xs text-muted-foreground">{recipe.prepTime} &bull; ~{recipe.calories} kcal</p>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pt-2">
                            <p className="text-sm italic mb-4">{recipe.description}</p>
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-semibold mb-2">Ingredients</h4>
                                    <ul className="space-y-1 list-disc list-inside text-sm text-muted-foreground">
                                        {recipe.ingredients.map((ing, i) => <li key={i}>{ing}</li>)}
                                    </ul>
                                </div>
                                 <div>
                                    <h4 className="font-semibold mb-2">Instructions</h4>
                                    <ol className="space-y-2 list-decimal list-inside text-sm text-muted-foreground">
                                        {recipe.instructions.map((inst, i) => <li key={i}>{inst}</li>)}
                                    </ol>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

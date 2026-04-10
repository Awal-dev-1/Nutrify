
'use client';

import { useState, useMemo, type FC } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { doc } from 'firebase/firestore';
import {
  ArrowLeft,
  Flame,
  Beef,
  Wheat,
  Droplets,
  PlusCircle,
  Sparkles,
  ShieldCheck,
  Zap,
  Leaf,
  Minus,
  Plus,
} from 'lucide-react';
import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  ResponsiveContainer,
} from 'recharts';

import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import type { FoodItem } from '@/types/food';
import { NUTRIENT_DRV, NUTRIENT_LABELS, NUTRIENT_UNITS, MicronutrientKey } from '@/lib/nutrients';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { FoodConfirmationModal } from '@/components/recognize/food-confirmation-modal';
import SuitabilityBadge from '@/components/food/suitability-badge';
import { Input } from '@/components/ui/input';

// Health Gauge Component
const HealthGauge: FC<{ suitability?: 'Suitable' | 'Moderately Suitable' | 'Not Suitable' }> = ({ suitability }) => {
  const { score, color, label } = useMemo(() => {
    switch (suitability) {
      case 'Suitable':
        return { score: 90, color: 'hsl(var(--chart-2))', label: 'Great Choice' };
      case 'Moderately Suitable':
        return { score: 60, color: 'hsl(var(--chart-4))', label: 'Good Choice' };
      case 'Not Suitable':
        return { score: 25, color: 'hsl(var(--destructive))', label: 'Consider Alternatives' };
      default:
        return { score: 0, color: 'hsl(var(--muted))', label: 'N/A' };
    }
  }, [suitability]);

  const data = [{ name: 'score', value: score }];

  return (
    <div className="relative h-40 w-40 sm:h-48 sm:w-48">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          innerRadius="80%"
          outerRadius="100%"
          barSize={12}
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <RadialBar
            background
            dataKey="value"
            angleAxisId={0}
            fill={color}
            cornerRadius="50%"
            className="transition-colors"
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <p className="text-3xl sm:text-4xl font-bold" style={{ color }}>
          {score}
        </p>
        <p className="text-xs font-medium text-muted-foreground mt-1 max-w-[80px]">{label}</p>
      </div>
    </div>
  );
};


export default function FoodDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const db = useFirestore();

  const [quantity, setQuantity] = useState(100);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const foodRef = useMemoFirebase(() => (db && id ? doc(db, 'foodItems', id) : null), [db, id]);
  const { data: food, isLoading, error } = useDoc<FoodItem>(foodRef);

  const calculatedNutrients = useMemo(() => {
    if (!food) return null;
    const ratio = quantity / 100; // All base nutrients are per 100g
    return {
      calories: (food.calories || 0) * ratio,
      protein: (food.macronutrientBreakdown.protein || 0) * ratio,
      carbs: (food.macronutrientBreakdown.carbohydrates || 0) * ratio,
      fat: (food.macronutrientBreakdown.fat || 0) * ratio,
    };
  }, [food, quantity]);
  
  const nutrientPros = useMemo(() => {
    if (!food) return [];
    const pros = [];
    
    // High Protein
    const proteinDRV = 50; // g
    if ((food.macronutrientBreakdown.protein / proteinDRV) * 100 > 30) {
      pros.push({ label: "High Protein", icon: <Beef className="h-3 w-3" /> });
    }
    // High Fiber
    if (food.micronutrientBreakdown?.fiber && (food.micronutrientBreakdown.fiber / (NUTRIENT_DRV.fiber || 28)) * 100 > 20) {
      pros.push({ label: "High Fiber", icon: <Leaf className="h-3 w-3" /> });
    }
     // Low Sugar
    if (food.micronutrientBreakdown?.sugar !== undefined && (food.micronutrientBreakdown.sugar / (NUTRIENT_DRV.sugar || 50)) * 100 < 10) {
      pros.push({ label: "Low Sugar", icon: <Zap className="h-3 w-3 text-red-500" /> });
    }
    // Rich in Iron
    if (food.micronutrientBreakdown?.iron && (food.micronutrientBreakdown.iron / (NUTRIENT_DRV.iron || 18)) * 100 > 20) {
      pros.push({ label: "Rich in Iron", icon: <ShieldCheck className="h-3 w-3" /> });
    }

    return pros.slice(0, 3);
  }, [food]);


  const handleAdd = () => {
    if (food) {
      setIsModalOpen(true);
    }
  };
  
  if (isLoading) {
    return <FoodDetailsSkeleton />;
  }

  if (error || !food) {
    return (
      <div className="pt-10">
        <EmptyState
          title={error ? "Error Loading Food" : "Food Not Found"}
          description={error?.message || "There was a problem fetching the food details. It may have been removed."}
        >
          <Button onClick={() => router.back()} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
          </Button>
        </EmptyState>
      </div>
    );
  }
  
  const foodForModal = {
    ...food,
    estimatedWeightGrams: quantity
  };
  
  const hasMicros = food.micronutrientBreakdown && Object.values(food.micronutrientBreakdown).some(v => v !== undefined && v !== null && v > 0);

  return (
    <div className="pb-28"> {/* Padding for the sticky footer */}
      <div className="relative max-w-md mx-auto space-y-4">
        {/* 1. Back Button */}
        <div className="absolute top-1 -left-2 z-10">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-10 w-10 bg-background/50 backdrop-blur-sm rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>

        {/* 2. Hero Image */}
        <Card className="overflow-hidden border-0 shadow-none">
          <CardHeader className="p-0 h-64 sm:h-80 relative">
            <Image
              src={food.isGhanaianLocal ? 'https://picsum.photos/seed/ghanafood/600/400' : 'https://picsum.photos/seed/otherfood/600/400'}
              alt={food.foodName}
              fill
              className="object-cover"
              data-ai-hint={food.isGhanaianLocal ? "ghanaian food" : "healthy meal"}
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          </CardHeader>
        </Card>
        
        {/* 3. Main Content */}
        <div className="p-4 space-y-6 -mt-16 relative z-10">

          {/* Title and Suitability */}
          <div className="text-center space-y-3">
              <h1 className="text-h2 font-bold tracking-tight">{food.foodName}</h1>
              <SuitabilityBadge suitability={food.suitability} />
          </div>

          {/* Health Gauge & Pros */}
          <Card className="border-2">
            <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-4">
                <HealthGauge suitability={food.suitability} />
                <div className="flex-1 space-y-3">
                  <h3 className="text-sm font-semibold text-center sm:text-left">Health Highlights</h3>
                  <div className="flex flex-col gap-2">
                    {nutrientPros.map(pro => (
                      <Badge key={pro.label} variant="secondary" className="justify-start py-1.5 px-3 text-xs gap-2">
                        {pro.icon} {pro.label}
                      </Badge>
                    ))}
                  </div>
                </div>
            </CardContent>
          </Card>
          
          {/* Portion Adjuster */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Portion Size</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <span className="text-4xl font-bold text-primary">{calculatedNutrients?.calories.toFixed(0)}</span>
                <span className="text-muted-foreground"> kcal</span>
              </div>
               <div className="flex items-center gap-2">
                  <Button size="icon" variant="outline" onClick={() => setQuantity(q => Math.max(10, q - 25))}><Minus /></Button>
                  <Input type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} className="text-center text-lg h-12" />
                  <Button size="icon" variant="outline" onClick={() => setQuantity(q => q + 25)}><Plus /></Button>
              </div>
            </CardContent>
          </Card>

          {/* Details Accordion */}
          <Accordion type="multiple" defaultValue={['macros', 'analysis']} className="w-full space-y-3">

            {/* Macros */}
            <AccordionItem value="macros" className="border rounded-lg bg-card">
                <AccordionTrigger className="text-base font-semibold px-4 hover:no-underline">Macronutrients</AccordionTrigger>
                <AccordionContent className="px-4 pt-2">
                   <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 bg-muted/50 rounded-lg">
                          <Beef className="h-5 w-5 mx-auto text-red-500"/>
                          <p className="font-bold mt-1">{calculatedNutrients?.protein.toFixed(1)}g</p>
                          <p className="text-xs text-muted-foreground">Protein</p>
                      </div>
                      <div className="p-2 bg-muted/50 rounded-lg">
                          <Wheat className="h-5 w-5 mx-auto text-yellow-600"/>
                          <p className="font-bold mt-1">{calculatedNutrients?.carbs.toFixed(1)}g</p>
                          <p className="text-xs text-muted-foreground">Carbs</p>
                      </div>
                      <div className="p-2 bg-muted/50 rounded-lg">
                          <Droplets className="h-5 w-5 mx-auto text-blue-500"/>
                          <p className="font-bold mt-1">{calculatedNutrients?.fat.toFixed(1)}g</p>
                          <p className="text-xs text-muted-foreground">Fat</p>
                      </div>
                  </div>
                </AccordionContent>
            </AccordionItem>
            
            {/* Micros */}
            {hasMicros && (
              <AccordionItem value="micros" className="border rounded-lg bg-card">
                <AccordionTrigger className="text-base font-semibold px-4 hover:no-underline">Micronutrients</AccordionTrigger>
                <AccordionContent className="px-4 pt-2 relative">
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                        {[...Object.entries(food.micronutrientBreakdown || {})]
                            .filter(([, value]) => value && value > 0)
                            .map(([key, value]) => {
                                const nutrientKey = key as MicronutrientKey;
                                return(
                                    <div key={key} className="shrink-0 text-center p-2 border rounded-lg bg-muted/30 w-20">
                                        <p className="text-xs text-muted-foreground truncate">{NUTRIENT_LABELS[nutrientKey]}</p>
                                        <p className="text-sm font-bold mt-1">{(value / 100 * quantity).toFixed(1)}{NUTRIENT_UNITS[nutrientKey]}</p>
                                    </div>
                                )
                            })
                        }
                    </div>
                    <div className="absolute right-4 bottom-0 h-full w-8 bg-gradient-to-l from-card pointer-events-none" />
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Analysis */}
            <AccordionItem value="analysis" className="border rounded-lg bg-card">
                <AccordionTrigger className="text-base font-semibold px-4 hover:no-underline">AI Health Analysis</AccordionTrigger>
                <AccordionContent className="px-4 pt-2 text-sm text-muted-foreground leading-relaxed">
                   {food.healthAnalysis}
                </AccordionContent>
            </AccordionItem>

            {/* Recipe */}
            {food.detailedRecipe?.ingredients?.length > 0 && (
                <AccordionItem value="recipe" className="border rounded-lg bg-card">
                    <AccordionTrigger className="text-base font-semibold px-4 hover:no-underline">Recipe</AccordionTrigger>
                    <AccordionContent className="px-4 pt-2 space-y-4">
                        <div>
                            <h4 className="font-semibold mb-2">Ingredients</h4>
                            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                                {food.detailedRecipe.ingredients.map((ing, i) => <li key={i}>{ing}</li>)}
                            </ul>
                        </div>
                         <div>
                            <h4 className="font-semibold mb-2">Instructions</h4>
                            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground leading-relaxed">
                                {food.detailedRecipe.instructions.map((inst, i) => <li key={i}>{inst}</li>)}
                            </ol>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            )}

          </Accordion>
        </div>
      </div>
      
      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-background/80 backdrop-blur-sm border-t">
          <div className="max-w-md mx-auto p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <Button size="lg" className="w-full h-14 text-lg rounded-xl" onClick={handleAdd}>
                <PlusCircle className="mr-2 h-5 w-5" /> Add to Today's Log
            </Button>
          </div>
      </div>

      <FoodConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        foodItem={foodForModal}
      />
    </div>
  );
}

// Skeleton Loader
const FoodDetailsSkeleton = () => (
  <div className="max-w-md mx-auto space-y-4 animate-pulse">
    <div className="absolute -top-1 -left-2 z-10">
      <Skeleton className="h-10 w-10 rounded-full" />
    </div>
    <Skeleton className="h-64 sm:h-80 w-full" />
    <div className="p-4 space-y-6 -mt-16 relative z-10">
      <div className="text-center space-y-3">
        <Skeleton className="h-8 w-3/4 mx-auto" />
        <Skeleton className="h-6 w-28 mx-auto rounded-full" />
      </div>
      <Card className="border-2">
        <CardContent className="p-4 flex items-center gap-4">
          <Skeleton className="h-40 w-40 rounded-full" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-full rounded-full" />
            <Skeleton className="h-6 w-full rounded-full" />
            <Skeleton className="h-6 w-full rounded-full" />
          </div>
        </CardContent>
      </Card>
      <Skeleton className="h-32 w-full rounded-lg" />
      <Skeleton className="h-14 w-full rounded-lg" />
      <Skeleton className="h-14 w-full rounded-lg" />
    </div>
  </div>
);

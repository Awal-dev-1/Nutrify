
'use client';

import { useState, useMemo } from 'react';
import { TransitionLink } from '@/components/shared/transition-link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Heart,
  Minus,
  Plus,
  Flame,
  Beef,
  Wheat,
  Droplets,
  Zap,
  Leaf,
  AlertCircle,
  Stethoscope,
  BookOpen,
  CookingPot,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { EmptyState } from '@/components/shared/empty-state';
import { useToast } from '@/hooks/use-toast';
import { Breadcrumbs } from '@/components/shared/breadcrumbs';
import type { FoodItem } from '@/types/food';
import { Skeleton } from '@/components/ui/skeleton';
import { FoodConfirmationModal } from '@/components/recognize/food-confirmation-modal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { MICRONUTRIENT_KEYS, NUTRIENT_LABELS, NUTRIENT_UNITS } from '@/lib/nutrients';


export default function FoodDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const db = useFirestore();
  const { userProfile } = useUser();

  const [quantity, setQuantity] = useState(100);
  const [mealType, setMealType] = useState('Lunch');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const foodRef = useMemoFirebase(() => (db && id ? doc(db, 'foodItems', id) : null), [db, id]);
  const { data: food, isLoading, error } = useDoc<FoodItem>(foodRef);

  const calculatedNutrients = useMemo(() => {
    if (!food) return null;
    const ratio = quantity / 100;
    return {
      calories: (food.calories || 0) * ratio,
      protein: (food.macronutrientBreakdown.protein || 0) * ratio,
      carbs: (food.macronutrientBreakdown.carbohydrates || 0) * ratio,
      fat: (food.macronutrientBreakdown.fat || 0) * ratio,
    };
  }, [food, quantity]);

  const macroData = useMemo(() => {
    if (!calculatedNutrients) return [];
    return [
      { name: 'Protein', value: calculatedNutrients.protein, color: 'hsl(var(--chart-2))' },
      { name: 'Carbs', value: calculatedNutrients.carbs, color: 'hsl(var(--chart-3))' },
      { name: 'Fat', value: calculatedNutrients.fat, color: 'hsl(var(--chart-4))' },
    ];
  }, [calculatedNutrients]);


  const handleAdd = () => {
    if (food) {
      setIsModalOpen(true);
    }
  };
  
  if (isLoading) {
    return <FoodDetailsSkeleton />;
  }

  if (error) {
    return (
      <EmptyState
        title="Error Loading Food"
        description={error.message || "There was a problem fetching the food details."}
      >
        <Button asChild className="mt-4">
          <TransitionLink href="/dashboard/search">Back to AI Food Search</TransitionLink>
        </Button>
      </EmptyState>
    );
  }

  if (!food) {
    return (
      <EmptyState
        title="Food not found"
        description="The food item you are looking for does not exist in our database."
      >
        <Button asChild className="mt-4">
          <TransitionLink href="/dashboard/search">Back to AI Food Search</TransitionLink>
        </Button>
      </EmptyState>
    );
  }
  
  const breadcrumbItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "AI Food Search", href: "/dashboard/search" },
    { label: food.foodName },
  ];
  
  const foodForModal = {
    ...food,
    estimatedWeightGrams: quantity
  };
  
  const hasMicros = food.micronutrientBreakdown && Object.values(food.micronutrientBreakdown).some(v => v !== undefined && v !== null && v > 0);

  return (
    <div className="space-y-6">
      {/* 1. Top Navigation */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex justify-between items-center"
      >
        <Button variant="ghost" asChild>
          <TransitionLink href="/dashboard/search">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to AI Search
          </TransitionLink>
        </Button>
        <Breadcrumbs items={breadcrumbItems} className="hidden md:block" />
        <Button variant="ghost" size="icon">
          <Heart className="h-5 w-5" />
          <span className="sr-only">Favorite</span>
        </Button>
      </motion.div>

      {/* 2. Food Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.05 }}
      >
        <Card>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                {food.isGhanaianLocal && (
                  <Badge variant="secondary">
                    <Leaf className="mr-1.5 h-3.5 w-3.5 text-green-600" />
                    Ghanaian Local
                  </Badge>
                )}
                {food.tags && food.tags.length > 0 && <Badge variant="outline">{food.tags[0]}</Badge>}
              </div>
              <h1 className="text-h1 font-bold tracking-tight">{food.foodName}</h1>
              <div className="text-5xl font-extrabold text-primary">
                {calculatedNutrients?.calories.toFixed(0)}{' '}
                <span className="text-2xl font-medium text-muted-foreground">kcal</span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="flex flex-col items-center gap-1">
                      <Beef className="h-6 w-6 text-red-500" />
                      <span className="font-bold">{calculatedNutrients?.protein.toFixed(1)}g</span>
                      <span className="text-xs text-muted-foreground">Protein</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                      <Wheat className="h-6 w-6 text-yellow-600" />
                      <span className="font-bold">{calculatedNutrients?.carbs.toFixed(1)}g</span>
                      <span className="text-xs text-muted-foreground">Carbs</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                      <Droplets className="h-6 w-6 text-blue-500" />
                      <span className="font-bold">{calculatedNutrients?.fat.toFixed(1)}g</span>
                      <span className="text-xs text-muted-foreground">Fat</span>
                  </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        <motion.div
          className="lg:col-span-2 space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
        >
           {/* 4. & 5. Nutrition & Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Nutritional Information</CardTitle>
              <CardDescription>
                Based on a portion of {quantity}g.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-8">
               <Tabs defaultValue="macros">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="macros">Macros</TabsTrigger>
                    <TabsTrigger value="micros">Micros</TabsTrigger>
                  </TabsList>
                  <TabsContent value="macros" className="mt-4">
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={macroData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {macroData.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                          }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </TabsContent>
                   <TabsContent value="micros" className="mt-4">
                      <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2">
                          {hasMicros ? (
                            MICRONUTRIENT_KEYS.map((key) => {
                                const per100gValue = food.micronutrientBreakdown?.[key] || 0;
                                const currentPortionValue = (per100gValue / 100) * quantity;
                                if (currentPortionValue === 0) return null;

                                return(
                                    <div key={key} className="flex justify-between items-center text-sm p-2 rounded-md bg-muted/50">
                                        <span className="capitalize text-muted-foreground">{NUTRIENT_LABELS[key]}</span>
                                        <span className="font-medium">{currentPortionValue.toFixed(1)}{NUTRIENT_UNITS[key]}</span>
                                    </div>
                                )
                            })
                          ) : (
                            <p className="text-center text-sm text-muted-foreground py-10">No micronutrient data available.</p>
                          )}
                      </div>
                   </TabsContent>
               </Tabs>
               <div className='space-y-4'>
                 <h3 className="text-md font-medium text-center">AI Generated Details</h3>
                 <Tabs defaultValue='analysis' className='w-full'>
                    <TabsList className='grid w-full grid-cols-3'>
                      <TabsTrigger value="analysis"><Stethoscope className="h-4 w-4 mr-1"/>Analysis</TabsTrigger>
                      <TabsTrigger value="history"><BookOpen className="h-4 w-4 mr-1"/>History</TabsTrigger>
                      <TabsTrigger value="recipe"><CookingPot className="h-4 w-4 mr-1"/>Recipe</TabsTrigger>
                    </TabsList>
                    <TabsContent value="analysis" className='text-sm p-2 border rounded-md min-h-[150px] mt-2'>
                      {food.healthAnalysis}
                    </TabsContent>
                     <TabsContent value="history" className='text-sm p-2 border rounded-md min-h-[150px] mt-2'>
                      {food.foodHistory}
                    </TabsContent>
                     <TabsContent value="recipe" className='text-sm p-2 border rounded-md min-h-[150px] mt-2'>
                       <p className='font-semibold mb-1'>Ingredients:</p>
                       <p className='text-muted-foreground'>{food.detailedRecipe?.ingredients.join(', ')}</p>
                       <p className='font-semibold mt-2 mb-1'>Instructions:</p>
                       <p className='text-muted-foreground'>{food.detailedRecipe?.instructions.join(' ')}</p>
                    </TabsContent>
                 </Tabs>
               </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          className="lg:col-span-1 space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.15 }}
        >
          {/* 3. Portion Size Controller */}
          <Card>
            <CardHeader><CardTitle>Adjust Portion</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                    <Button size="icon" variant="outline" onClick={() => setQuantity(q => Math.max(10, q - 10))}><Minus /></Button>
                    <Input type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} className="text-center" />
                    <Button size="icon" variant="outline" onClick={() => setQuantity(q => q + 10)}><Plus /></Button>
                </div>
            </CardContent>
          </Card>

          {/* 7. Add to Tracker */}
          <Card>
            <CardHeader><CardTitle>Add to Meal</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                 <Select value={mealType} onValueChange={(v) => setMealType(v)}>
                    <SelectTrigger><SelectValue placeholder="Select a meal" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Breakfast">Breakfast</SelectItem>
                        <SelectItem value="Lunch">Lunch</SelectItem>
                        <SelectItem value="Dinner">Dinner</SelectItem>
                    </SelectContent>
                </Select>
                <Button onClick={handleAdd} className="w-full" size="lg">Add to Tracker</Button>
            </CardContent>
          </Card>
           {/* 6. Nutrient Tags */}
           {food.tags && food.tags.length > 0 && (
            <Card>
                <CardHeader><CardTitle>Tags</CardTitle></CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                {food.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                    {tag === 'Vegan' && <Leaf className="mr-1 h-3 w-3" />}
                    {tag.includes('Protein') && <Zap className="mr-1 h-3 w-3" />}
                    {tag}
                    </Badge>
                ))}
                </CardContent>
            </Card>
            )}
        </motion.div>
      </div>
      <FoodConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        foodItem={foodForModal}
      />
    </div>
  );
}

const FoodDetailsSkeleton = () => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <Skeleton className="h-9 w-36" />
      <Skeleton className="h-5 w-48" />
      <Skeleton className="h-9 w-9 rounded-full" />
    </div>
    <Skeleton className="h-48 w-full" />
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Skeleton className="h-96 w-full" />
      </div>
      <div className="lg:col-span-1 space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  </div>
);

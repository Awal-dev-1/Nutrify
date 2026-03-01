'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
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
  Info,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

import { mockFoods, type Food } from '@/lib/data';
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
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { FoodCard } from '@/components/food/food-card';
import { EmptyState } from '@/components/shared/empty-state';
import { useToast } from '@/hooks/use-toast';
import { Breadcrumbs } from '@/components/shared/breadcrumbs';

// Mock daily values
const DAILY_VALUES = {
  calories: 2200,
  protein: 120,
  carbs: 250,
  fat: 70,
  fiber: 30,
  sugar: 50,
  iron: 18,
  calcium: 1300,
  vitaminA: 900,
  vitaminC: 90,
  sodium: 2300,
};

export default function FoodDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const food = mockFoods.find((f) => f.id === id);

  const [quantity, setQuantity] = useState(100);
  const [unit, setUnit] = useState('grams');
  const [mealType, setMealType] = useState('lunch');

  const similarFoods = useMemo(() => {
    if (!food) return [];
    return mockFoods.filter(
      (f) => f.category === food.category && f.id !== food.id
    );
  }, [food]);

  if (!food) {
    return (
      <EmptyState
        title="Food not found"
        description="The food item you are looking for does not exist in our database."
      >
        <Button asChild className="mt-4">
          <Link href="/dashboard/search">Back to Search</Link>
        </Button>
      </EmptyState>
    );
  }

  const getNutrientValue = (nutrient: keyof Food | keyof Food['nutrients'], baseValue: number) => {
    // This is a simplified calculation. A real app would have more complex logic.
    return (baseValue / 100) * quantity;
  };
  
  const calculatedNutrients = {
    calories: getNutrientValue('calories', food.calories),
    protein: getNutrientValue('protein', food.protein),
    carbs: getNutrientValue('carbs', food.carbs),
    fat: getNutrientValue('fat', food.fat),
    fiber: getNutrientValue('fiber', food.nutrients.fiber),
    sugar: getNutrientValue('sugar', food.nutrients.sugar || 0), // Added sugar to data
    iron: getNutrientValue('iron', food.nutrients.iron),
    calcium: getNutrientValue('calcium', food.nutrients.calcium || 0), // Added calcium
    vitaminA: getNutrientValue('vitaminA', food.nutrients.vitaminA),
    vitaminC: getNutrientValue('vitaminC', food.nutrients.vitaminC || 0), // Added vit C
    sodium: getNutrientValue('sodium', food.nutrients.sodium),
  };

  const macroData = [
    { name: 'Protein', value: calculatedNutrients.protein, color: 'hsl(var(--chart-2))' },
    { name: 'Carbs', value: calculatedNutrients.carbs, color: 'hsl(var(--chart-3))' },
    { name: 'Fat', value: calculatedNutrients.fat, color: 'hsl(var(--chart-4))' },
  ];

  const handleAdd = () => {
    toast({
      title: 'Food Added!',
      description: `${quantity}g of ${food.name} has been added to your ${mealType}.`,
    });
  };

  const breadcrumbItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Food Search", href: "/dashboard/search" },
    { label: food.name },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Top Navigation */}
      <div className="flex justify-between items-center">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/search">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Search
          </Link>
        </Button>
        <Breadcrumbs items={breadcrumbItems} className="hidden md:block" />
        <Button variant="ghost" size="icon">
          <Heart className="h-5 w-5" />
          <span className="sr-only">Favorite</span>
        </Button>
      </div>

      {/* 2. Food Header */}
      <Card>
        <div className="grid md:grid-cols-3 gap-6 p-6">
          <div className="md:col-span-1">
            <div className="relative aspect-square rounded-lg overflow-hidden shadow-md">
              <Image
                src={food.image}
                alt={food.name}
                fill
                className="object-cover"
                data-ai-hint={food.imageHint}
              />
            </div>
          </div>
          <div className="md:col-span-2 space-y-4">
            <Badge variant="outline">{food.category}</Badge>
            <h1 className="text-4xl font-bold">{food.name}</h1>
            <p className="text-muted-foreground">{food.description}</p>
            <div className="text-5xl font-extrabold text-primary">
              {calculatedNutrients.calories.toFixed(0)}{' '}
              <span className="text-2xl font-medium text-muted-foreground">kcal</span>
            </div>
             <div className="grid grid-cols-3 gap-4 text-center">
                <div className="flex flex-col items-center gap-1">
                    <Beef className="h-6 w-6 text-red-500" />
                    <span className="font-bold">{calculatedNutrients.protein.toFixed(1)}g</span>
                    <span className="text-xs text-muted-foreground">Protein</span>
                </div>
                 <div className="flex flex-col items-center gap-1">
                    <Wheat className="h-6 w-6 text-yellow-600" />
                    <span className="font-bold">{calculatedNutrients.carbs.toFixed(1)}g</span>
                    <span className="text-xs text-muted-foreground">Carbs</span>
                </div>
                 <div className="flex flex-col items-center gap-1">
                    <Droplets className="h-6 w-6 text-blue-500" />
                    <span className="font-bold">{calculatedNutrients.fat.toFixed(1)}g</span>
                    <span className="text-xs text-muted-foreground">Fat</span>
                </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
           {/* 4. & 5. Nutrition & Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Nutritional Information</CardTitle>
              <CardDescription>
                Based on a portion of {quantity}{unit}.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                {(Object.keys(calculatedNutrients) as (keyof typeof calculatedNutrients)[]).map((key) => {
                    const value = calculatedNutrients[key];
                    const dailyValue = DAILY_VALUES[key as keyof typeof DAILY_VALUES] || 1;
                    const percentage = (value / dailyValue) * 100;

                    if (key === 'calories') return null;

                    return (
                        <div key={key}>
                        <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                            <span className="text-sm text-muted-foreground">
                            {value.toFixed(1)}g / {percentage.toFixed(0)}% DV
                            </span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                        </div>
                    );
                })}
              </div>
               <div>
                <h3 className="text-md font-medium mb-2 text-center">
                  Macronutrient Distribution
                </h3>
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
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          {/* 3. Portion Size Controller */}
          <Card>
            <CardHeader><CardTitle>Adjust Portion</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                    <Button size="icon" variant="outline" onClick={() => setQuantity(q => Math.max(10, q - 10))}><Minus /></Button>
                    <Input type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} className="text-center" />
                    <Button size="icon" variant="outline" onClick={() => setQuantity(q => q + 10)}><Plus /></Button>
                </div>
                <Select value={unit} onValueChange={setUnit}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="grams">grams</SelectItem>
                        <SelectItem value="serving">serving (100g)</SelectItem>
                        <SelectItem value="piece">piece</SelectItem>
                    </SelectContent>
                </Select>
            </CardContent>
          </Card>

          {/* 7. Add to Tracker */}
          <Card>
            <CardHeader><CardTitle>Add to Meal</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                 <Select value={mealType} onValueChange={setMealType}>
                    <SelectTrigger><SelectValue placeholder="Select a meal" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="breakfast">Breakfast</SelectItem>
                        <SelectItem value="lunch">Lunch</SelectItem>
                        <SelectItem value="dinner">Dinner</SelectItem>
                        <SelectItem value="snacks">Snacks</SelectItem>
                    </SelectContent>
                </Select>
                <Button onClick={handleAdd} className="w-full" size="lg">Add to Tracker</Button>
            </CardContent>
          </Card>
           {/* 6. Nutrient Tags */}
           {food.tags.length > 0 && (
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
        </div>
      </div>

      {/* 8. Similar Foods */}
      {similarFoods.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Similar Foods</h2>
          <Carousel opts={{ align: 'start', loop: false }}>
            <CarouselContent>
              {similarFoods.map((similarFood) => (
                <CarouselItem key={similarFood.id} className="md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                  <FoodCard food={similarFood} viewMode="grid" />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      )}
    </div>
  );
}

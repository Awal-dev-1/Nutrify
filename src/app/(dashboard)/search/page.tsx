
'use client';

import { useState, type FC } from 'react';
import {
  Search as SearchIcon,
  X,
  Sparkles,
  Bot,
  Loader2,
  AlertCircle,
  Stethoscope,
  BookOpen,
  CookingPot,
  Salad,
  Beef,
  Wheat,
  Droplets,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { searchFoods, type SearchFoodsOutput, type FoodItem } from '@/ai/flows/search-foods-flow';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { mockUser } from '@/lib/data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AiFoodResultCard: FC<{ item: FoodItem }> = ({ item }) => {
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
                <TabsTrigger value="recipes"><CookingPot className="h-4 w-4 mr-1" />Recipes</TabsTrigger>
            </TabsList>
            
            <TabsContent value="analysis">
                <Card>
                    <CardHeader>
                        <CardTitle>Health Analysis</CardTitle>
                        <CardDescription>For your goal: <span className="capitalize font-medium text-primary">{mockUser.goal.replace('-', ' ')}</span></CardDescription>
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
                        <ul className="space-y-1">
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
            
            <TabsContent value="recipes">
                <Card>
                    <CardHeader>
                        <CardTitle>Recipe Ideas</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-3">
                        <ul className="list-disc list-outside pl-5 space-y-2">
                            {item.possibleRecipes.map((recipe, i) => <li key={i}>{recipe}</li>)}
                        </ul>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};


export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchFoodsOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const { toast } = useToast();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setHasSearched(true);

    try {
      const response = await searchFoods({
        query: searchQuery,
        userGoal: mockUser.goal,
      });

      if (!response.isFoodQuery) {
        throw new Error("I can only provide information about food. Please try a different search.");
      }
      
      if(response.foodItems.length === 0){
        throw new Error("I couldn't find any information for that food. Please try rephrasing your search.");
      }

      setResult(response);
    } catch (err: any) {
      console.error('AI search failed:', err);
      const errorMessage = err.message || 'Could not fetch AI-powered results. Please try again.';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'AI Search Failed',
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 space-y-4 sm:space-y-6 md:space-y-8">
      {/* Header */}
      <div className="space-y-1 sm:space-y-2 max-w-7xl mx-auto">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
          AI Nutrition Search
        </h1>
        <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
          Ask the AI anything about food nutrition. Try "Kenkey with grilled tilapia" or "A regular sized apple".
        </p>
      </div>

      {/* Search Section */}
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSearch} className="relative group w-full flex gap-2">
          <div className="relative flex-1">
            <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary group-focus-within:text-primary transition-colors" />
            </div>
            <Input
              placeholder="AI Search..."
              className="w-full h-12 md:h-14 rounded-full border-2 bg-background pl-10 sm:pl-12 text-sm md:text-base transition-all focus-visible:ring-primary/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full hover:bg-muted"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Button
            type="submit"
            size="lg"
            className="h-12 md:h-14 rounded-full"
            disabled={loading || !searchQuery.trim()}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <SearchIcon className="h-5 w-5" />
            )}
            <span className="sr-only">Search</span>
          </Button>
        </form>
      </div>

      {/* Results Section */}
      <div className="max-w-4xl mx-auto pt-8">
        {!hasSearched && (
           <EmptyState
            icon={<Bot className="h-16 w-16 text-muted-foreground" />}
            title="Ready to assist"
            description="Your AI nutrition assistant is waiting for your query."
            className="border-2 border-dashed"
          />
        )}
        
        {loading && (
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/5" />
            <Skeleton className="h-64 w-full" />
          </div>
        )}

        {error && !loading && (
          <Alert variant="destructive" className="border-destructive/50">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>AI Search Error</AlertTitle>
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
        )}

        {result && result.isFoodQuery && result.foodItems.length > 0 && !loading && !error && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">
                Found {result.foodItems.length} result{result.foodItems.length > 1 ? 's' : ''} for "{searchQuery}"
            </h2>
            {result.foodItems.map(item => (
                <AiFoodResultCard key={item.foodName} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

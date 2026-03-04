'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  X,
  Sparkles,
  Loader2,
  AlertCircle,
  Mic,
  Plus,
  Clock,
  History,
  Coffee,
  Sun,
  Moon,
  Cookie,
  ChevronRight,
  Scale,
  Flame,
  Droplets,
  Beef,
  Leaf,
  Trophy,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { searchFoods, type FoodItem } from '@/ai/flows/search-foods-flow';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  useUser,
  useFirestore,
  useCollection,
  useMemoFirebase,
} from '@/firebase';
import { addFoodToLog } from '@/services/trackerService';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { addRecentSearch } from '@/services/searchService';
import type { RecentSearch } from '@/types/search';
import { RecentSearches } from '@/components/search/recent-searches';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

// Meal type configuration with icons and colors
const MEAL_TYPES = [
  { value: 'Breakfast', label: 'Breakfast', icon: Coffee, color: 'text-amber-500' },
  { value: 'Lunch', label: 'Lunch', icon: Sun, color: 'text-orange-500' },
  { value: 'Dinner', label: 'Dinner', icon: Moon, color: 'text-indigo-500' },
  { value: 'Snacks', label: 'Snacks', icon: Cookie, color: 'text-pink-500' },
] as const;

// Quick portion suggestions with labels
const QUICK_PORTIONS = [
  { grams: 50, label: 'Small' },
  { grams: 100, label: 'Regular' },
  { grams: 200, label: 'Large' },
  { grams: 300, label: 'Extra' },
];

export default function SearchPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams?.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FoodItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(!!initialQuery);

  // Portion control state
  const [portionGrams, setPortionGrams] = useState(100);
  const [mealType, setMealType] = useState<(typeof MEAL_TYPES)[number]['value']>('Lunch');
  const [isAdding, setIsAdding] = useState(false);

  // Voice search state
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const { toast } = useToast();
  const { user, userProfile, isProfileLoading } = useUser();
  const db = useFirestore();

  const recentsQuery = useMemoFirebase(
    () =>
      user
        ? query(
            collection(db, 'users', user.uid, 'recentSearches'),
            orderBy('searchedAt', 'desc'),
            limit(5)
          )
        : null,
    [user, db]
  );
  const { data: recentSearches, isLoading: areRecentsLoading } =
    useCollection<RecentSearch>(recentsQuery);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    
    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      toast({
        variant: 'destructive',
        title: 'Voice recognition failed',
        description: 'Please try again or type your search manually.',
      });
      setIsRecording(false);
    };
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
      // Auto-search after voice input
      handleSearch(transcript);
    };
    
    recognitionRef.current = recognition;
    
    return () => {
      recognition.stop();
    };
  }, [toast]);

  // Run search on initial query
  useEffect(() => {
    if (initialQuery && userProfile) {
      handleSearch(initialQuery);
    }
  }, [initialQuery, userProfile]);

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setResult(null);
      setError(null);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setHasSearched(true);
    setPortionGrams(100);

    try {
      const userGoal = userProfile?.health?.primaryGoal;
      const response = await searchFoods({ query, userGoal });

      if (!response.isFoodQuery) {
        toast({
          variant: 'destructive',
          title: 'Not a food item',
          description: 'Please search for a specific food item.',
        });
        setHasSearched(false);
        return;
      }

      if (response.foodItems.length === 0) {
        throw new Error('No nutritional information found. Try a different search.');
      }

      const foundFood = response.foodItems[0];
      setResult(foundFood);

      if (user && db) {
        await addRecentSearch(db, user.uid, foundFood);
      }
    } catch (err: any) {
      console.error('Search failed:', err);
      setError(err.message || 'Failed to get results. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMicClick = () => {
    if (!recognitionRef.current) {
      toast({
        variant: 'destructive',
        title: 'Not supported',
        description: 'Your browser does not support voice recognition.',
      });
      return;
    }
    
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const handleRecentClick = (recent: RecentSearch) => {
    try {
      const foodItem: FoodItem = JSON.parse(recent.foodData);
      setSearchQuery(recent.foodName);
      setResult(foodItem);
      setHasSearched(true);
      setError(null);
    } catch (e) {
      console.error('Failed to parse recent search', e);
      setError('Could not load this search. Please try searching again.');
    }
  };

  const handleAddToTracker = async () => {
    if (!result || !user || !db || !mealType) return;

    setIsAdding(true);
    try {
      await addFoodToLog(db, user.uid, mealType, result, portionGrams);
      
      toast({
        title: '✨ Food logged successfully!',
        description: (
          <div className="flex flex-col gap-1">
            <span className="font-medium">{result.foodName}</span>
            <span className="text-sm text-muted-foreground">
              {portionGrams}g • {mealType}
            </span>
          </div>
        ),
      });

      // Reset UI
      setResult(null);
      setSearchQuery('');
      setHasSearched(false);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Failed to add food',
        description: 'Please try again.',
      });
      console.error(err);
    } finally {
      setIsAdding(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setResult(null);
    setHasSearched(false);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/5">
      <div className="container max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="space-y-2 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            AI Food Search
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto md:mx-0">
            Search any food and get instant nutritional insights
          </p>
        </div>

        {/* Search Section */}
        <div className="max-w-3xl mx-auto md:mx-0">
          <form onSubmit={(e) => { e.preventDefault(); handleSearch(searchQuery); }}>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                <Sparkles className="h-5 w-5 text-primary group-focus-within:text-primary/80 transition-colors" />
              </div>
              
              <Input
                placeholder="e.g., Grilled salmon with quinoa..."
                className="w-full h-16 pl-12 pr-32 text-lg bg-background/80 backdrop-blur-sm border-2 border-muted focus:border-primary rounded-2xl shadow-lg transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {searchQuery && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full hover:bg-muted"
                    onClick={clearSearch}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-10 w-10 rounded-full transition-all",
                    isRecording && "bg-red-100 text-red-600 animate-pulse dark:bg-red-950"
                  )}
                  onClick={handleMicClick}
                >
                  <Mic className="h-4 w-4" />
                </Button>
                
                <Button
                  type="submit"
                  size="lg"
                  className="h-12 px-6 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                  disabled={loading || !searchQuery.trim()}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Search
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>

        {/* Content Section */}
        <AnimatePresence mode="wait">
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <Skeleton className="h-12 w-64" />
              <div className="grid gap-4 md:grid-cols-2">
                <Skeleton className="h-64 rounded-2xl" />
                <Skeleton className="h-64 rounded-2xl" />
              </div>
            </motion.div>
          )}

          {error && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Alert variant="destructive" className="max-w-3xl">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Search Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}

          {!hasSearched && !loading && !error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <RecentSearches
                recents={recentSearches}
                isLoading={areRecentsLoading}
                onRecentClick={handleRecentClick}
              />
              
              <div className="text-center text-muted-foreground">
                <p className="text-sm">Try searching for "Grilled chicken breast" or "Avocado toast"</p>
              </div>
            </motion.div>
          )}

          {result && !loading && !error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <FoodDetailsCard
                foodItem={result}
                portionGrams={portionGrams}
                setPortionGrams={setPortionGrams}
                mealType={mealType}
                setMealType={setMealType}
                onAddToTracker={handleAddToTracker}
                isAdding={isAdding}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

interface FoodDetailsCardProps {
  foodItem: FoodItem;
  portionGrams: number;
  setPortionGrams: (grams: number) => void;
  mealType: typeof MEAL_TYPES[number]['value'];
  setMealType: (type: typeof MEAL_TYPES[number]['value']) => void;
  onAddToTracker: () => void;
  isAdding: boolean;
}

function FoodDetailsCard({
  foodItem,
  portionGrams,
  setPortionGrams,
  mealType,
  setMealType,
  onAddToTracker,
  isAdding,
}: FoodDetailsCardProps) {
  const [activeTab, setActiveTab] = useState('nutrition');

  const calculatedNutrients = useMemo(() => {
    const ratio = portionGrams / 100;
    return {
      calories: Math.round((foodItem.calories || 0) * ratio),
      protein: Number(((foodItem.macronutrientBreakdown.protein || 0) * ratio).toFixed(1)),
      carbs: Number(((foodItem.macronutrientBreakdown.carbohydrates || 0) * ratio).toFixed(1)),
      fat: Number(((foodItem.macronutrientBreakdown.fat || 0) * ratio).toFixed(1)),
    };
  }, [foodItem, portionGrams]);

  // Calculate percentages for macro visualization
  const totalMacros = calculatedNutrients.protein + calculatedNutrients.carbs + calculatedNutrients.fat;
  const macroPercentages = {
    protein: totalMacros > 0 ? (calculatedNutrients.protein / totalMacros) * 100 : 0,
    carbs: totalMacros > 0 ? (calculatedNutrients.carbs / totalMacros) * 100 : 0,
    fat: totalMacros > 0 ? (calculatedNutrients.fat / totalMacros) * 100 : 0,
  };

  const CurrentMealIcon = MEAL_TYPES.find(m => m.value === mealType)?.icon;

  return (
    <Card className="border-2 shadow-xl overflow-hidden">
      {/* Header with gradient background */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 border-b">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">{foodItem.foodName}</h2>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Scale className="h-4 w-4" />
                {portionGrams}g serving
              </span>
              <span className="flex items-center gap-1">
                <Flame className="h-4 w-4 text-orange-500" />
                {calculatedNutrients.calories} kcal
              </span>
            </div>
          </div>
          
          <Badge variant="secondary" className="text-sm px-3 py-1">
            <Sparkles className="h-3 w-3 mr-1" />
            AI Analyzed
          </Badge>
        </div>
      </div>

      <CardContent className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
            <TabsTrigger value="analyze">Analysis</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="nutrition" className="space-y-6">
            {/* Portion Control */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Adjust portion size
                </label>
                <Slider
                  value={[portionGrams]}
                  onValueChange={([value]) => setPortionGrams(value)}
                  min={25}
                  max={500}
                  step={25}
                  className="mb-4"
                />
                
                <div className="flex items-center gap-2 justify-between">
                  {QUICK_PORTIONS.map(({ grams, label }) => (
                    <Button
                      key={grams}
                      variant={portionGrams === grams ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPortionGrams(grams)}
                      className="flex-1"
                    >
                      {label}
                      <span className="ml-1 text-xs opacity-70">({grams}g)</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Macro Visualization */}
              <div className="bg-muted/30 p-4 rounded-xl space-y-3">
                <h4 className="font-medium text-sm">Macro Balance</h4>
                <div className="flex h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-blue-500 transition-all"
                    style={{ width: `${macroPercentages.protein}%` }}
                  />
                  <div 
                    className="bg-green-500 transition-all"
                    style={{ width: `${macroPercentages.carbs}%` }}
                  />
                  <div 
                    className="bg-yellow-500 transition-all"
                    style={{ width: `${macroPercentages.fat}%` }}
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center">
                    <div className="font-medium text-blue-600 dark:text-blue-400">Protein</div>
                    <div>{calculatedNutrients.protein}g</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-green-600 dark:text-green-400">Carbs</div>
                    <div>{calculatedNutrients.carbs}g</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-yellow-600 dark:text-yellow-400">Fat</div>
                    <div>{calculatedNutrients.fat}g</div>
                  </div>
                </div>
              </div>
              
              {/* Micronutrients */}
              <div className="bg-muted/30 p-4 rounded-xl space-y-3">
                <h4 className="font-medium text-sm">Micronutrients</h4>
                <ul className="space-y-1 max-h-[100px] overflow-y-auto text-xs pr-2">
                  {foodItem.micronutrientBreakdown && Object.entries(foodItem.micronutrientBreakdown).length > 0 && Object.values(foodItem.micronutrientBreakdown).some(v => v !== undefined && v !== null && v > 0) ? (
                      Object.entries(foodItem.micronutrientBreakdown).map(([key, value]) => {
                          if (value === undefined || value === null || value === 0) {
                              return null;
                          }
                          const per100gValue = value || 0;
                          const currentPortionValue = (per100gValue / 100) * portionGrams;

                          const keyToLabel: Record<string, string> = {
                              fiber: "Fiber", sugar: "Sugar", iron: "Iron", calcium: "Calcium",
                              vitaminA: "Vit. A", vitaminC: "Vit. C", sodium: "Sodium",
                          };
                          const keyToUnit: Record<string, string> = {
                              fiber: "g", sugar: "g", iron: "mg", calcium: "mg",
                              vitaminA: "µg", vitaminC: "mg", sodium: "mg",
                          };
                          return (
                          <li key={key} className="flex justify-between p-1.5 rounded-md bg-background/50">
                              <span>{keyToLabel[key] || key}</span>
                              <span className="font-medium">{currentPortionValue.toFixed(1)}{keyToUnit[key] || ''}</span>
                          </li>
                          );
                      })
                  ) : (
                      <p className="text-xs text-muted-foreground text-center py-4">No significant micronutrient data available.</p>
                  )}
                </ul>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analyze" className="space-y-4">
            <div className="bg-primary/5 p-4 rounded-xl">
              <h4 className="font-medium flex items-center gap-2 mb-2">
                <Trophy className="h-4 w-4 text-primary" />
                Health Analysis
              </h4>
              <p className="text-sm text-muted-foreground">
                {foodItem.healthAnalysis}
              </p>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <div className="bg-secondary/20 p-4 rounded-xl">
              <h4 className="font-medium flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4" />
                Food History
              </h4>
              <p className="text-sm text-muted-foreground">
                {foodItem.foodHistory}
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Add to Tracker Section */}
        <div className="mt-6 pt-6 border-t space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Select value={mealType} onValueChange={(v: any) => setMealType(v)}>
                <SelectTrigger className="h-12">
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      {CurrentMealIcon && (
                        <CurrentMealIcon className={cn("h-4 w-4", MEAL_TYPES.find(m => m.value === mealType)?.color)} />
                      )}
                      <span>{mealType}</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {MEAL_TYPES.map(({ value, label, icon: Icon, color }) => (
                    <SelectItem key={value} value={value}>
                      <div className="flex items-center gap-2">
                        <Icon className={cn("h-4 w-4", color)} />
                        {label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button
              size="lg"
              className="h-12 px-8 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600"
              onClick={onAddToTracker}
              disabled={isAdding}
            >
              {isAdding ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Add to Log
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            This will add {calculatedNutrients.calories} kcal to your daily tracker
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

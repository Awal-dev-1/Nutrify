'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Search as SearchIcon,
  X,
  Sparkles,
  Bot,
  Loader2,
  AlertCircle,
  Mic,
  Flame,
  Beef,
  Wheat,
  Droplets,
  PlusCircle,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { searchFoods, type FoodItem } from '@/ai/flows/search-foods-flow';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useUser, useFirestore } from '@/firebase';
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

// The main search page component
export default function SearchPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams?.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FoodItem | null>(null); // Store a single FoodItem
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(!!initialQuery);

  // State for the new portion control feature
  const [portionGrams, setPortionGrams] = useState(100);
  const [mealType, setMealType] = useState<
    'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks'
  >('Lunch');
  const [isAdding, setIsAdding] = useState(false);

  // Voice search state
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const { toast } = useToast();
  const { user, userProfile, isProfileLoading } = useUser();
  const db = useFirestore();

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
        title: 'Voice Error',
        description: `Could not recognize speech: ${event.error}`,
      });
      setIsRecording(false);
    };
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
    };
    recognitionRef.current = recognition;
    return () => {
      recognition.stop();
    };
  }, [toast]);

  // Effect to run search on initial query
  useEffect(() => {
    if (initialQuery && userProfile) {
      handleSearch(initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery, userProfile]);

  // Main search handler function
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
    setPortionGrams(100); // Reset portion on new search

    try {
      const userGoal = userProfile?.health?.primaryGoal;
      const response = await searchFoods({ query, userGoal });

      if (!response.isFoodQuery) {
        toast({
          variant: 'destructive',
          title: 'Not a food item',
          description:
            'The AI can only provide nutritional analysis for food items.',
        });
        setHasSearched(false); // Reset to show the empty state
        return;
      }

      if (response.foodItems.length === 0) {
        throw new Error(
          "The AI couldn't find any nutritional information for that. Please try rephrasing your search."
        );
      }

      setResult(response.foodItems[0]); // Take the first result
    } catch (err: any) {
      console.error('AI search failed:', err);
      const errorMessage =
        err.message || 'Could not fetch AI-powered results. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };


  // Form submission handler
  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchQuery);
  };

  // Voice search click handler
  const handleMicClick = () => {
    if (!recognitionRef.current) {
      toast({
        variant: 'destructive',
        title: 'Unsupported Feature',
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

  // Function to add food to tracker
  const handleAddToTracker = async () => {
    if (!result || !user || !db || !mealType) return;

    setIsAdding(true);
    try {
      await addFoodToLog(db, user.uid, mealType, result, portionGrams);
      toast({
        title: 'Food Added!',
        description: `${result.foodName} (${portionGrams}g) was added to ${mealType}.`,
      });
      // Reset UI after adding
      setResult(null);
      setSearchQuery('');
      setHasSearched(false);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add food to tracker.',
      });
      console.error(err);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">AI Food Search</h1>
        <p className="text-muted-foreground">
          Ask the AI anything about food nutrition. Try "Kenkey with grilled
          tilapia".
        </p>
      </div>

      {/* Search Section */}
      <div className="max-w-4xl">
        <form
          onSubmit={onFormSubmit}
          className="relative group w-full flex gap-2"
        >
          <div className="relative flex-1">
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              <Sparkles className="h-5 w-5 text-primary group-focus-within:text-primary transition-colors" />
            </div>
            <Input
              placeholder="Ask AI or click the mic to speak..."
              className="w-full h-14 rounded-full border-2 bg-background pl-12 pr-24 text-base transition-all focus-visible:ring-primary/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  className="h-8 w-8 rounded-full hover:bg-muted"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                type="button"
                onClick={handleMicClick}
                className={cn(
                  'h-8 w-8 rounded-full hover:bg-muted',
                  isRecording &&
                    'bg-destructive/20 text-destructive hover:bg-destructive/30'
                )}
              >
                <Mic
                  className={cn('h-4 w-4', isRecording && 'animate-pulse')}
                />
              </Button>
            </div>
          </div>
          <Button
            type="submit"
            size="lg"
            className="h-14 rounded-full px-6"
            disabled={loading || !searchQuery.trim() || isProfileLoading}
          >
            {loading || isProfileLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <SearchIcon className="mr-2 h-4 w-4" />
            )}
            <span>Search</span>
          </Button>
        </form>
      </div>

      {/* Results Section */}
      <div className="max-w-4xl pt-8">
        {!hasSearched && !loading && (
          <EmptyState
            icon={<Bot className="h-16 w-16 text-muted-foreground" />}
            title="Ready to assist"
            description="Your AI nutrition assistant is waiting for your query."
            className="border-2 border-dashed"
          />
        )}

        {(loading || isProfileLoading) && (
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/5" />
            <Skeleton className="h-96 w-full" />
          </div>
        )}

        {error && !loading && (
          <Alert variant="destructive" className="border-destructive/50">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>AI Search Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && !loading && !error && (
          <PortionControlCard
            foodItem={result}
            portion={portionGrams}
            setPortion={setPortionGrams}
            mealType={mealType}
            setMealType={setMealType}
            onAddToTracker={handleAddToTracker}
            isAdding={isAdding}
          />
        )}
      </div>
    </div>
  );
}

// New component for the portion control UI
interface PortionControlCardProps {
  foodItem: FoodItem;
  portion: number;
  setPortion: (portion: number) => void;
  mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks';
  setMealType: (
    mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks'
  ) => void;
  onAddToTracker: () => void;
  isAdding: boolean;
}

function PortionControlCard({
  foodItem,
  portion,
  setPortion,
  mealType,
  setMealType,
  onAddToTracker,
  isAdding,
}: PortionControlCardProps) {
  // Calculate nutrients for the current portion
  const calculatedNutrients = useMemo(() => {
    if (!foodItem) return null;
    const ratio = portion / 100;
    return {
      calories: (foodItem.calories || 0) * ratio,
      protein: (foodItem.macronutrientBreakdown.protein || 0) * ratio,
      carbs: (foodItem.macronutrientBreakdown.carbohydrates || 0) * ratio,
      fat: (foodItem.macronutrientBreakdown.fat || 0) * ratio,
      micros: Object.fromEntries(
        Object.entries(foodItem.micronutrientBreakdown || {}).map(([key, value]) => [key, (value || 0) * ratio])
      ),
    };
  }, [foodItem, portion]);

  const quickPortions = [50, 100, 150, 200, 300];

  return (
    <Card className="animate-in fade-in-50">
      <CardHeader>
        <CardTitle>{foodItem.foodName}</CardTitle>
        <CardDescription>
          Adjust the portion size in grams to see the calculated nutritional values for your meal.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-6">
        {/* Left side: Calculated Nutrition & Details */}
        <div className="space-y-6">
          {calculatedNutrients && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg border-2 border-primary/20 bg-primary/5">
                <h4 className="font-semibold text-sm text-primary">
                  Nutrition for {portion}g
                </h4>
                <div className="flex items-baseline gap-2">
                  <p className="font-bold text-3xl text-foreground">
                    {calculatedNutrients.calories.toFixed(0)}
                  </p>
                  <p className="text-lg text-muted-foreground">kcal</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="p-4">
                    <CardTitle className="text-base">Macronutrients</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 grid grid-cols-3 gap-1 text-center">
                    <div className="space-y-1">
                      <Beef className="mx-auto h-4 w-4 text-red-500" />
                      <p className="font-bold text-base">
                        {calculatedNutrients.protein.toFixed(1)}g
                      </p>
                      <p className="text-xs text-muted-foreground">Protein</p>
                    </div>
                    <div className="space-y-1">
                      <Wheat className="mx-auto h-4 w-4 text-yellow-600" />
                      <p className="font-bold text-base">
                        {calculatedNutrients.carbs.toFixed(1)}g
                      </p>
                      <p className="text-xs text-muted-foreground">Carbs</p>
                    </div>
                    <div className="space-y-1">
                      <Droplets className="mx-auto h-4 w-4 text-blue-500" />
                      <p className="font-bold text-base">
                        {calculatedNutrients.fat.toFixed(1)}g
                      </p>
                      <p className="text-xs text-muted-foreground">Fat</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="p-4">
                    <CardTitle className="text-base">Micronutrients</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <ul className="text-sm space-y-1">
                      {Object.entries(calculatedNutrients.micros)
                        .filter(([, value]) => value && (value as number) > 0)
                        .map(([key, value]) => {
                          const keyToLabel: Record<string, string> = {
                            fiber: 'Fiber',
                            sugar: 'Sugar',
                            iron: 'Iron',
                            calcium: 'Calcium',
                            vitaminA: 'Vit. A',
                            vitaminC: 'Vit. C',
                            sodium: 'Sodium',
                          };
                          const keyToUnit: Record<string, string> = {
                            fiber: 'g',
                            sugar: 'g',
                            iron: 'mg',
                            calcium: 'mg',
                            vitaminA: 'µg',
                            vitaminC: 'mg',
                            sodium: 'mg',
                          };
                          if (!keyToLabel[key]) return null;
                          return (
                            <li key={key} className="flex justify-between text-xs">
                              <span className="capitalize text-muted-foreground">{keyToLabel[key]}</span>
                              <span className="font-medium">{(value as number).toFixed(1)}{keyToUnit[key]}</span>
                            </li>
                          );
                      })}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
           {/* AI Details */}
          <Card>
              <CardHeader className="p-4">
                  <CardTitle className="text-base">AI Generated Details</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 text-sm space-y-2">
                   <p><strong>Health Analysis:</strong> {foodItem.healthAnalysis}</p>
                   <p><strong>Food History:</strong> {foodItem.foodHistory}</p>
              </CardContent>
          </Card>
        </div>
        {/* Right side: Portion Controls */}
        <div className="space-y-4">
          <div>
            <label htmlFor="portion" className="text-sm font-medium">
              How much did you eat? (in grams)
            </label>
            <Input
              id="portion"
              type="number"
              value={portion}
              onChange={(e) =>
                setPortion(
                  Math.max(1, Math.min(2000, Number(e.target.value) || 0))
                )
              }
              className="mt-1"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {quickPortions.map((p) => (
              <Button
                key={p}
                variant="outline"
                size="sm"
                onClick={() => setPortion(p)}
              >
                {p}g
              </Button>
            ))}
          </div>
          <div>
            <label htmlFor="mealType" className="text-sm font-medium">
              Add to Meal
            </label>
            <Select value={mealType} onValueChange={(v) => setMealType(v as any)}>
              <SelectTrigger id="mealType" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Breakfast">Breakfast</SelectItem>
                <SelectItem value="Lunch">Lunch</SelectItem>
                <SelectItem value="Dinner">Dinner</SelectItem>
                <SelectItem value="Snacks">Snacks</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            size="lg"
            className="w-full"
            onClick={onAddToTracker}
            disabled={isAdding || portion <= 0}
          >
            {isAdding ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <PlusCircle className="mr-2 h-4 w-4" />
            )}
            Add to Daily Tracker
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

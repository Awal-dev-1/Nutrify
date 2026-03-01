
'use client';

import { useState } from 'react';
import {
  Search as SearchIcon,
  X,
  Sparkles,
  Bot,
  Flame,
  Beef,
  Wheat,
  Droplets,
  Heart,
  Scale,
  Brain,
  Leaf,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { searchFoods, type AiFoodData } from '@/ai/flows/search-foods-flow';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { mockUser } from '@/lib/data'; // To get the user's goal

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiFoodData | null>(null);
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
        userGoal: mockUser.goal, // Pass user goal for context
      });

      if ('error' in response) {
        throw new Error(response.error);
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
          <Card className="overflow-hidden">
            <CardHeader>
              <Skeleton className="h-8 w-3/5" />
              <Skeleton className="h-5 w-4/5" />
            </CardHeader>
            <CardContent className="space-y-6">
              <Skeleton className="h-20 w-full" />
              <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
              </div>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        )}

        {error && !loading && (
          <Alert variant="destructive" className="border-destructive/50">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>AI Error: Food Not Recognized</AlertTitle>
              <AlertDescription>
                {error}. Please try rephrasing your search or checking for typos.
              </AlertDescription>
            </Alert>
        )}

        {result && !loading && !error && (
          <Card className="overflow-hidden border-2 border-primary/10 shadow-lg animate-in fade-in-50 duration-500">
            <CardHeader className="bg-primary/5">
              <CardTitle className="text-2xl font-bold flex items-center gap-3">
                <Leaf className="text-primary" />
                {result.name}
              </CardTitle>
              <CardDescription>{result.description}</CardDescription>
            </CardHeader>
            <CardContent className="p-6 grid md:grid-cols-2 gap-8">
              {/* Left Column: Core Stats */}
              <div className="space-y-6">
                {/* Serving & Calories */}
                <div className="flex justify-around text-center">
                    <div>
                        <p className="text-sm text-muted-foreground">Serving Size</p>
                        <p className="text-2xl font-bold">{result.servingSize}</p>
                    </div>
                    <Separator orientation="vertical" className="h-16" />
                    <div>
                        <p className="text-sm text-muted-foreground">Calories</p>
                        <p className="text-2xl font-bold text-primary">{result.calories} kcal</p>
                    </div>
                </div>

                <Separator />

                {/* Macros */}
                <div>
                  <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                    <Scale className="h-4 w-4 text-muted-foreground" />
                    Macronutrients
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 text-center">
                          <p className="text-sm text-muted-foreground">Protein</p>
                          <p className="text-lg font-bold">{result.macros.protein}g</p>
                      </div>
                       <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 text-center">
                          <p className="text-sm text-muted-foreground">Carbs</p>
                          <p className="text-lg font-bold">{result.macros.carbs}g</p>
                      </div>
                       <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-center">
                          <p className="text-sm text-muted-foreground">Fat</p>
                          <p className="text-lg font-bold">{result.macros.fat}g</p>
                      </div>
                  </div>
                </div>
                 {/* Micros */}
                 {(result.micros.fiber || result.micros.iron || result.micros.calcium) && (
                    <div>
                        <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                          <Heart className="h-4 w-4 text-muted-foreground" />
                          Micronutrients
                        </h3>
                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                          {result.micros.fiber && <p><strong>Fiber:</strong> {result.micros.fiber}g</p>}
                          {result.micros.iron && <p><strong>Iron:</strong> {result.micros.iron}mg</p>}
                          {result.micros.calcium && <p><strong>Calcium:</strong> {result.micros.calcium}mg</p>}
                        </div>
                    </div>
                 )}
              </div>

              {/* Right Column: AI Insights */}
              <div className="space-y-6">
                <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20">
                    <h3 className="text-base font-semibold mb-2 flex items-center gap-2 text-green-700 dark:text-green-400">
                      <Brain className="h-4 w-4" />
                      Health Analysis
                    </h3>
                    <p className="text-sm text-green-800 dark:text-green-300/90">{result.healthAnalysis}</p>
                </div>

                <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20">
                    <h3 className="text-base font-semibold mb-2 flex items-center gap-2 text-purple-700 dark:text-purple-400">
                      <Bot className="h-4 w-4" />
                      Goal Alignment Advice
                    </h3>
                    <p className="text-sm text-purple-800 dark:text-purple-300/90">{result.goalAlignmentAdvice}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

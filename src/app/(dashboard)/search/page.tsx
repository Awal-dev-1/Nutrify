'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Search as SearchIcon,
  X,
  Sparkles,
  Bot,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { searchFoods, type SearchFoodsOutput, type FoodItem } from '@/ai/flows/search-foods-flow';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useUser } from '@/firebase';
import { AiFoodResultCard } from '@/components/food/ai-food-result-card';
import { FoodConfirmationModal } from '@/components/recognize/food-confirmation-modal';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams?.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchFoodsOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(!!initialQuery);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);

  const { toast } = useToast();
  const { userProfile, isProfileLoading } = useUser();

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
        return
    };

    setLoading(true);
    setError(null);
    setResult(null);
    setHasSearched(true);

    try {
      const userGoal = userProfile?.health?.primaryGoal;
      const response = await searchFoods({
        query: query,
        userGoal: userGoal,
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
  
  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchQuery);
  }

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">
          AI Food Search
        </h1>
        <p className="text-muted-foreground">
          Ask the AI anything about food nutrition. Try "Kenkey with grilled tilapia" or "A regular sized apple".
        </p>
      </div>

      {/* Search Section */}
      <div className="max-w-4xl">
        <form onSubmit={onFormSubmit} className="relative group w-full flex gap-2">
          <div className="relative flex-1">
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              <Sparkles className="h-5 w-5 text-primary group-focus-within:text-primary transition-colors" />
            </div>
            <Input
              placeholder="AI Search..."
              className="w-full h-14 rounded-full border-2 bg-background pl-12 pr-12 text-base transition-all focus-visible:ring-primary/20"
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
                <AiFoodResultCard 
                  key={item.foodName} 
                  item={item} 
                  userGoal={userProfile?.health?.primaryGoal}
                  onAdd={setSelectedFood}
                />
            ))}
          </div>
        )}
      </div>

      <FoodConfirmationModal 
        isOpen={!!selectedFood}
        onClose={() => setSelectedFood(null)}
        foodItem={selectedFood}
      />
    </div>
  );
}

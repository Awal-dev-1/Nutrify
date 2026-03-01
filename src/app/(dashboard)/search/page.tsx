"use client";

import { useState, useEffect } from "react";
import {
  Search as SearchIcon,
  X,
  Mic,
  Sparkles,
  Bot,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { searchFoods, type SearchFoodsOutput, type AiFoodSearchResult } from "@/ai/flows/search-foods-flow";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AiFoodCard } from "@/components/food/ai-food-card";


export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchFoodsOutput['results']>([]);
  const [interpretedQuery, setInterpretedQuery] = useState<string | null>(null);

  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const { toast } = useToast();

  useEffect(() => {
    if (!debouncedSearchQuery) {
      setResults([]);
      setInterpretedQuery(null);
      setLoading(false);
      return;
    }

    const performAiSearch = async () => {
      setLoading(true);
      setInterpretedQuery(null);
      setResults([]);

      try {
        const response = await searchFoods({ query: debouncedSearchQuery });
        setResults(response.results); 
        setInterpretedQuery(response.interpretedQuery || null);
      } catch (error) {
        console.error("AI search failed:", error);
        toast({
          variant: "destructive",
          title: "AI Search Failed",
          description: "Could not fetch AI-powered results. Please try again.",
        });
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    performAiSearch();
  }, [debouncedSearchQuery, toast]);

  const resultCount = results.length;

  return (
    <div className="w-full px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 space-y-4 sm:space-y-6 md:space-y-8">
      {/* Header */}
      <div className="space-y-1 sm:space-y-2 max-w-7xl mx-auto">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">AI Food Search</h1>
        <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
          Use natural language to find foods. Try "high protein ghanaian lunch" or "low calorie snacks".
        </p>
      </div>

      {/* Search Section */}
      <div className="max-w-4xl mx-auto">
        <div className="relative group w-full">
          <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2">
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary group-focus-within:text-primary transition-colors" />
          </div>
          <Input
            placeholder="Search for foods with AI..."
            className="w-full h-10 sm:h-12 md:h-14 rounded-full border-2 bg-background pl-9 sm:pl-12 md:pl-14 pr-20 sm:pr-24 text-xs sm:text-sm md:text-base transition-all focus-visible:ring-primary/20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 sm:gap-1">
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 sm:h-8 sm:w-8 rounded-full hover:bg-muted"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 sm:h-8 sm:w-8 rounded-full hover:bg-muted"
                  >
                    <Mic className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs sm:text-sm">
                  <p>Voice search coming soon</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
      
      {/* AI Interpretation & View Toggle */}
      {(interpretedQuery || loading || results.length > 0) && (
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between items-start sm:items-center max-w-7xl mx-auto">
          {interpretedQuery && !loading && (
            <Alert className="border-primary/20 bg-primary/5 text-sm p-3 w-full sm:w-auto">
              <Bot className="h-4 w-4 text-primary" />
              <AlertDescription className="text-primary/80">
                <span className="font-semibold">AI:</span> {interpretedQuery}
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Results Section */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div
            className={cn(
              "grid gap-3 sm:gap-4",
              "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            )}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <Skeleton className="h-5 w-3/5" />
                    <Skeleton className="h-5 w-1/5" />
                  </div>
                  <Skeleton className="h-4 w-4/5" />
                  <div className="flex gap-2 pt-2">
                    <Skeleton className="h-9 flex-1" />
                    <Skeleton className="h-9 flex-1" />
                    <Skeleton className="h-9 flex-1" />
                  </div>
                  <Skeleton className="h-10 w-full" />
                </div>
              </Card>
            ))}
          </div>
        ) : results.length > 0 ? (
          <>
            <div className="mb-2 sm:mb-3 md:mb-4 flex items-center justify-between">
              <p className="text-xs sm:text-sm text-muted-foreground">
                Showing <span className="font-medium text-foreground">{resultCount}</span> AI-powered results
              </p>
              <Badge variant="outline" className="px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 text-xs">
                <Sparkles className="h-3 w-3 mr-1" /> Sorted by relevance
              </Badge>
            </div>
            <div
              className={cn(
                "grid gap-3 sm:gap-4",
                "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              )}
            >
              {results.map((food) => (
                <AiFoodCard key={food.id} food={food} />
              ))}
            </div>
          </>
        ) : (
          debouncedSearchQuery && !loading && (
            <EmptyState
              icon={<SearchIcon className="h-10 sm:h-12 md:h-16 w-10 sm:w-12 md:w-16 text-muted-foreground" />}
              title="No foods match your search"
              description="The AI couldn't find any matching foods. Try a different search term."
              className="border-2 border-dashed rounded-lg sm:rounded-xl md:rounded-2xl py-8 sm:py-12 md:py-16 px-3 sm:px-4"
            />
          )
        )}
      </div>
    </div>
  );
}

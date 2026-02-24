"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Search as SearchIcon,
  X,
  Mic,
  LayoutGrid,
  List,
  Leaf,
  Beef,
  Wheat,
  Filter,
  Sparkles,
  SlidersHorizontal,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { mockFoods, type Food } from "@/lib/data";
import { FoodCard } from "@/components/food/food-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const categories = [
  "All",
  "Local Dish",
  "Fruit",
  "Vegetable",
  "Protein",
  "Grains",
  "Beverage",
  "Snack",
];

type ViewMode = "grid" | "list";

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [loading, setLoading] = useState(false);
  const [filteredResults, setFilteredResults] = useState<Food[]>(mockFoods);
  const [filters, setFilters] = useState({
    calorieRange: [0, 1000],
    isHighProtein: false,
    isLowCarb: false,
    isVegan: false,
    isHalal: false,
  });
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      const results = mockFoods.filter((food) => {
        const matchesCategory =
          selectedCategory === "All" || food.category === selectedCategory;
        const matchesSearch = food.name
          .toLowerCase()
          .includes(debouncedSearchQuery.toLowerCase());
        const matchesCalorie =
          food.calories >= filters.calorieRange[0] &&
          food.calories <= filters.calorieRange[1];
        const matchesHighProtein = !filters.isHighProtein || food.protein > 15;
        const matchesLowCarb = !filters.isLowCarb || food.carbs < 20;
        const matchesVegan = !filters.isVegan || food.tags.includes("Vegan");
        const matchesHalal = !filters.isHalal || food.tags.includes("Halal");

        return (
          matchesCategory &&
          matchesSearch &&
          matchesCalorie &&
          matchesHighProtein &&
          matchesLowCarb &&
          matchesVegan &&
          matchesHalal
        );
      });
      setFilteredResults(results);
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [debouncedSearchQuery, selectedCategory, filters]);

  const resetFilters = () => {
    setFilters({
      calorieRange: [0, 1000],
      isHighProtein: false,
      isLowCarb: false,
      isVegan: false,
      isHalal: false,
    });
  };

  const isFiltersApplied = useMemo(() => {
      return filters.calorieRange[0] !== 0 || filters.calorieRange[1] !== 1000 || filters.isHighProtein || filters.isLowCarb || filters.isVegan || filters.isHalal;
  }, [filters]);

  const resultCount = filteredResults.length;

  // Filter content component (used in both dropdown and sheet)
  const FilterContent = () => (
    <div className="space-y-6">
      {/* Calorie Range */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Calorie Range</Label>
          <Badge variant="outline" className="font-mono text-xs">
            {filters.calorieRange[0]} - {filters.calorieRange[1]} kcal
          </Badge>
        </div>
        <Slider
          defaultValue={[0, 1000]}
          value={filters.calorieRange}
          onValueChange={(value) => setFilters(f => ({...f, calorieRange: value}))}
          max={1000}
          step={50}
          className="py-2"
        />
      </div>

      <Separator />

      {/* Dietary Filters */}
      <div className="space-y-4">
        <Label className="text-sm font-medium">Dietary Preferences</Label>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Beef className="h-4 w-4 text-red-500" />
              <Label htmlFor="high-protein" className="text-sm cursor-pointer">High Protein</Label>
            </div>
            <Switch 
              id="high-protein" 
              checked={filters.isHighProtein} 
              onCheckedChange={(checked) => setFilters(f => ({...f, isHighProtein: checked}))} 
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wheat className="h-4 w-4 text-yellow-600" />
              <Label htmlFor="low-carb" className="text-sm cursor-pointer">Low Carb</Label>
            </div>
            <Switch 
              id="low-carb" 
              checked={filters.isLowCarb} 
              onCheckedChange={(checked) => setFilters(f => ({...f, isLowCarb: checked}))} 
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Leaf className="h-4 w-4 text-green-600" />
              <Label htmlFor="vegan" className="text-sm cursor-pointer">Vegan</Label>
            </div>
            <Switch 
              id="vegan" 
              checked={filters.isVegan} 
              onCheckedChange={(checked) => setFilters(f => ({...f, isVegan: checked}))} 
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="halal" className="text-sm cursor-pointer">Halal</Label>
            <Switch 
              id="halal" 
              checked={filters.isHalal} 
              onCheckedChange={(checked) => setFilters(f => ({...f, isHalal: checked}))} 
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Actions */}
      <div className="flex gap-3">
        <Button 
          variant="outline" 
          onClick={() => {
            resetFilters();
            if (window.innerWidth < 1024) setIsFilterSheetOpen(false);
          }} 
          className="flex-1"
          disabled={!isFiltersApplied}
        >
          Reset
        </Button>
        <Button 
          className="flex-1"
          onClick={() => {
            if (window.innerWidth < 1024) setIsFilterSheetOpen(false);
          }}
        >
          Apply Filters
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Search Foods</h1>
        <p className="text-sm md:text-base text-muted-foreground max-w-2xl">
          Find detailed nutrition information for thousands of foods and local dishes.
        </p>
      </div>

      {/* Search Section */}
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2">
          <SearchIcon className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
        </div>
        <Input
          placeholder="Search for foods, fruits, local dishes…"
          className="h-12 w-full rounded-full border bg-background pl-12 pr-24 text-sm transition-all focus-visible:ring-primary/20 md:h-14 md:pl-14 md:text-base"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-muted"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-muted"
                >
                  <Mic className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Voice search coming soon</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Results count - Mobile */}
      <div className="flex items-center justify-between sm:hidden">
        <Badge variant="secondary" className="px-3 py-1 text-xs">
          {resultCount} {resultCount === 1 ? 'result' : 'results'}
        </Badge>
      </div>

      {/* Categories - Horizontal Scroll */}
      <div className="w-full overflow-x-auto pb-2 scrollbar-thin">
        <div className="flex gap-2 min-w-max">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs md:text-sm transition-all whitespace-nowrap",
                selectedCategory === category 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "hover:bg-muted"
              )}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        {/* Result count - desktop */}
        <div className="hidden sm:block">
          <Badge variant="secondary" className="px-3 py-1">
            {resultCount} {resultCount === 1 ? 'result' : 'results'}
          </Badge>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {/* Filter - Desktop Dropdown */}
          <div className="hidden lg:block">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className={cn(
                    "relative gap-2 h-9",
                    isFiltersApplied && "border-primary/50 bg-primary/5"
                  )}
                >
                  <Filter className="h-4 w-4" />
                  <span>Filters</span>
                  {isFiltersApplied && (
                    <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 rounded-full">
                      •
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-80 p-5" align="end">
                <DropdownMenuLabel className="px-0 text-base">Advanced Filters</DropdownMenuLabel>
                <p className="text-xs text-muted-foreground mt-1 mb-3 px-0">
                  Refine your search with specific criteria
                </p>
                <FilterContent />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Filter - Mobile/Tablet Sheet */}
          <div className="lg:hidden">
            <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className={cn(
                    "relative gap-2 h-9",
                    isFiltersApplied && "border-primary/50 bg-primary/5"
                  )}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  <span className="hidden sm:inline">Filters</span>
                  {isFiltersApplied && (
                    <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 rounded-full">
                      •
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-auto max-h-[90vh] rounded-t-2xl">
                <SheetHeader className="text-left pb-4">
                  <SheetTitle>Advanced Filters</SheetTitle>
                  <SheetDescription>
                    Refine your search with specific criteria
                  </SheetDescription>
                </SheetHeader>
                <div className="py-4 overflow-y-auto">
                  <FilterContent />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg border">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("grid")}
              className={cn(
                "h-8 w-8 transition-all",
                viewMode === "grid" && "bg-background shadow-sm"
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("list")}
              className={cn(
                "h-8 w-8 transition-all",
                viewMode === "list" && "bg-background shadow-sm"
              )}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Active Filters Display */}
      {isFiltersApplied && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Active:</span>
          {filters.calorieRange[0] > 0 && (
            <Badge variant="secondary" className="px-2 py-0.5 text-xs">
              Min {filters.calorieRange[0]} kcal
            </Badge>
          )}
          {filters.calorieRange[1] < 1000 && (
            <Badge variant="secondary" className="px-2 py-0.5 text-xs">
              Max {filters.calorieRange[1]} kcal
            </Badge>
          )}
          {filters.isHighProtein && (
            <Badge variant="secondary" className="px-2 py-0.5 text-xs">
              <Beef className="h-3 w-3 mr-1" /> High Protein
            </Badge>
          )}
          {filters.isLowCarb && (
            <Badge variant="secondary" className="px-2 py-0.5 text-xs">
              <Wheat className="h-3 w-3 mr-1" /> Low Carb
            </Badge>
          )}
          {filters.isVegan && (
            <Badge variant="secondary" className="px-2 py-0.5 text-xs">
              <Leaf className="h-3 w-3 mr-1" /> Vegan
            </Badge>
          )}
          {filters.isHalal && (
            <Badge variant="secondary" className="px-2 py-0.5 text-xs">
              Halal
            </Badge>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={resetFilters}
            className="h-6 px-2 text-xs"
          >
            Clear all
          </Button>
        </div>
      )}
      
      {/* Results Section */}
      <div>
        {loading ? (
          <div
            className={cn(
              "grid gap-4",
              viewMode === "grid"
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                : "grid-cols-1"
            )}
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-40 md:h-48 w-full" />
                <div className="p-3 md:p-4 space-y-2 md:space-y-3">
                  <Skeleton className="h-4 md:h-5 w-3/4" />
                  <Skeleton className="h-3 md:h-4 w-1/2" />
                  <div className="flex gap-2 pt-1 md:pt-2">
                    <Skeleton className="h-8 md:h-9 flex-1" />
                    <Skeleton className="h-8 md:h-9 flex-1" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : filteredResults.length > 0 ? (
          <>
            <div className="mb-3 md:mb-4 flex items-center justify-between">
              <p className="text-xs md:text-sm text-muted-foreground">
                Showing <span className="font-medium text-foreground">{resultCount}</span> results
              </p>
              <Badge variant="outline" className="px-2 md:px-3 py-0.5 md:py-1 text-xs">
                <Sparkles className="h-3 w-3 mr-1" /> Sorted by relevance
              </Badge>
            </div>
            <div
              className={cn(
                "grid gap-4",
                viewMode === "grid"
                  ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  : "grid-cols-1"
              )}
            >
              {filteredResults.map((food) => (
                <FoodCard key={food.id} food={food} viewMode={viewMode} />
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            icon={<SearchIcon className="h-12 md:h-16 w-12 md:w-16 text-muted-foreground" />}
            title="No foods match your search"
            description="Try another keyword or remove some filters to see more results."
            className="border-2 border-dashed rounded-xl md:rounded-2xl py-12 md:py-16"
          >
            <Button variant="outline" onClick={resetFilters} size="sm" className="mt-2 md:mt-4">
              Clear all filters
            </Button>
          </EmptyState>
        )}
      </div>
    </div>
  );
}

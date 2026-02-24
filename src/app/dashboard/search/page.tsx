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
    <div className="space-y-4 sm:space-y-6">
      {/* Calorie Range */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-xs sm:text-sm font-medium">Calorie Range</Label>
          <Badge variant="outline" className="font-mono text-xs px-2 py-0.5">
            {filters.calorieRange[0]} - {filters.calorieRange[1]} kcal
          </Badge>
        </div>
        <Slider
          defaultValue={[0, 1000]}
          value={filters.calorieRange}
          onValueChange={(value) => setFilters(f => ({...f, calorieRange: value}))}
          max={1000}
          step={50}
          className="py-1 sm:py-2"
        />
      </div>

      <Separator className="my-3 sm:my-4" />

      {/* Dietary Filters */}
      <div className="space-y-3 sm:space-y-4">
        <Label className="text-xs sm:text-sm font-medium">Dietary Preferences</Label>
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Beef className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500" />
              <Label htmlFor="high-protein" className="text-xs sm:text-sm cursor-pointer">High Protein</Label>
            </div>
            <Switch 
              id="high-protein" 
              checked={filters.isHighProtein} 
              onCheckedChange={(checked) => setFilters(f => ({...f, isHighProtein: checked}))} 
              className="scale-75 sm:scale-100"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Wheat className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-600" />
              <Label htmlFor="low-carb" className="text-xs sm:text-sm cursor-pointer">Low Carb</Label>
            </div>
            <Switch 
              id="low-carb" 
              checked={filters.isLowCarb} 
              onCheckedChange={(checked) => setFilters(f => ({...f, isLowCarb: checked}))} 
              className="scale-75 sm:scale-100"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Leaf className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600" />
              <Label htmlFor="vegan" className="text-xs sm:text-sm cursor-pointer">Vegan</Label>
            </div>
            <Switch 
              id="vegan" 
              checked={filters.isVegan} 
              onCheckedChange={(checked) => setFilters(f => ({...f, isVegan: checked}))} 
              className="scale-75 sm:scale-100"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="halal" className="text-xs sm:text-sm cursor-pointer">Halal</Label>
            <Switch 
              id="halal" 
              checked={filters.isHalal} 
              onCheckedChange={(checked) => setFilters(f => ({...f, isHalal: checked}))} 
              className="scale-75 sm:scale-100"
            />
          </div>
        </div>
      </div>

      <Separator className="my-3 sm:my-4" />

      {/* Actions */}
      <div className="flex gap-2 sm:gap-3">
        <Button 
          variant="outline" 
          onClick={() => {
            resetFilters();
            if (window.innerWidth < 1024) setIsFilterSheetOpen(false);
          }} 
          className="flex-1 h-8 sm:h-10 text-xs sm:text-sm"
          disabled={!isFiltersApplied}
        >
          Reset
        </Button>
        <Button 
          className="flex-1 h-8 sm:h-10 text-xs sm:text-sm"
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
    <div className="w-full px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 space-y-4 sm:space-y-6 md:space-y-8">
      {/* Header */}
      <div className="space-y-1 sm:space-y-2 max-w-7xl mx-auto">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Search Foods</h1>
        <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
          Find detailed nutrition information for thousands of foods and local dishes.
        </p>
      </div>

      {/* Search Section - Fully Responsive Width */}
      <div className="max-w-7xl mx-auto">
        <div className="relative group w-full">
          <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2">
            <SearchIcon className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          </div>
          <Input
            placeholder="Search for foods, fruits, local dishes..."
            className="w-full h-10 sm:h-12 md:h-14 rounded-full border bg-background pl-9 sm:pl-12 md:pl-14 pr-20 sm:pr-24 text-xs sm:text-sm md:text-base transition-all focus-visible:ring-primary/20"
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

      {/* Results count - Mobile */}
      <div className="flex items-center justify-between sm:hidden max-w-7xl mx-auto">
        <Badge variant="secondary" className="px-2 py-0.5 text-xs">
          {resultCount} {resultCount === 1 ? 'result' : 'results'}
        </Badge>
      </div>

      {/* Categories - Horizontal Scroll */}
      <div className="w-full max-w-7xl mx-auto overflow-x-auto pb-2 scrollbar-thin">
        <div className="flex gap-1.5 sm:gap-2 min-w-max">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                "rounded-full px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm transition-all whitespace-nowrap",
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
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between items-start sm:items-center max-w-7xl mx-auto">
        {/* Result count - desktop */}
        <div className="hidden sm:block">
          <Badge variant="secondary" className="px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm">
            {resultCount} {resultCount === 1 ? 'result' : 'results'}
          </Badge>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-end">
          {/* Filter - Desktop Dropdown */}
          <div className="hidden lg:block">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className={cn(
                    "relative gap-1 sm:gap-2 h-8 sm:h-9 text-xs sm:text-sm",
                    isFiltersApplied && "border-primary/50 bg-primary/5"
                  )}
                >
                  <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Filters</span>
                  {isFiltersApplied && (
                    <Badge variant="secondary" className="ml-0.5 sm:ml-1 h-4 w-4 sm:h-5 sm:w-5 p-0 rounded-full text-xs">
                      •
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-72 sm:w-80 p-4 sm:p-5" align="end">
                <DropdownMenuLabel className="px-0 text-sm sm:text-base">Advanced Filters</DropdownMenuLabel>
                <p className="text-xs text-muted-foreground mt-1 mb-2 sm:mb-3 px-0">
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
                    "relative gap-1 sm:gap-2 h-8 sm:h-9 text-xs sm:text-sm",
                    isFiltersApplied && "border-primary/50 bg-primary/5"
                  )}
                >
                  <SlidersHorizontal className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Filters</span>
                  {isFiltersApplied && (
                    <Badge variant="secondary" className="ml-0.5 sm:ml-1 h-4 w-4 sm:h-5 sm:w-5 p-0 rounded-full text-xs">
                      •
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-auto max-h-[90vh] rounded-t-2xl px-3 sm:px-4">
                <SheetHeader className="text-left pb-3 sm:pb-4">
                  <SheetTitle className="text-base sm:text-lg">Advanced Filters</SheetTitle>
                  <SheetDescription className="text-xs sm:text-sm">
                    Refine your search with specific criteria
                  </SheetDescription>
                </SheetHeader>
                <div className="py-3 sm:py-4 overflow-y-auto max-h-[60vh]">
                  <FilterContent />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-0.5 sm:gap-1 bg-muted/50 p-0.5 sm:p-1 rounded-lg border">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("grid")}
              className={cn(
                "h-7 w-7 sm:h-8 sm:w-8 transition-all",
                viewMode === "grid" && "bg-background shadow-sm"
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("list")}
              className={cn(
                "h-7 w-7 sm:h-8 sm:w-8 transition-all",
                viewMode === "list" && "bg-background shadow-sm"
              )}
            >
              <List className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Active Filters Display */}
      {isFiltersApplied && (
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 max-w-7xl mx-auto">
          <span className="text-xs text-muted-foreground">Active:</span>
          {filters.calorieRange[0] > 0 && (
            <Badge variant="secondary" className="px-1.5 sm:px-2 py-0.5 text-xs">
              Min {filters.calorieRange[0]} kcal
            </Badge>
          )}
          {filters.calorieRange[1] < 1000 && (
            <Badge variant="secondary" className="px-1.5 sm:px-2 py-0.5 text-xs">
              Max {filters.calorieRange[1]} kcal
            </Badge>
          )}
          {filters.isHighProtein && (
            <Badge variant="secondary" className="px-1.5 sm:px-2 py-0.5 text-xs">
              <Beef className="h-3 w-3 mr-1" /> High Protein
            </Badge>
          )}
          {filters.isLowCarb && (
            <Badge variant="secondary" className="px-1.5 sm:px-2 py-0.5 text-xs">
              <Wheat className="h-3 w-3 mr-1" /> Low Carb
            </Badge>
          )}
          {filters.isVegan && (
            <Badge variant="secondary" className="px-1.5 sm:px-2 py-0.5 text-xs">
              <Leaf className="h-3 w-3 mr-1" /> Vegan
            </Badge>
          )}
          {filters.isHalal && (
            <Badge variant="secondary" className="px-1.5 sm:px-2 py-0.5 text-xs">
              Halal
            </Badge>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={resetFilters}
            className="h-5 sm:h-6 px-1.5 sm:px-2 text-xs"
          >
            Clear all
          </Button>
        </div>
      )}
      
      {/* Results Section */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div
            className={cn(
              "grid gap-3 sm:gap-4",
              viewMode === "grid"
                ? "grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                : "grid-cols-1"
            )}
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-32 xs:h-36 sm:h-40 md:h-48 w-full" />
                <div className="p-2 sm:p-3 md:p-4 space-y-1.5 sm:space-y-2 md:space-y-3">
                  <Skeleton className="h-3 sm:h-4 md:h-5 w-3/4" />
                  <Skeleton className="h-2 sm:h-3 md:h-4 w-1/2" />
                  <div className="flex gap-1 sm:gap-2 pt-1 sm:pt-2">
                    <Skeleton className="h-6 sm:h-7 md:h-9 flex-1" />
                    <Skeleton className="h-6 sm:h-7 md:h-9 flex-1" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : filteredResults.length > 0 ? (
          <>
            <div className="mb-2 sm:mb-3 md:mb-4 flex items-center justify-between">
              <p className="text-xs sm:text-sm text-muted-foreground">
                Showing <span className="font-medium text-foreground">{resultCount}</span> results
              </p>
              <Badge variant="outline" className="px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 text-xs">
                <Sparkles className="h-3 w-3 mr-1" /> Sorted by relevance
              </Badge>
            </div>
            <div
              className={cn(
                "grid gap-3 sm:gap-4",
                viewMode === "grid"
                  ? "grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
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
            icon={<SearchIcon className="h-10 sm:h-12 md:h-16 w-10 sm:w-12 md:w-16 text-muted-foreground" />}
            title="No foods match your search"
            description="Try another keyword or remove some filters to see more results."
            className="border-2 border-dashed rounded-lg sm:rounded-xl md:rounded-2xl py-8 sm:py-12 md:py-16 px-3 sm:px-4"
          >
            <Button variant="outline" onClick={resetFilters} size="sm" className="mt-2 sm:mt-3 md:mt-4 text-xs sm:text-sm">
              Clear all filters
            </Button>
          </EmptyState>
        )}
      </div>
    </div>
  );
}
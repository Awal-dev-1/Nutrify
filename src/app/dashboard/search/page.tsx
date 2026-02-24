"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Search as SearchIcon,
  X,
  Mic,
  LayoutGrid,
  List,
  SlidersHorizontal,
  Leaf,
  Beef,
  Wheat,
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
    }, 500); // Simulate API delay

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

  return (
    <div className="space-y-6">
      {/* 1. Search Section */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search for foods, fruits, local dishes…"
          className="pl-10 pr-20 text-lg h-14 rounded-full"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-5 w-5" />
            </Button>
          )}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                >
                  <Mic className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Voice search coming soon</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* 2. Filter & Category Section */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="w-full overflow-x-auto pb-2">
            <div className="flex gap-2">
            {categories.map((category) => (
                <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                    "rounded-full whitespace-nowrap",
                    selectedCategory === category && "bg-primary text-primary-foreground"
                )}
                >
                {category}
                </Button>
            ))}
            </div>
        </div>
        <div className="flex-shrink-0 flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="relative">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Filters
                {isFiltersApplied && <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 p-4 space-y-4">
              <DropdownMenuLabel>Advanced Filters</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="space-y-2">
                <Label>Calorie Range: {filters.calorieRange[0]} - {filters.calorieRange[1]} kcal</Label>
                <Slider
                    defaultValue={[0, 1000]}
                    value={filters.calorieRange}
                    onValueChange={(value) => setFilters(f => ({...f, calorieRange: value}))}
                    max={1000}
                    step={50}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="high-protein" className="flex items-center gap-2"><Beef className="h-4 w-4"/> High Protein</Label>
                <Switch id="high-protein" checked={filters.isHighProtein} onCheckedChange={(checked) => setFilters(f => ({...f, isHighProtein: checked}))} />
              </div>
               <div className="flex items-center justify-between">
                <Label htmlFor="low-carb" className="flex items-center gap-2"><Wheat className="h-4 w-4"/> Low Carb</Label>
                <Switch id="low-carb" checked={filters.isLowCarb} onCheckedChange={(checked) => setFilters(f => ({...f, isLowCarb: checked}))} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="vegan" className="flex items-center gap-2"><Leaf className="h-4 w-4"/> Vegan</Label>
                <Switch id="vegan" checked={filters.isVegan} onCheckedChange={(checked) => setFilters(f => ({...f, isVegan: checked}))}/>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="halal">Halal</Label>
                <Switch id="halal" checked={filters.isHalal} onCheckedChange={(checked) => setFilters(f => ({...f, isHalal: checked}))}/>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Button variant="ghost" onClick={resetFilters} className="w-full">Reset Filters</Button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex items-center gap-1 bg-muted p-1 rounded-md">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("grid")}
              className="h-8 w-8"
            >
              <LayoutGrid className="h-5 w-5" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("list")}
              className="h-8 w-8"
            >
              <List className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* 4. Food Results Display */}
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
                <Card key={i} className="space-y-4 p-4">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <div className="flex justify-between">
                        <Skeleton className="h-8 w-1/3" />
                        <Skeleton className="h-8 w-1/3" />
                    </div>
                </Card>
            ))}
          </div>
        ) : filteredResults.length > 0 ? (
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
        ) : (
          <EmptyState
            title="No foods match your search"
            description="Try another keyword or remove some filters to see more results."
          />
        )}
      </div>
    </div>
  );
}

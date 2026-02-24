"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Food } from "@/lib/data";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Beef, Wheat, Droplets } from "lucide-react";
import { PortionSelectorModal } from "./portion-selector-modal";

interface FoodCardProps {
  food: Food;
  viewMode: "grid" | "list";
}

export function FoodCard({ food, viewMode }: FoodCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isGridView = viewMode === "grid";

  return (
    <>
      <Card
        className={cn(
          "group transition-all duration-200 hover:shadow-lg overflow-hidden",
          isGridView ? "flex flex-col" : "flex"
        )}
      >
        {/* Image Container */}
        <div
          className={cn(
            "relative overflow-hidden bg-muted",
            isGridView ? "w-full h-48" : "w-1/3 h-auto min-h-[160px]"
          )}
        >
          <Image
            src={food.image}
            alt={food.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            data-ai-hint={food.imageHint}
          />
          {/* Category Badge - Overlay for grid, inline for list */}
          {isGridView && (
            <Badge 
              variant="secondary" 
              className="absolute top-2 right-2 capitalize shadow-sm"
            >
              {food.category}
            </Badge>
          )}
        </div>

        {/* Content Container */}
        <div className={cn("flex-1 flex flex-col", isGridView ? "p-4" : "p-5")}>
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <Link 
                href={`/food/${food.id}`}
                className="hover:underline underline-offset-2"
              >
                <CardTitle className="text-base font-semibold leading-tight">
                  {food.name}
                </CardTitle>
              </Link>
              
              {/* Category Badge - Only show in list view */}
              {!isGridView && (
                <Badge variant="outline" className="capitalize shrink-0">
                  {food.category}
                </Badge>
              )}
            </div>
            
            <CardDescription className="text-2xl font-bold text-primary">
              {food.calories} <span className="text-sm font-normal text-muted-foreground">kcal</span>
            </CardDescription>
          </div>

          {/* Macros */}
          <div className="mt-4 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <div className="p-1 rounded-full bg-red-50 dark:bg-red-950/20">
                <Beef className="h-3.5 w-3.5 text-red-500" />
              </div>
              <span className="font-medium">{food.protein}g</span>
              <span className="text-xs text-muted-foreground">protein</span>
            </div>
            
            <div className="flex items-center gap-1.5">
              <div className="p-1 rounded-full bg-yellow-50 dark:bg-yellow-950/20">
                <Wheat className="h-3.5 w-3.5 text-yellow-600" />
              </div>
              <span className="font-medium">{food.carbs}g</span>
              <span className="text-xs text-muted-foreground">carbs</span>
            </div>
            
            <div className="flex items-center gap-1.5">
              <div className="p-1 rounded-full bg-blue-50 dark:bg-blue-950/20">
                <Droplets className="h-3.5 w-3.5 text-blue-500" />
              </div>
              <span className="font-medium">{food.fat}g</span>
              <span className="text-xs text-muted-foreground">fat</span>
            </div>
          </div>

          {/* Actions */}
          <div className={cn("flex gap-2", isGridView ? "mt-4" : "mt-5")}>
            <Button 
              asChild 
              variant="default" 
              size="sm" 
              className="flex-1 h-9"
            >
              <Link href={`/food/${food.id}`}>View Details</Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-9"
              onClick={() => setIsModalOpen(true)}
            >
              Quick Add
            </Button>
          </div>
        </div>
      </Card>
      
      <PortionSelectorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        food={food}
      />
    </>
  );
}
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
          "transition-all hover:shadow-lg hover:-translate-y-1 overflow-hidden",
          !isGridView && "flex"
        )}
      >
        <div
          className={cn(
            "relative",
            isGridView ? "w-full h-48" : "w-1/3 h-full flex-shrink-0"
          )}
        >
          <Image
            src={food.image}
            alt={food.name}
            fill
            className="object-cover"
            data-ai-hint={food.imageHint}
          />
        </div>

        <div className="flex flex-col flex-grow">
          <CardHeader className={cn(!isGridView && "p-4")}>
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg">
                <Link href={`/food/${food.id}`}>{food.name}</Link>
              </CardTitle>
              <Badge variant="outline" className="capitalize">
                {food.category}
              </Badge>
            </div>
            <CardDescription className="text-2xl font-bold text-primary">
              {food.calories} kcal
            </CardDescription>
          </CardHeader>

          <CardContent className={cn("flex-grow", !isGridView && "p-4 pt-0")}>
            <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Beef className="h-4 w-4 text-red-500" />
                <span>{food.protein}g P</span>
              </div>
              <div className="flex items-center gap-1">
                <Wheat className="h-4 w-4 text-yellow-600" />
                <span>{food.carbs}g C</span>
              </div>
              <div className="flex items-center gap-1">
                <Droplets className="h-4 w-4 text-blue-500" />
                <span>{food.fat}g F</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className={cn("gap-2", !isGridView && "p-4 pt-0")}>
            <Button asChild size="sm" className="flex-1">
              <Link href={`/food/${food.id}`}>View Details</Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setIsModalOpen(true)}
            >
              Quick Add
            </Button>
          </CardFooter>
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

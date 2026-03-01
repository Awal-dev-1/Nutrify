'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Card,
  CardDescription,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Beef, Wheat, Droplets, Lightbulb, Sparkles } from 'lucide-react';
import { PortionSelectorModal } from './portion-selector-modal';
import type { AiFoodSearchResult } from '@/ai/flows/search-foods-flow';
import { mockFoods } from '@/lib/data'; // for quick add modal

export function AiFoodCard({ food }: { food: AiFoodSearchResult }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Find the full food object for the modal, which expects the 'Food' type
  const fullFoodDetails = mockFoods.find(f => f.id === food.id);

  return (
    <>
      <Card className="group flex h-full flex-col overflow-hidden border-0 shadow-sm transition-all duration-300 hover:shadow-lg">
        <CardContent className="flex flex-1 flex-col p-4">
          <div className="flex flex-1 flex-col space-y-4">
            {/* Header */}
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <Link
                  href={`/dashboard/food/${food.id}`}
                  className="hover:underline underline-offset-2"
                >
                  <CardTitle className="text-base font-semibold leading-tight">
                    {food.name}
                  </CardTitle>
                </Link>
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1 border-primary/20 bg-primary/5 text-primary"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>{Math.round(food.matchScore * 100)}%</span>
                </Badge>
              </div>

              <CardDescription className="text-2xl font-bold text-primary">
                {food.calories}{' '}
                <span className="text-sm font-normal text-muted-foreground">
                  kcal
                </span>
              </CardDescription>
            </div>

            {/* Macros */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <div className="rounded-full bg-red-50 p-1 dark:bg-red-950/20">
                  <Beef className="h-3.5 w-3.5 text-red-500" />
                </div>
                <span className="font-medium">{food.macros.protein}g</span>
                <span className="text-xs text-muted-foreground">protein</span>
              </div>

              <div className="flex items-center gap-1.5">
                <div className="rounded-full bg-yellow-50 p-1 dark:bg-yellow-950/20">
                  <Wheat className="h-3.5 w-3.5 text-yellow-600" />
                </div>
                <span className="font-medium">{food.macros.carbs}g</span>
                <span className="text-xs text-muted-foreground">carbs</span>
              </div>

              <div className="flex items-center gap-1.5">
                <div className="rounded-full bg-blue-50 p-1 dark:bg-blue-950/20">
                  <Droplets className="h-3.5 w-3.5 text-blue-500" />
                </div>
                <span className="font-medium">{food.macros.fat}g</span>
                <span className="text-xs text-muted-foreground">fat</span>
              </div>
            </div>

            {/* AI Reason */}
            <div className="flex items-start gap-3 rounded-md border border-primary/10 bg-primary/5 p-3 text-sm text-primary/80">
              <Lightbulb className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <p className="flex-1">{food.reason}</p>
            </div>
          </div>
        </CardContent>

        {/* Actions */}
        <CardFooter className="p-4 pt-0">
          <div className="flex w-full gap-2">
            <Button asChild variant="default" size="sm" className="h-9 flex-1">
              <Link href={`/dashboard/food/${food.id}`}>View Details</Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 flex-1"
              onClick={() => setIsModalOpen(true)}
              disabled={!fullFoodDetails}
            >
              Quick Add
            </Button>
          </div>
        </CardFooter>
      </Card>
      
      {fullFoodDetails && (
        <PortionSelectorModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          food={fullFoodDetails}
        />
      )}
    </>
  );
}

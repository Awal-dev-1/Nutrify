'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Trash2, Save, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

interface PlannerControlsProps {
  onGenerate: () => void;
  onClear: () => void;
}

export function PlannerControls({ onGenerate, onClear }: PlannerControlsProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      onGenerate();
      toast({
        title: 'Plan Generated!',
        description: 'A suggested meal plan has been created for you.',
      });
      setIsGenerating(false);
    }, 1500);
  };
  
  const handleSave = () => {
      toast({
          title: "Plan Saved!",
          description: "Your meal plan has been saved."
      })
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={handleGenerate} disabled={isGenerating}>
        {isGenerating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
            <Sparkles className="mr-2 h-4 w-4" />
        )}
        Generate Plan
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive">
            <Trash2 className="mr-2 h-4 w-4" /> Clear Plan
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently clear your entire meal plan. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onClear}>Clear Plan</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
       <Button onClick={handleSave}>
        <Save className="mr-2 h-4 w-4" /> Save Plan
      </Button>
    </div>
  );
}

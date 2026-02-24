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
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Generate Button */}
      <Button 
        variant="default" 
        onClick={handleGenerate} 
        disabled={isGenerating}
        className="flex-1 sm:flex-none bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-sm"
      >
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            <span>Generating...</span>
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            <span>Generate Plan</span>
          </>
        )}
      </Button>

      {/* Clear Button with Alert Dialog */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button 
            variant="outline" 
            className="flex-1 sm:flex-none border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
          >
            <Trash2 className="mr-2 h-4 w-4" /> 
            <span>Clear Plan</span>
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-destructive/10">
                <Trash2 className="h-4 w-4 text-destructive" />
              </div>
              Clear meal plan?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base pt-2">
              This will permanently clear your entire meal plan. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="mt-0">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={onClear}
              className="bg-destructive hover:bg-destructive/90"
            >
              Clear Plan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Save Button */}
      <Button 
        variant="secondary" 
        onClick={handleSave}
        className="flex-1 sm:flex-none bg-secondary/80 hover:bg-secondary"
      >
        <Save className="mr-2 h-4 w-4" /> 
        <span>Save Plan</span>
      </Button>
    </div>
  );
}
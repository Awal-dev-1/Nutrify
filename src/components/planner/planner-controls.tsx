'use client';

import { Button } from '@/components/ui/button';
import { Loader2, Save, Sparkles, Trash2 } from 'lucide-react';
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

interface PlannerControlsProps {
  onGenerate: () => void;
  onClear: () => void;
  isGenerating: boolean;
}

export function PlannerControls({ onGenerate, onClear, isGenerating }: PlannerControlsProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <Button onClick={onGenerate} disabled={isGenerating}>
        {isGenerating ? (
          <Loader2 className="h-4 w-4 animate-spin sm:mr-2" />
        ) : (
          <Sparkles className="h-4 w-4 sm:mr-2" />
        )}
        <span className="hidden sm:inline">Generate Plan</span>
        <span className="inline sm:hidden">Generate</span>
      </Button>
      
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive">
            <Trash2 className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Clear Plan</span>
            <span className="inline sm:hidden">Clear</span>
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete all planned meals. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onClear} className="bg-destructive hover:bg-destructive/90">
              Clear Plan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Button variant="outline" disabled>
        <Save className="h-4 w-4 sm:mr-2" />
        <span className="hidden sm:inline">Save Plan</span>
        <span className="inline sm:hidden">Save</span>
      </Button>
    </div>
  );
}

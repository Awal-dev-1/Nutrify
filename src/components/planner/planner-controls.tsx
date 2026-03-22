
'use client';

import { Button } from '@/components/ui/button';
import { Loader2, Save, Sparkles, Trash2, X } from 'lucide-react';
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
  onSave: () => void;
  isSaving: boolean;
  onDiscard: () => void;
  isPreviewing: boolean;
}

export function PlannerControls({
  onGenerate,
  onClear,
  isGenerating,
  onSave,
  isSaving,
  onDiscard,
  isPreviewing,
}: PlannerControlsProps) {
  if (isPreviewing) {
    return (
      <div className="flex items-center gap-2 animate-in fade-in-50">
        <Button variant="outline" onClick={onDiscard} disabled={isSaving}>
          <X className="h-4 w-4 mr-2" />
          Discard
        </Button>
        <Button onClick={onSave} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Plan
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button onClick={onGenerate} disabled={isGenerating} className="whitespace-nowrap">
        {isGenerating ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Sparkles className="h-4 w-4 mr-2" />
        )}
        <span className="hidden sm:inline">Generate Plan</span>
        <span className="sm:hidden">Generate</span>
      </Button>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" className="whitespace-nowrap">
            <Trash2 className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Clear Plan</span>
            <span className="sm:hidden">Clear</span>
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
    </div>
  );
}

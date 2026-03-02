'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useUser, useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Sparkles, ScanLine, AlertCircle, RefreshCw, X } from 'lucide-react';
import { ImageUploader } from '@/components/recognize/image-uploader';
import { PredictionCard } from '@/components/recognize/prediction-card';
import { FoodConfirmationModal } from '@/components/recognize/food-confirmation-modal';
import { runAiScan } from '@/services/aiRecognitionService';
import type { AIPrediction } from '@/types/ai';

type Status = 'idle' | 'analyzing' | 'completed' | 'failed';

export default function RecognizePage() {
  const { user } = useUser();
  const db = useFirestore();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<AIPrediction[] | null>(null);
  const [selectedFood, setSelectedFood] = useState<AIPrediction | null>(null);

  // Effect to handle file selection and create a preview URL
  useEffect(() => {
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
    setPreview(null);
  }, [file]);
  
  const handleFileSelect = (selectedFile: File) => {
    resetState();
    setFile(selectedFile);
  };

  const handleAnalyze = async () => {
    if (!file || !user || !db) return;

    setStatus('analyzing');
    setError(null);
    setPredictions(null);

    try {
      const scanResults = await runAiScan(db, user, file);
      setPredictions(scanResults);
      setStatus('completed');
    } catch (err: any) {
      console.error('AI Scan failed:', err);
      const errorMessage = err.message || 'An unknown error occurred during AI analysis.';
      setStatus('failed');
      setError(errorMessage);
    }
  };

  const resetState = () => {
    setFile(null);
    setPreview(null);
    setStatus('idle');
    setError(null);
    setPredictions(null);
  };

  const renderContent = () => {
    switch (status) {
      case 'idle':
        return (
          <div className='w-full lg:w-3/4 mx-auto'>
            {preview ? (
              <div className="space-y-4 text-center">
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    <Image
                      src={preview}
                      alt="Selected food"
                      width={500}
                      height={500}
                      className="w-full h-auto object-contain max-h-[50vh]"
                    />
                  </CardContent>
                </Card>
                <div className='flex justify-center gap-2'>
                    <Button size="lg" onClick={handleAnalyze}>
                        <Sparkles className="mr-2 h-4 w-4" /> Analyze Image
                    </Button>
                    <Button size="lg" variant="ghost" onClick={() => setFile(null)}>
                        <X className="mr-2 h-4 w-4" /> Change Image
                    </Button>
                </div>
              </div>
            ) : (
              <ImageUploader onFileSelect={handleFileSelect} />
            )}
          </div>
        );

      case 'analyzing':
        return (
          <div className="flex flex-col items-center justify-center text-center p-8 space-y-3">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <h3 className="text-xl font-semibold">AI is analyzing your food...</h3>
            <p className="text-muted-foreground">This may take a few moments.</p>
          </div>
        );
      
      case 'completed':
        if (!predictions || predictions.length === 0) {
          return (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No Food Detected</AlertTitle>
              <AlertDescription>
                The AI couldn't identify any food in the image. Try a clearer picture or a different angle.
                <Button variant="outline" onClick={resetState} className="mt-4 w-full">
                  <RefreshCw className="mr-2 h-4 w-4" /> Try Again
                </Button>
              </AlertDescription>
            </Alert>
          );
        }
        return (
          <div className="space-y-4 animate-in fade-in-50">
            <h3 className="text-lg font-semibold">Here's what the AI found:</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {predictions.map((pred, index) => (
                <PredictionCard 
                  key={index} 
                  prediction={pred} 
                  onSelect={() => setSelectedFood(pred)} 
                />
              ))}
            </div>
             <div className="text-center pt-4">
                <Button variant="outline" onClick={resetState}>
                    <RefreshCw className="mr-2 h-4 w-4" /> Scan a new image
                </Button>
            </div>
          </div>
        );

      case 'failed':
        return (
           <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Analysis Failed</AlertTitle>
              <AlertDescription>
                {error || 'An unexpected error occurred.'}
                <Button variant="destructive" onClick={resetState} className="mt-4 w-full">
                  <RefreshCw className="mr-2 h-4 w-4" /> Try Again
                </Button>
              </AlertDescription>
            </Alert>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <ScanLine className="h-8 w-8 text-primary" />
          AI Food Recognition
        </h1>
        <p className="text-muted-foreground mt-1">
          Upload a food image and let our AI do the work.
        </p>
      </div>

      <div className="min-h-[400px] flex items-center justify-center">
        {renderContent()}
      </div>

      <FoodConfirmationModal
        isOpen={!!selectedFood}
        onClose={() => setSelectedFood(null)}
        foodItem={selectedFood}
      />
    </div>
  );
}

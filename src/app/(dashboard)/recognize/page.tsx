'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import {
  Upload,
  Camera,
  Loader2,
  X,
  Sparkles,
  Lightbulb,
  RotateCcw,
  ScanLine,
  Salad,
  AlertCircle,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { mockFoods, type Food } from '@/lib/data';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PortionSelectorModal } from '@/components/food/portion-selector-modal';
import { cn } from '@/lib/utils';
import { recognizeFoodImage } from '@/ai/flows/recognize-food-image';

type Status = 'idle' | 'preview' | 'analyzing' | 'results' | 'error';

interface Prediction {
  food: Food;
  confidence: number;
}

export default function AiRecognitionPage() {
  const [status, setStatus] = useState<Status>('idle');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (file: File | null) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB.');
      setStatus('error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string);
      setStatus('preview');
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    handleFileChange(file || null);
  }, []);

  const handleAnalyze = async () => {
    if (!uploadedImage) return;
    setStatus('analyzing');
    setError(null);

    try {
      const response = await recognizeFoodImage({ photoDataUri: uploadedImage });

      if (!response.identifiedFoods || response.identifiedFoods.length === 0) {
        throw new Error("The AI could not identify any food in the image. Please try a clearer picture.");
      }

      // Map AI results to the existing food database
      const mappedPredictions: Prediction[] = response.identifiedFoods
        .map(aiFood => {
          // Use a simple case-insensitive match. A more robust solution might use fuzzy searching.
          const matchedFood = mockFoods.find(mockFood =>
            mockFood.name.toLowerCase().includes(aiFood.foodName.toLowerCase()) ||
            aiFood.foodName.toLowerCase().includes(mockFood.name.toLowerCase())
          );
          
          if (matchedFood) {
            return { food: matchedFood, confidence: aiFood.confidence };
          }
          return null;
        })
        .filter((p): p is Prediction => p !== null);

      if (mappedPredictions.length === 0) {
        throw new Error(`AI identified "${response.identifiedFoods[0].foodName}", but it could not be matched to an item in our database.`);
      }

      setPredictions(mappedPredictions.sort((a, b) => b.confidence - a.confidence));
      setStatus('results');

    } catch (e: any) {
      console.error(e);
      setError(e.message || "An unexpected error occurred during analysis.");
      setStatus('error');
    }
  };
  
  const handleSelectPrediction = (food: Food) => {
      setSelectedFood(food);
      setIsModalOpen(true);
  }

  const handleReset = () => {
    setStatus('idle');
    setUploadedImage(null);
    setError(null);
    setPredictions([]);
    setSelectedFood(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  const Uploader = () => (
    <div
      className="border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center text-center min-h-[300px] cursor-pointer hover:bg-muted/50 transition-all group"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <div className="p-4 rounded-full bg-primary/10 mb-4 group-hover:scale-110 transition-transform">
        <Upload className="h-8 w-8 text-primary" />
      </div>
      <p className="text-lg font-semibold mb-2">Drag & drop or click to upload</p>
      <p className="text-sm text-muted-foreground mb-4">PNG, JPG, or WEBP. Max 5MB.</p>
      <div className="flex gap-2">
        <Badge variant="secondary" className="px-3 py-1">
          <Camera className="h-3 w-3 mr-1" /> Camera
        </Badge>
        <Badge variant="secondary" className="px-3 py-1">
          <ScanLine className="h-3 w-3 mr-1" /> Scan
        </Badge>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/png, image/jpeg, image/webp"
        onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
      />
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">AI Food Recognition</h1>
            <p className="text-muted-foreground">
              Upload a food image and let Nutrify identify it instantly. Supports common meals and local dishes.
            </p>
          </div>
        </div>
      </div>

      {/* Main Card */}
      <Card className="max-w-4xl mx-auto border-2 overflow-hidden">
        <CardHeader className="border-b bg-muted/5">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <ScanLine className="h-5 w-5 text-primary" />
                Upload Your Meal
              </CardTitle>
              <CardDescription>
                Take a photo or upload an image of your food
              </CardDescription>
            </div>
            {status !== 'idle' && status !== 'error' && (
              <Button variant="ghost" size="sm" onClick={handleReset} className="h-8">
                <RotateCcw className="h-3 w-3 mr-2" /> New Image
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          {status === 'idle' && (
            <div className="space-y-4">
              <Uploader />
              <Button 
                variant="outline" 
                className="w-full h-12 border-dashed" 
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="mr-2 h-4 w-4" /> Use Camera
              </Button>
            </div>
          )}
          
          {status === 'error' && (
            <Alert variant="destructive" className="border-destructive/50">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Analysis Error</AlertTitle>
              <AlertDescription className="flex flex-col gap-4">
                <p>{error}</p>
                <Button variant="outline" size="sm" onClick={handleReset} className="w-fit">
                  <RotateCcw className="mr-2 h-3 w-3" /> Try Again
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {status === 'preview' && uploadedImage && (
            <div className="space-y-6">
              <div className="relative w-full max-w-md mx-auto aspect-square rounded-xl overflow-hidden border-2 group">
                <Image 
                  src={uploadedImage} 
                  alt="Uploaded food" 
                  fill 
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button variant="destructive" size="icon" className="h-10 w-10" onClick={handleReset}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              <div className="flex justify-center">
                <Button size="lg" onClick={handleAnalyze} className="min-w-[200px] h-12">
                  <Sparkles className="mr-2 h-4 w-4" /> Analyze Image
                </Button>
              </div>
            </div>
          )}

          {status === 'analyzing' && (
            <div className="min-h-[400px] flex flex-col items-center justify-center text-center">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                <Loader2 className="h-16 w-16 animate-spin text-primary relative" />
              </div>
              <p className="mt-6 font-semibold text-lg">AI is analyzing your food...</p>
              <p className="text-muted-foreground">This may take a few seconds</p>
              <Progress value={45} className="w-64 mt-6" />
            </div>
          )}

          {status === 'results' && (
            <div className="space-y-6">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Image Preview Column */}
                <div className="lg:w-1/3 space-y-3">
                  <div className="relative w-full aspect-square rounded-xl overflow-hidden border-2">
                    {uploadedImage && (
                      <Image 
                        src={uploadedImage} 
                        alt="Uploaded food" 
                        fill 
                        className="object-cover"
                      />
                    )}
                  </div>
                  <Button variant="outline" className="w-full" onClick={handleReset}>
                    <RotateCcw className="mr-2 h-4 w-4" /> Try Another Image
                  </Button>
                </div>

                {/* Predictions Column */}
                <div className="lg:w-2/3 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Salad className="h-5 w-5 text-primary" />
                      Top Predictions
                    </h3>
                    <Badge variant="outline" className="px-3 py-1">
                      {predictions.length} matches
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    {predictions.map((p, index) => (
                      <Card 
                        key={p.food.id} 
                        className={cn(
                          "overflow-hidden transition-all hover:shadow-md",
                          index === 0 && "border-primary/50 bg-primary/5"
                        )}
                      >
                        <div className="flex items-center p-3 gap-4">
                          <div className="flex-grow min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold truncate">{p.food.name}</p>
                              {index === 0 && (
                                <Badge className="bg-primary text-primary-foreground">Best Match</Badge>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <Progress 
                                value={p.confidence * 100} 
                                className={cn(
                                  "h-2 w-24",
                                  index === 0 ? "[&>div]:bg-primary" : "[&>div]:bg-muted-foreground"
                                )} 
                              />
                              <span className="text-sm font-medium tabular-nums">
                                {Math.round(p.confidence * 100)}%
                              </span>
                            </div>
                          </div>
                          
                          <Button 
                            size="sm" 
                            onClick={() => handleSelectPrediction(p.food)}
                            variant={index === 0 ? "default" : "outline"}
                            className="flex-shrink-0"
                          >
                            Select
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>

                  <Alert className="border-primary/20 bg-primary/5">
                    <Lightbulb className="h-4 w-4 text-primary" />
                    <AlertTitle className="text-primary">Not the right food?</AlertTitle>
                    <AlertDescription>
                      The AI couldn't find a perfect match? You can select a different prediction or search for it manually.
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {selectedFood && (
        <PortionSelectorModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
          }}
          food={selectedFood}
        />
      )}
    </div>
  );
}

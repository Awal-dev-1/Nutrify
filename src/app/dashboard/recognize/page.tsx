'use client';

import { useState, useRef, useCallback, FC } from 'react';
import Image from 'next/image';
import {
  Upload,
  Camera,
  Loader2,
  X,
  Sparkles,
  CheckCircle,
  Lightbulb,
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


type Status = 'idle' | 'preview' | 'analyzing' | 'results' | 'error';

interface MockPrediction {
  food: Food;
  confidence: number;
}

const mockPredictions: MockPrediction[] = [
  { food: mockFoods.find(f => f.id === 'jollof-rice')!, confidence: 0.87 },
  { food: mockFoods.find(f => f.id === 'banku-and-tilapia')!, confidence: 0.65 },
  { food: mockFoods.find(f => f.id === 'kelewele')!, confidence: 0.52 },
];


export default function AiRecognitionPage() {
  const [status, setStatus] = useState<Status>('idle');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<MockPrediction[]>([]);
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

  const handleAnalyze = () => {
    setStatus('analyzing');
    setTimeout(() => {
      setPredictions(mockPredictions.sort((a, b) => b.confidence - a.confidence));
      setStatus('results');
    }, 2000);
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
  };
  
  const Uploader = () => (
      <div
        className="border-2 border-dashed border-muted-foreground/50 rounded-lg p-12 flex flex-col items-center justify-center text-center h-64 cursor-pointer hover:bg-muted/50 transition-colors"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="h-12 w-12 text-muted-foreground" />
        <p className="mt-4 font-semibold">Drag & drop or click to upload</p>
        <p className="text-sm text-muted-foreground mt-1">PNG, JPG, or WEBP. Max 5MB.</p>
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
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">AI Food Recognition</h1>
      <p className="text-muted-foreground">
        Upload a food image and let Nutrify identify it instantly. Supports common meals and local dishes.
      </p>

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Upload Your Meal</CardTitle>
        </CardHeader>
        <CardContent>
          {status === 'idle' && (
            <div className="space-y-4">
              <Uploader />
              <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
                <Camera className="mr-2" /> Use Camera
              </Button>
            </div>
          )}
          
          {status === 'error' && (
             <Alert variant="destructive">
                <AlertTitle>Upload Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
                <Button variant="link" onClick={handleReset} className="p-0 h-auto mt-2">Try again</Button>
            </Alert>
          )}

          {status === 'preview' && uploadedImage && (
            <div className="space-y-4 text-center">
              <div className="relative w-full max-w-sm mx-auto aspect-square rounded-lg overflow-hidden border">
                <Image src={uploadedImage} alt="Uploaded food" fill objectFit="cover" />
                <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={handleReset}>
                    <X className="h-4 w-4" />
                </Button>
              </div>
              <Button size="lg" onClick={handleAnalyze}>
                <Sparkles className="mr-2" /> Analyze Image
              </Button>
            </div>
          )}

          {status === 'analyzing' && (
            <div className="h-64 flex flex-col items-center justify-center text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="mt-4 font-semibold text-lg">Analyzing your food...</p>
              <p className="text-muted-foreground">The AI is working its magic.</p>
            </div>
          )}

          {status === 'results' && (
            <div className="space-y-6">
               <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div className="w-full md:w-1/3">
                         <div className="relative w-full aspect-square rounded-lg overflow-hidden border">
                             {uploadedImage && <Image src={uploadedImage} alt="Uploaded food" fill objectFit="cover" />}
                        </div>
                        <Button variant="outline" className="w-full mt-2" onClick={handleReset}>Try another image</Button>
                    </div>
                    <div className="w-full md:w-2/3 space-y-4">
                        <h3 className="text-xl font-bold">Top Predictions</h3>
                         {predictions.map((p, index) => (
                            <Card key={p.food.id} className={cn("flex items-center p-3 gap-4", index === 0 && "border-primary ring-2 ring-primary/50")}>
                               <Image src={p.food.image} alt={p.food.name} width={50} height={50} className="rounded-md object-cover" data-ai-hint={p.food.imageHint} />
                                <div className="flex-grow">
                                    <p className="font-semibold">{p.food.name}</p>
                                    <div className="flex items-center gap-2">
                                        <Progress value={p.confidence * 100} className="h-2 w-24" />
                                        <span className="text-sm font-medium text-muted-foreground">{Math.round(p.confidence * 100)}%</span>
                                    </div>
                                </div>
                                {index === 0 && <Badge>Top Match</Badge>}
                                <Button size="sm" onClick={() => handleSelectPrediction(p.food)}>Select</Button>
                            </Card>
                        ))}
                         <Alert>
                            <Lightbulb className="h-4 w-4" />
                            <AlertTitle>Not the right food?</AlertTitle>
                            <AlertDescription>You can select a different prediction or search for it manually.</AlertDescription>
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
              setIsModalOpen(false)
              handleReset()
            }}
            food={selectedFood}
          />
       )}
    </div>
  );
}

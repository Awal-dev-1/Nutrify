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
  BookOpen,
  Beef,
  Wheat,
  Droplets,
  Stethoscope,
  CookingPot
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { mockUser } from '@/lib/data';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { recognizeFoodImage, type FoodAnalysis } from '@/ai/flows/recognize-food-image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from '@/components/ui/separator';

type Status = 'idle' | 'preview' | 'analyzing' | 'results' | 'error';


export default function AiRecognitionPage() {
  const [status, setStatus] = useState<Status>('idle');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<FoodAnalysis | null>(null);
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
    setAnalysisResult(null);

    try {
      const response = await recognizeFoodImage({ 
        photoDataUri: uploadedImage,
        userGoal: mockUser.goal,
      });

      // Gatekeeper check
      if (!response.isFood) {
        const errorMessage = response.message || "The uploaded image does not appear to be food.";
        setError(errorMessage);
        setStatus('error');
        toast({
          variant: "destructive",
          title: "Not a Food Item",
          description: errorMessage,
        });
        return;
      }

      if (!response.data) {
        throw new Error("The AI could not identify any food in the image. Please try a clearer picture.");
      }

      setAnalysisResult(response.data);
      setStatus('results');

    } catch (e: any) {
      console.error(e);
      const errorMessage = e.message || "An unexpected error occurred during analysis.";
      setError(errorMessage);
      setStatus('error');
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: errorMessage,
      });
    }
  };
  
  const handleReset = () => {
    setStatus('idle');
    setUploadedImage(null);
    setError(null);
    setAnalysisResult(null);
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
      <Card className="max-w-6xl mx-auto border-2 overflow-hidden">
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
            {status !== 'idle' && (
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

          {status === 'results' && analysisResult && (
            <div className="space-y-6">
                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Left Column: Image & Core Stats */}
                    <div className="space-y-4">
                        <div className="relative w-full aspect-square rounded-xl overflow-hidden border-2">
                            {uploadedImage && <Image src={uploadedImage} alt={analysisResult.foodName} fill className="object-cover" />}
                        </div>
                        <h2 className="text-3xl font-bold">{analysisResult.foodName}</h2>
                        <div className="text-4xl font-extrabold text-primary">
                            {analysisResult.calories.toFixed(0)}{' '}
                            <span className="text-xl font-medium text-muted-foreground">kcal (estimated)</span>
                        </div>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Macronutrients</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-3 gap-4 text-center">
                                <div className="space-y-1">
                                    <div className="inline-flex p-2 rounded-full bg-red-50 dark:bg-red-950/20">
                                        <Beef className="h-5 w-5 text-red-500" />
                                    </div>
                                    <p className="text-xs text-muted-foreground">Protein</p>
                                    <p className="font-bold text-lg">{analysisResult.macronutrientBreakdown.protein.toFixed(1)}g</p>
                                </div>
                                <div className="space-y-1">
                                    <div className="inline-flex p-2 rounded-full bg-yellow-50 dark:bg-yellow-950/20">
                                        <Wheat className="h-5 w-5 text-yellow-600" />
                                    </div>
                                    <p className="text-xs text-muted-foreground">Carbs</p>
                                    <p className="font-bold text-lg">{analysisResult.macronutrientBreakdown.carbohydrates.toFixed(1)}g</p>
                                </div>
                                <div className="space-y-1">
                                    <div className="inline-flex p-2 rounded-full bg-blue-50 dark:bg-blue-950/20">
                                        <Droplets className="h-5 w-5 text-blue-500" />
                                    </div>
                                    <p className="text-xs text-muted-foreground">Fat</p>
                                    <p className="font-bold text-lg">{analysisResult.macronutrientBreakdown.fat.toFixed(1)}g</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: AI Analysis Tabs */}
                    <div className="space-y-4">
                        <Tabs defaultValue="analysis" className="w-full">
                            <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="analysis"><Stethoscope className="h-4 w-4 mr-1" />Analysis</TabsTrigger>
                                <TabsTrigger value="history"><BookOpen className="h-4 w-4 mr-1" />History</TabsTrigger>
                                <TabsTrigger value="recipes"><CookingPot className="h-4 w-4 mr-1" />Recipes</TabsTrigger>
                                <TabsTrigger value="nutrients"><Salad className="h-4 w-4 mr-1" />Nutrients</TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="analysis" className="mt-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Health Analysis</CardTitle>
                                        <CardDescription>For your goal: <span className="capitalize font-medium text-primary">{mockUser.goal.replace('-', ' ')}</span></CardDescription>
                                    </CardHeader>
                                    <CardContent className="text-sm space-y-3">
                                      <p>{analysisResult.healthAnalysis}</p>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                            
                            <TabsContent value="history" className="mt-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Cultural History</CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-sm space-y-3">
                                        <p>{analysisResult.foodHistory}</p>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                            
                            <TabsContent value="recipes" className="mt-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Recipe Ideas</CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-sm space-y-3">
                                        <ul className="list-disc list-outside pl-5 space-y-2">
                                            {analysisResult.possibleRecipes.map((recipe, i) => <li key={i}>{recipe}</li>)}
                                        </ul>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="nutrients" className="mt-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Micronutrients</CardTitle>
                                        <CardDescription>Key vitamins and minerals in this meal.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="text-sm space-y-3">
                                        <ul className="space-y-2">
                                            {analysisResult.micronutrientBreakdown.map((nutrient, i) => (
                                              <li key={i} className="flex justify-between p-2 rounded-md bg-muted/50">
                                                <span>{nutrient.split(':')[0]}</span>
                                                <span className="font-medium">{nutrient.split(':')[1]}</span>
                                              </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

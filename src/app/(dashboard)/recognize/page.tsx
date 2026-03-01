'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import {
  Upload,
  Camera,
  Loader2,
  X,
  Sparkles,
  RotateCcw,
  ScanLine,
  Salad,
  AlertCircle,
  Soup,
  CheckCircle,
  Plus,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { recognizeFoodImage, type RecognizeFoodImageOutput } from '@/ai/flows/recognize-food-image';

type Status = 'idle' | 'preview' | 'analyzing' | 'results' | 'error';


export default function AiRecognitionPage() {
  const [status, setStatus] = useState<Status>('idle');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorTitle, setErrorTitle] = useState<string>('Analysis Error');
  const [analysisResult, setAnalysisResult] = useState<RecognizeFoodImageOutput | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (file: File | null) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorTitle('Upload Error');
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
      });

      if (!response.isFood) {
        const errorMessage = response.message || "This does not appear to be a food item. Please upload a photo of food.";
        setErrorTitle("Not a Food Item");
        setError(errorMessage);
        setStatus('error');
        toast({
          variant: "destructive",
          title: "Not a Food Item",
          description: errorMessage,
        });
        return;
      }
      
      setAnalysisResult(response);
      setStatus('results');

    } catch (e: any) {
      console.error(e);
      const errorMessage = e.message || "An unexpected error occurred during analysis.";
      setErrorTitle("Analysis Failed");
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
              Upload a food image and let Nutrify identify it instantly.
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
            {status !== 'idle' && (
              <Button variant="ghost" size="sm" onClick={handleReset} className="h-8">
                <RotateCcw className="h-3 w-3 mr-2" /> New Image
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          {status === 'idle' && <Uploader />}
          
          {status === 'error' && (
            <Alert variant="destructive" className="border-destructive/50">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{errorTitle}</AlertTitle>
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

          {status === 'results' && analysisResult && analysisResult.isFood && (
            <div className="space-y-6">
                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Left Column: Image & Core Stats */}
                    <div className="space-y-4">
                        <div className="relative w-full aspect-square rounded-xl overflow-hidden border-2">
                            {uploadedImage && <Image src={uploadedImage} alt={analysisResult.itemName} fill className="object-cover" />}
                        </div>
                        <h2 className="text-3xl font-bold">{analysisResult.itemName}</h2>
                        <div className="text-4xl font-extrabold text-primary">
                            {analysisResult.calories.toFixed(0)}{' '}
                            <span className="text-xl font-medium text-muted-foreground">kcal (estimated)</span>
                        </div>
                         <Button className="w-full">
                            <Plus className="mr-2 h-4 w-4"/> Add to Daily Tracker
                        </Button>
                    </div>

                    {/* Right Column: AI Analysis */}
                    <div className="space-y-4">
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Soup className="h-5 w-5 text-primary" />
                              Ingredients
                            </CardTitle>
                            <CardDescription>Primary ingredients identified by the AI.</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <ul className="grid grid-cols-2 gap-2 text-sm">
                              {analysisResult.ingredients.map((item, i) => (
                                <li key={i} className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

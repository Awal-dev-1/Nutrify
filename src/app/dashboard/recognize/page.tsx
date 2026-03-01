'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import {
  Upload,
  Camera,
  Loader2,
  X,
  Sparkles,
  RotateCcw,
  ScanLine,
  AlertCircle,
  Lightbulb,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useUser, useFirebaseApp, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { generateScanId, uploadFoodImage, createScanDocument, runFoodRecognition } from '@/services/aiRecognitionService';
import type { AiScan } from '@/types/ai';
import { doc } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { FoodConfirmationModal } from '@/components/recognize/food-confirmation-modal';

type Status = 'idle' | 'preview' | 'uploading' | 'processing' | 'results' | 'error';
type Prediction = AiScan['predictions'][0];

// Helper to resize image client-side for faster processing
const resizeImage = (file: File, maxWidth: number): Promise<{ file: File; dataUri: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = document.createElement('img');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Could not get canvas context'));
        }
        ctx.drawImage(img, 0, 0, width, height);

        const dataUri = canvas.toDataURL(file.type);
        
        canvas.toBlob((blob) => {
          if (!blob) {
            return reject(new Error('Could not create blob from canvas'));
          }
          const newFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now(),
          });
          resolve({ file: newFile, dataUri });
        }, file.type, 0.9);
      };
      img.onerror = (err) => reject(err);
      if (event.target?.result) {
        img.src = event.target.result as string;
      } else {
        reject(new Error("FileReader did not produce a result."));
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};


export default function AiRecognitionPage() {
  const [status, setStatus] = useState<Status>('idle');
  // `uploadedImage` is the data URI for the preview
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  // `imageFile` is the resized file to be uploaded to Storage
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanId, setScanId] = useState<string | null>(null);
  const [selectedPrediction, setSelectedPrediction] = useState<Prediction | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const { user } = useUser();
  const db = useFirestore();
  const app = useFirebaseApp();

  // Real-time listener for the scan document
  const scanDocRef = useMemoFirebase(
    () => (user && scanId ? doc(db, 'users', user.uid, 'aiScans', scanId) : null),
    [user, scanId, db]
  );
  const { data: scanResult } = useDoc<AiScan>(scanDocRef);

  // Update local status based on Firestore document
  if (scanResult && status !== 'results' && status !== 'error') {
    if (scanResult.status === 'completed' || scanResult.status === 'failed') {
        if (scanResult.status === 'completed' && scanResult.predictions.length > 0) {
            setStatus('results');
        } else if (scanResult.status === 'failed') {
            setStatus('error');
            setError(scanResult.reason || 'AI processing failed or no food was identified.');
        } else {
            setStatus('error');
            setError('No strong match found. Try another image or a manual search.');
        }
    }
  }

  const handleFileChange = async (file: File | null) => {
    if (!file || !db) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB.');
      setStatus('error');
      return;
    }
    
    handleReset();
    setStatus('preview'); // Show preview immediately

    try {
      const { file: resizedFile, dataUri } = await resizeImage(file, 600);
      
      const newScanId = generateScanId(db);
      setScanId(newScanId);
  
      setUploadedImage(dataUri);
      setImageFile(resizedFile);
      setError(null);
    } catch (e: any) {
        console.error("Image resizing failed:", e);
        setError("Could not process the image. Please try a different one.");
        setStatus('error');
    }
  };

  const handleAnalyze = async () => {
    if (!imageFile || !user || !scanId || !db || !app) return;
    
    setStatus('uploading');
    setError(null);

    try {
      // 1. Upload the RESIZED image file
      const downloadURL = await uploadFoodImage(app, user.uid, scanId, imageFile);
      setStatus('processing');
      // 2. Create the doc in firestore
      await createScanDocument(db, user.uid, scanId, downloadURL);
      // 3. Run recognition with the Storage URL
      await runFoodRecognition(db, user.uid, scanId, downloadURL);
    } catch (e: any) {
      console.error(e);
      const errorMessage = e.message || 'An unexpected error occurred during analysis.';
      setError(errorMessage);
      setStatus('error');
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: errorMessage,
      });
    }
  };
  
  const handleReset = () => {
    setStatus('idle');
    setUploadedImage(null);
    setImageFile(null);
    setError(null);
    setScanId(null);
    setSelectedPrediction(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  const Uploader = () => (
    <div className='space-y-4'>
        <div
            className="border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center text-center min-h-[250px] cursor-pointer hover:bg-muted/50 transition-all group"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
                e.preventDefault();
                handleFileChange(e.dataTransfer.files?.[0] || null);
            }}
            onClick={() => fileInputRef.current?.click()}
            >
            <div className="p-4 rounded-full bg-primary/10 mb-4 group-hover:scale-110 transition-transform">
                <Upload className="h-8 w-8 text-primary" />
            </div>
            <p className="text-lg font-semibold mb-2">Drag & drop or click to upload</p>
            <p className="text-sm text-muted-foreground">PNG, JPG, or WEBP. Max 5MB.</p>
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/png, image/jpeg, image/webp"
                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
            />
        </div>
        <div className='flex gap-4'>
            <Button variant="outline" size="lg" className="flex-1" onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" /> Upload from Device
            </Button>
            <Button variant="outline" size="lg" className="flex-1">
                <Camera className="mr-2 h-4 w-4" /> Use Camera
            </Button>
        </div>
    </div>
  );

  const renderContent = () => {
    switch (status) {
      case 'idle':
        return <Uploader />;
      
      case 'error':
        return (
          <Alert variant="destructive" className="border-destructive/50">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Analysis Failed</AlertTitle>
            <AlertDescription className="flex flex-col gap-4">
              <p>{error}</p>
              <Button variant="outline" size="sm" onClick={handleReset} className="w-fit">
                <RotateCcw className="mr-2 h-3 w-3" /> Try Again
              </Button>
            </AlertDescription>
          </Alert>
        );

      case 'preview':
        return (
            <div className="space-y-6">
              <div className="relative w-full max-w-sm mx-auto aspect-square rounded-xl overflow-hidden border-2 group">
                {uploadedImage ? (
                    <Image 
                        src={uploadedImage} 
                        alt="Uploaded food" 
                        fill 
                        className="object-cover"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full bg-muted">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button variant="destructive" size="icon" className="h-10 w-10" onClick={handleReset}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              <div className="flex justify-center">
                <Button size="lg" onClick={handleAnalyze} className="min-w-[200px] h-12" disabled={!uploadedImage}>
                  <Sparkles className="mr-2 h-4 w-4" /> Analyze Image
                </Button>
              </div>
            </div>
        );

      case 'uploading':
      case 'processing':
        return (
          <div className="min-h-[400px] flex flex-col items-center justify-center text-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
              <Loader2 className="h-16 w-16 animate-spin text-primary relative" />
            </div>
            <p className="mt-6 font-semibold text-lg">
              {status === 'uploading' ? 'Uploading image...' : 'AI is analyzing your food...'}
            </p>
            <p className="text-muted-foreground">This should only take a moment.</p>
            <Progress value={status === 'uploading' ? 20 : 50} className="w-64 mt-6" />
          </div>
        );

      case 'results':
        if (!scanResult || scanResult.predictions.length === 0) {
            return (
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Analysis Complete</AlertTitle>
                    <AlertDescription>The AI could not identify a food in this image.</AlertDescription>
                </Alert>
            );
        }
        return (
            <div className="space-y-6">
                <div className="grid lg:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div className="relative w-full max-w-sm mx-auto aspect-square rounded-xl overflow-hidden border-2">
                            {scanResult.imageUrl && <Image src={scanResult.imageUrl} alt="Analyzed food" fill className="object-cover" />}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-xl font-bold">Top Predictions</h3>
                        <div className="space-y-3">
                        {scanResult.predictions.map((item, i) => (
                            <Card key={i} className={i === 0 ? "border-primary" : ""}>
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className='flex-1 pr-4'>
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold">{item.name}</p>
                                            {i === 0 && <Badge>Best Match</Badge>}
                                        </div>
                                        <p className="text-sm text-muted-foreground">Confidence: {(item.confidence * 100).toFixed(0)}%</p>
                                        <Progress value={item.confidence * 100} className="h-1 mt-2" />
                                    </div>
                                    <Button size="sm" onClick={() => setSelectedPrediction(item)}>Select</Button>
                                </CardContent>
                            </Card>
                        ))}
                        </div>
                         <Alert className="border-primary/20 bg-primary/5">
                            <Lightbulb className="h-4 w-4 text-primary" />
                            <AlertTitle className="text-primary">Not what you ate?</AlertTitle>
                            <AlertDescription>
                            Select an item to confirm its nutritional details or try searching for it manually.
                            </AlertDescription>
                        </Alert>
                    </div>
                </div>
            </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">AI Food Recognition</h1>
            <p className="text-muted-foreground">
              Upload a food image and let our AI identify it for you.
            </p>
          </div>
        </div>
      </div>

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
                <RotateCcw className="h-3 w-3 mr-2" /> New Scan
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          {renderContent()}
        </CardContent>
      </Card>
      
      <FoodConfirmationModal 
        isOpen={!!selectedPrediction}
        onClose={() => setSelectedPrediction(null)}
        foodName={selectedPrediction?.name || null}
        foodId={selectedPrediction?.foodId || null}
      />
    </div>
  );
}


'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useUser, useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Sparkles, ScanLine, AlertCircle, RefreshCw, X, Lightbulb, Camera, VideoOff } from 'lucide-react';
import { ImageUploader } from '@/components/recognize/image-uploader';
import { AiFoodResultCard } from '@/components/food/ai-food-result-card';
import { FoodConfirmationModal } from '@/components/recognize/food-confirmation-modal';
import { runAiScan } from '@/services/aiRecognitionService';
import type { AIPrediction } from '@/types/ai';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

type Status = 'idle' | 'analyzing' | 'completed' | 'failed';

export default function RecognizePage() {
  const { user, userProfile } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<AIPrediction[] | null>(null);
  const [selectedFood, setSelectedFood] = useState<AIPrediction | null>(null);
  const [viewedPrediction, setViewedPrediction] = useState<AIPrediction | null>(null);

  // New state and refs for camera
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);


  // Effect to handle file selection and create a preview URL
  useEffect(() => {
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      setIsCameraOpen(false); // Close camera when a file is selected/captured
      return () => URL.revokeObjectURL(objectUrl);
    }
    setPreview(null);
  }, [file]);
  
  // Effect to manage camera stream
  useEffect(() => {
    // This effect manages the camera stream based on isCameraOpen and facingMode.
    if (!isCameraOpen) {
      // If camera is not supposed to be open, ensure stream is stopped.
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      return;
    }

    let stream: MediaStream | null = null;

    const getCameraStream = async () => {
      try {
        // Request the stream with the environment (rear) camera.
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        setIsCameraOpen(false); // Close camera UI on error
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Could not access the camera. Please check permissions.',
        });
      }
    };

    getCameraStream();

    // Cleanup function to stop the stream when the component unmounts
    // or when the dependencies (isCameraOpen) change.
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isCameraOpen, toast]);
  
  const handleFileSelect = (selectedFile: File) => {
    resetState();
    setFile(selectedFile);
  };

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      canvas.toBlob((blob) => {
        if (blob) {
          const capturedFile = new File([blob], "capture.jpg", { type: "image/jpeg" });
          // Don't call handleFileSelect as it does a full reset.
          // Instead, reset just the analysis state and set the new file.
          // The useEffect on `file` will handle creating the preview and closing the camera.
          setStatus('idle');
          setError(null);
          setPredictions(null);
          setViewedPrediction(null);
          setFile(capturedFile);
        }
      }, 'image/jpeg', 0.95);
    }
  };

  const handleAnalyze = async () => {
    if (!file || !user || !db) return;

    setStatus('analyzing');
    setError(null);
    setPredictions(null);
    setViewedPrediction(null);

    try {
      const scanResults = await runAiScan(db, user, file, userProfile?.health?.primaryGoal);

      if (!scanResults.isFood) {
        toast({
          variant: "destructive",
          title: "Not a food item",
          description: "This does not appear to be a food item. Our AI is only meant for food items.",
        });
        resetState();
        return;
      }

      setPredictions(scanResults.predictions);
      setViewedPrediction(scanResults.predictions.length > 0 ? scanResults.predictions[0] : null);
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
    setViewedPrediction(null);
    setSelectedFood(null);
    setIsCameraOpen(false);
  };

  const renderContent = () => {
    switch (status) {
      case 'idle':
        if (isCameraOpen) {
          return (
            <div className="fixed md:relative inset-0 z-50 bg-black md:bg-transparent md:w-full md:max-w-2xl md:mx-auto">
              <div className="relative w-full h-full md:h-[70vh] md:rounded-lg overflow-hidden">
                <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                
                {/* Controls Overlay */}
                <div className="absolute inset-0 flex flex-col justify-between p-4 bg-gradient-to-t from-black/60 via-transparent to-transparent">
                    {/* Top right close button */}
                    <div className="flex justify-end">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsCameraOpen(false)}
                            className="bg-black/40 text-white hover:bg-black/60 rounded-full w-10 h-10"
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Bottom center snap button */}
                    <div className="flex items-center justify-center pb-8">
                        <button
                            onClick={handleCapture}
                            disabled={hasCameraPermission !== true}
                            className="w-16 h-16 rounded-full border-4 border-white bg-white/30 ring-4 ring-black/30 active:bg-white/50 transition"
                            aria-label="Capture image"
                        />
                    </div>
                </div>

                {hasCameraPermission === false && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white p-4 text-center">
                        <VideoOff className="h-10 w-10 mb-2" />
                        <p className="font-semibold">Camera Access Denied</p>
                        <p className="text-sm">Please enable camera permissions in your browser settings.</p>
                    </div>
                )}
              </div>
            </div>
          );
        }

        if (preview) {
          return (
            <div className='w-full max-w-2xl mx-auto'>
              <div className="space-y-4 text-center">
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="w-full h-[60vh] relative bg-black/90 rounded-md">
                      <Image
                        src={preview}
                        alt="Selected food"
                        fill
                        className="object-contain"
                      />
                    </div>
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
            </div>
          );
        }

        return (
          <div className='w-full max-w-2xl mx-auto space-y-4'>
            <ImageUploader onFileSelect={handleFileSelect} />
            {isMobile && (
              <div className="block space-y-4">
                <div className="relative flex items-center">
                  <div className="flex-grow border-t border-gray-300"></div>
                  <span className="flex-shrink mx-4 text-muted-foreground text-sm">OR</span>
                  <div className="flex-grow border-t border-gray-300"></div>
                </div>
                <Button variant="secondary" className="w-full" onClick={() => setIsCameraOpen(true)} disabled={hasCameraPermission === false}>
                    <Camera className="mr-2 h-4 w-4" /> Use Camera
                </Button>
                {hasCameraPermission === false && (
                    <Alert variant="destructive" className="mt-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Camera Disabled</AlertTitle>
                        <AlertDescription>
                            You have previously denied camera access. Please enable it in your browser settings to use this feature.
                        </AlertDescription>
                    </Alert>
                )}
              </div>
            )}
          </div>
        );

      case 'analyzing':
        return (
          <div className="w-full max-w-2xl mx-auto">
            <div className="space-y-4 text-center">
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="w-full h-[60vh] relative bg-black/90 rounded-md">
                    {preview && (
                      <Image
                        src={preview}
                        alt="Analyzing food"
                        fill
                        className="object-contain opacity-50"
                      />
                    )}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 space-y-3 bg-black/50">
                      <Loader2 className="h-12 w-12 text-primary animate-spin" />
                      <h3 className="text-xl font-semibold text-white">AI is analyzing your food...</h3>
                      <p className="text-white/80">This may take a few moments.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );
      
      case 'completed':
        if (!predictions || predictions.length === 0 || !viewedPrediction) {
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

        const otherPredictions = predictions.filter(
          (p) => p.foodName !== viewedPrediction.foodName
        );

        return (
          <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in-50">
            <AiFoodResultCard
              item={viewedPrediction}
              onAdd={setSelectedFood}
            />

            {otherPredictions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-yellow-500" />
                    Not quite right?
                  </CardTitle>
                  <CardDescription>Here are other suggestions from the AI.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {otherPredictions.map((pred) => (
                    <Button
                      key={pred.foodName}
                      variant="outline"
                      onClick={() => setViewedPrediction(pred)}
                    >
                      {pred.foodName} ({(pred.confidence * 100).toFixed(0)}%)
                    </Button>
                  ))}
                </CardContent>
              </Card>
            )}

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
      {/* This header is hidden when the camera is open on mobile */}
      <div className={cn(isCameraOpen && 'md:block hidden')}>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
          <ScanLine className="h-8 w-8 text-primary" />
          AI Food Recognition
        </h1>
        <p className="text-muted-foreground mt-1">
          Upload a food image or use your camera and let our AI do the work.
        </p>
      </div>

      <div className="min-h-[400px] flex items-center justify-center">
        {renderContent()}
      </div>
      
      <canvas ref={canvasRef} className="hidden" />

      <FoodConfirmationModal
        isOpen={!!selectedFood}
        onClose={() => setSelectedFood(null)}
        foodItem={selectedFood}
      />
    </div>
  );
}

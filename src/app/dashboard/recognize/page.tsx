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

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      setIsCameraOpen(false);
      return () => URL.revokeObjectURL(objectUrl);
    }
    setPreview(null);
  }, [file]);

  useEffect(() => {
    if (!isCameraOpen) {
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
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        setIsCameraOpen(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Could not access the camera. Please check permissions.',
        });
      }
    };

    getCameraStream();

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
          const capturedFile = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
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
          variant: 'destructive',
          title: 'Not a food item',
          description: 'This does not appear to be a food item. Our AI is only meant for food items.',
        });
        resetState();
        return;
      }

      setPredictions(scanResults.predictions);
      setViewedPrediction(scanResults.predictions.length > 0 ? scanResults.predictions[0] : null);
      setStatus('completed');
    } catch (err: any) {
      console.error('AI Scan failed:', err);
      setStatus('failed');
      setError(err.message || 'An unknown error occurred during AI analysis.');
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
      case 'idle': {
        /* ── Camera view ── */
        if (isCameraOpen) {
          return (
            // Full-screen on mobile, contained card on md+
            <div className="fixed md:relative inset-0 z-50 bg-black md:bg-transparent md:w-full md:max-w-2xl md:mx-auto">
              <div className="relative w-full h-full md:h-[70vh] md:rounded-xl overflow-hidden">
                <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />

                {/* Overlay controls */}
                <div className="absolute inset-0 flex flex-col justify-between p-4 bg-gradient-to-t from-black/60 via-transparent to-transparent">
                  {/* Close */}
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

                  {/* Shutter */}
                  <div className="flex items-center justify-center pb-8 safe-area-pb">
                    <button
                      onClick={handleCapture}
                      disabled={hasCameraPermission !== true}
                      className="w-16 h-16 rounded-full border-4 border-white bg-white/30 ring-4 ring-black/30 active:bg-white/50 transition disabled:opacity-50"
                      aria-label="Capture image"
                    />
                  </div>
                </div>

                {/* Permission denied overlay */}
                {hasCameraPermission === false && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white p-6 text-center gap-3">
                    <VideoOff className="h-10 w-10" />
                    <p className="font-semibold">Camera Access Denied</p>
                    <p className="text-sm text-white/80">
                      Please enable camera permissions in your browser settings.
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        }

        /* ── Image preview + actions ── */
        if (preview) {
          return (
            <div className="w-full max-w-2xl mx-auto space-y-4">
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  {/* Responsive height: shorter on phones, taller on md+ */}
                  <div className="relative w-full h-[45vh] sm:h-[55vh] md:h-[60vh] bg-black/90">
                    <Image
                      src={preview}
                      alt="Selected food"
                      fill
                      className="object-contain"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Stacked on mobile, inline on sm+ */}
              <div className="flex flex-col sm:flex-row justify-center gap-2">
                <Button size="lg" onClick={handleAnalyze} className="w-full sm:w-auto">
                  <Sparkles className="mr-2 h-4 w-4" /> Analyze Image
                </Button>
                <Button size="lg" variant="ghost" onClick={() => setFile(null)} className="w-full sm:w-auto">
                  <X className="mr-2 h-4 w-4" /> Change Image
                </Button>
              </div>
            </div>
          );
        }

        /* ── Upload / camera selector ── */
        return (
          <div className="w-full max-w-2xl mx-auto space-y-4">
            <ImageUploader onFileSelect={handleFileSelect} />

            {isMobile && (
              <div className="space-y-4">
                <div className="relative flex items-center">
                  <div className="flex-grow border-t border-gray-300" />
                  <span className="mx-4 shrink-0 text-muted-foreground text-sm">OR</span>
                  <div className="flex-grow border-t border-gray-300" />
                </div>

                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => setIsCameraOpen(true)}
                  disabled={hasCameraPermission === false}
                >
                  <Camera className="mr-2 h-4 w-4" /> Use Camera
                </Button>

                {hasCameraPermission === false && (
                  <Alert variant="destructive">
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
      }

      case 'analyzing': {
        return (
          <div className="w-full max-w-2xl mx-auto">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="relative w-full h-[45vh] sm:h-[55vh] md:h-[60vh] bg-black/90">
                  {preview && (
                    <Image
                      src={preview}
                      alt="Analyzing food"
                      fill
                      className="object-contain opacity-50"
                    />
                  )}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 gap-3 bg-black/50">
                    <Loader2 className="h-12 w-12 text-primary animate-spin" />
                    <h3 className="text-lg sm:text-xl font-semibold text-white">
                      AI is analyzing your food...
                    </h3>
                    <p className="text-sm sm:text-base text-white/80">This may take a few moments.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      }

      case 'completed': {
        if (!predictions || predictions.length === 0 || !viewedPrediction) {
          return (
            <Alert className="max-w-2xl mx-auto">
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

        const otherPredictions = predictions.filter(p => p.foodName !== viewedPrediction.foodName);

        return (
          <div className="w-full max-w-4xl mx-auto space-y-4 sm:space-y-6 animate-in fade-in-50">
            <AiFoodResultCard
              item={viewedPrediction}
              onAdd={setSelectedFood}
              imageUrl={preview}
            />

            {otherPredictions.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-yellow-500 shrink-0" />
                    Not quite right?
                  </CardTitle>
                  <CardDescription>Here are other suggestions from the AI.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {otherPredictions.map((pred) => (
                    <Button
                      key={pred.foodName}
                      variant="outline"
                      size="sm"
                      onClick={() => setViewedPrediction(pred)}
                      className="text-sm"
                    >
                      {pred.foodName} ({(pred.confidence * 100).toFixed(0)}%)
                    </Button>
                  ))}
                </CardContent>
              </Card>
            )}

            <div className="flex justify-center pt-2 pb-4">
              <Button variant="outline" onClick={resetState} className="w-full sm:w-auto">
                <RefreshCw className="mr-2 h-4 w-4" /> Scan a new image
              </Button>
            </div>
          </div>
        );
      }

      case 'failed': {
        return (
          <Alert variant="destructive" className="max-w-2xl mx-auto">
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
      }

      default:
        return null;
    }
  };

  return (
    // Reduced vertical padding on mobile
    <div className="space-y-4 sm:space-y-8 px-0">

      {/* Header hidden when camera open on mobile */}
      <div className={cn(isCameraOpen && 'hidden md:block')}>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2 text-primary">
          <ScanLine className="h-6 w-6 sm:h-8 sm:w-8 text-primary shrink-0" />
          AI Food Recognition
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Upload a food image or use your camera and let our AI do the work.
        </p>
      </div>

      {/* Min-height shorter on mobile so content isn't pushed way down */}
      <div className="min-h-[300px] sm:min-h-[400px] flex items-start sm:items-center justify-center">
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
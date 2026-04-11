
'use client';

import { useState, useEffect, useRef, type FC } from 'react';
import Image from 'next/image';
import { useUser, useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Loader2,
  Sparkles,
  ScanLine,
  AlertCircle,
  RefreshCw,
  X,
  Camera,
  VideoOff,
  Flashlight,
  Image as ImageIcon,
} from 'lucide-react';
import { ImageUploader } from '@/components/recognize/image-uploader';
import { FoodConfirmationModal } from '@/components/recognize/food-confirmation-modal';
import { AiFoodResultCard } from '@/components/food/ai-food-result-card';
import { runAiScan } from '@/services/aiRecognitionService';
import type { AIPrediction } from '@/types/ai';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { motion, AnimatePresence } from 'framer-motion';
import { FoodPlannerModal } from '@/components/planner/food-planner-modal';
import type { FoodItem } from '@/types/food';
import { PredictionCard } from '@/components/recognize/prediction-card';

type Status = 'idle' | 'compressing' | 'preparing' | 'analyzing' | 'completed' | 'failed';

const motionVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3, ease: 'easeInOut' }
};

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
  const [confirmedPrediction, setConfirmedPrediction] = useState<AIPrediction | null>(null);
  
  const [foodForLogging, setFoodForLogging] = useState<AIPrediction | null>(null);
  const [foodForPlanning, setFoodForPlanning] = useState<FoodItem | null>(null);

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const videoTrackRef = useRef<MediaStreamTrack | null>(null);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [isFlashAvailable, setIsFlashAvailable] = useState(false);

  useEffect(() => {
    // Hide the main dashboard header when the camera is active
    if (isCameraOpen) {
      document.documentElement.classList.add('camera-is-open');
    } else {
      document.documentElement.classList.remove('camera-is-open');
    }
    // Cleanup on unmount
    return () => {
      document.documentElement.classList.remove('camera-is-open');
    };
  }, [isCameraOpen]);
  
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
      if (videoTrackRef.current) {
        try {
          const capabilities = videoTrackRef.current.getCapabilities();
          // Attempt to turn off flash when closing camera
          if (capabilities && capabilities.torch) {
            videoTrackRef.current.applyConstraints({ advanced: [{ torch: false }] });
          }
        } catch (e) {
          console.warn("Could not ensure torch was off during cleanup:", e);
        }
        videoTrackRef.current.stop();
        videoTrackRef.current = null;
      }
      setIsFlashAvailable(false);
      setIsFlashOn(false);
      return;
    }

    let stream: MediaStream | null = null;

    const getCameraStream = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });

        const track = stream.getVideoTracks()[0];
        if (!track) {
            throw new Error("No video track found");
        }
        videoTrackRef.current = track;
        
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
              if (videoTrackRef.current) {
                try {
                  const capabilities = videoTrackRef.current.getCapabilities();
                  // Check if the 'torch' capability is supported and true
                  if (capabilities?.torch) {
                      setIsFlashAvailable(true);
                  } else {
                      setIsFlashAvailable(false);
                  }
                } catch(e) {
                  console.warn("Could not get track capabilities:", e);
                  setIsFlashAvailable(false);
                }
              }
          }
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
        stream.getTracks().forEach((track) => track.stop());
      }
      if (videoTrackRef.current) {
        videoTrackRef.current = null;
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
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const capturedFile = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
              resetState();
              setFile(capturedFile);
            }
          },
          'image/jpeg',
          0.95
        );
      }
    }
  };

  const handleFlashToggle = async () => {
    if (!videoTrackRef.current || !isFlashAvailable) return;
    try {
        const newFlashState = !isFlashOn;
        await videoTrackRef.current.applyConstraints({
            advanced: [{ torch: newFlashState }]
        });
        setIsFlashOn(newFlashState);
    } catch (e) {
        console.error('Failed to toggle flash', e);
        toast({
            variant: 'destructive',
            title: 'Flash Error',
            description: 'Could not control the flashlight.'
        });
    }
  };

  const handleAnalyze = async () => {
    if (!file || !user || !db) return;

    resetState(true); // Soft reset, keep file and preview

    try {
      const scanResults = await runAiScan(
        db,
        user,
        file,
        (newStatus) => setStatus(newStatus),
        userProfile
      );

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
      
      // If only one prediction (high confidence), confirm it immediately
      if (scanResults.predictions.length === 1) {
        setConfirmedPrediction(scanResults.predictions[0]);
      }
      
      setStatus('completed');
    } catch (err: any) {
      console.error('AI Scan failed:', err);
      setStatus('failed');
      setError(err.message || 'An unknown error occurred during AI analysis.');
    }
  };

  const resetState = (soft = false) => {
    if (!soft) {
        setFile(null);
        setPreview(null);
    }
    setStatus('idle');
    setError(null);
    setPredictions(null);
    setConfirmedPrediction(null);
    setFoodForLogging(null);
    setFoodForPlanning(null);
    setIsCameraOpen(false);
    setIsFlashOn(false);
    setIsFlashAvailable(false);
    if(videoTrackRef.current) {
        videoTrackRef.current = null;
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'idle': {
        if (isCameraOpen) {
          return (
            <motion.div key="camera" {...motionVariants} className="fixed inset-0 z-60 bg-black md:relative md:z-auto md:w-full md:max-w-2xl md:mx-auto">
              <div className="relative w-full h-full md:h-[68vh] md:rounded-2xl overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  muted
                  playsInline
                />
                  {/* Top controls */}
                  <div className="absolute top-10 left-4 right-4 flex justify-between items-center pt-safe">
                    {isMobile && isFlashAvailable ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleFlashToggle}
                        className={cn(
                          'bg-black/30 backdrop-blur-md text-white hover:bg-black/40 rounded-full w-8 h-8',
                          isFlashOn && 'bg-yellow-400 text-black hover:bg-yellow-400/90'
                        )}
                        aria-label="Toggle flash"
                      >
                        <Flashlight className="h-4 w-4" />
                      </Button>
                    ) : (
                      <div />
                    )}

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsCameraOpen(false)}
                      className="bg-black/30 backdrop-blur-md text-white hover:bg-black/40 rounded-full w-8 h-8"
                      aria-label="Close camera"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Bottom controls */}
                  <div className="absolute bottom-[calc(4rem+20px)] left-0 right-0 px-6 pb-safe">
                    <div className="flex justify-center items-center gap-8">
                       <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => fileInputRef.current?.click()}
                          className="bg-black/30 backdrop-blur-md text-white hover:bg-black/40 rounded-full w-12 h-12"
                          aria-label="Open gallery"
                        >
                          <ImageIcon className="h-6 w-6" />
                        </Button>
                        <button
                          onClick={handleCapture}
                          disabled={hasCameraPermission !== true}
                          className="w-14 h-14 rounded-full border-4 border-white bg-white/30 ring-4 ring-black/30 active:bg-white/50 transition disabled:opacity-50"
                          aria-label="Capture image"
                        />
                        <div className="w-12 h-12" /> {/* Spacer to balance flexbox */}
                    </div>
                  </div>

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
            </motion.div>
          );
        }

        if (preview) {
          return (
            <motion.div key="preview" {...motionVariants} className="w-full max-w-4xl mx-auto space-y-4">
              <Card className="overflow-hidden shadow-lg">
                <CardContent className="p-0">
                  <div className="relative w-full h-[40vh] sm:h-[50vh] md:h-[60vh] bg-black/90">
                    <Image
                      src={preview}
                      alt="Selected food"
                      fill
                      className="object-contain"
                    />
                  </div>
                </CardContent>
              </Card>
              <div className="flex flex-col sm:flex-row justify-center gap-2">
                <Button
                  size="lg"
                  onClick={handleAnalyze}
                  className="w-full sm:w-auto min-h-[44px]"
                >
                  <Sparkles className="mr-2 h-4 w-4" /> Analyze Image
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  onClick={() => resetState()}
                  className="w-full sm:w-auto min-h-[44px]"
                >
                  <X className="mr-2 h-4 w-4" /> Change Image
                </Button>
              </div>
            </motion.div>
          );
        }
        return (
          <motion.div key="uploader" {...motionVariants} className="w-full max-w-2xl mx-auto space-y-4">
            {isMobile && (
              <div className="space-y-3">
                <Button
                  variant="default"
                  className="w-full min-h-[56px] text-lg rounded-xl bg-gradient-to-r from-primary to-primary/80 shadow-lg hover:shadow-xl transition-all"
                  onClick={() => setIsCameraOpen(true)}
                  disabled={hasCameraPermission === false}
                >
                  <Camera className="mr-3 h-5 w-5" /> Use Camera
                </Button>
                {hasCameraPermission === false && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Camera Disabled</AlertTitle>
                    <AlertDescription className="text-sm">
                      You have previously denied camera access. Please enable it in your browser
                      settings.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
            <ImageUploader onFileSelect={handleFileSelect} />
          </motion.div>
        );
      }

      case 'compressing':
      case 'preparing':
      case 'analyzing': {
        const messages = {
            compressing: { title: 'Optimizing Image', subtitle: 'Making things snappy...' },
            preparing: { title: 'Preparing Analysis', subtitle: 'Connecting to the AI brain...' },
            analyzing: { title: 'Analyzing Your Meal', subtitle: 'Detecting nutrients and calories...' }
        };
        const currentMessage = messages[status];
        return (
          <motion.div
            key="analyzing"
            {...motionVariants}
            className="w-full"
          >
            <div className="w-full max-w-4xl mx-auto">
              <Card className="overflow-hidden shadow-lg border-2 border-primary/20">
                <CardContent className="p-0">
                  <div className="relative w-full h-[40vh] sm:h-[50vh] md:h-[60vh] bg-black/90">
                    {preview && (
                      <Image
                        src={preview}
                        alt="Analyzing food"
                        fill
                        className="object-contain opacity-30 blur-sm"
                      />
                    )}
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                      <div className="absolute inset-x-0 top-0 bottom-0 overflow-hidden">
                        <motion.div
                          className="absolute left-0 right-0 h-1 bg-primary/70 shadow-[0_0_15px_2px_hsl(var(--primary))]"
                          initial={{ y: '-10%' }}
                          animate={{ y: '110%' }}
                          transition={{
                            duration: 2.5,
                            repeat: Infinity,
                            repeatType: 'reverse',
                            ease: 'easeInOut',
                          }}
                        />
                      </div>
                      <div className="relative flex flex-col items-center gap-4">
                        <Loader2 className="h-10 w-10 text-primary animate-spin" />
                        <h3 className="text-xl font-medium text-white">{currentMessage.title}</h3>
                        <p className="text-sm text-white/70">{currentMessage.subtitle}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        );
      }

      case 'completed': {
        if (confirmedPrediction) {
          return (
            <motion.div
              key="confirmed"
              {...motionVariants}
              className="w-full md:max-w-4xl lg:max-w-5xl mx-auto space-y-4 sm:space-y-6"
            >
              <AiFoodResultCard
                item={confirmedPrediction}
                onAdd={() => setFoodForLogging(confirmedPrediction)}
                onAddToPlan={() => setFoodForPlanning(confirmedPrediction)}
                imageUrl={preview}
              />
              <div className="flex justify-center pb-4">
                <Button
                  variant="outline"
                  onClick={() => resetState()}
                  className="w-full sm:w-auto min-h-[44px]"
                >
                  <RefreshCw className="mr-2 h-4 w-4" /> Scan a new image
                </Button>
              </div>
            </motion.div>
          );
        }
        
        if (predictions && predictions.length > 1) {
          return (
            <motion.div
              key="multiple"
              {...motionVariants}
              className="w-full max-w-4xl mx-auto"
            >
              <Card className="text-center shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl sm:text-2xl">We're not quite sure.</CardTitle>
                  <CardDescription>Which of these looks closer to your meal?</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {predictions.map((p, i) => (
                    <PredictionCard 
                      key={`${p.foodName}-${i}`}
                      prediction={p} 
                      onSelect={() => setConfirmedPrediction(p)} 
                    />
                  ))}
                </CardContent>
                <CardFooter>
                  <Button variant="ghost" onClick={() => resetState()} className="w-full">
                    <RefreshCw className="mr-2 h-4 w-4" /> Try with a different image
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          );
        }

        return (
          <motion.div key="no-food" {...motionVariants}>
            <Alert className="max-w-4xl mx-auto">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No Food Detected</AlertTitle>
              <AlertDescription className="text-sm">
                The AI couldn't identify any food in the image. Try a clearer picture or a different angle.
                <Button
                  variant="outline"
                  onClick={() => resetState()}
                  className="mt-4 w-full min-h-[44px]"
                >
                  <RefreshCw className="mr-2 h-4 w-4" /> Try Again
                </Button>
              </AlertDescription>
            </Alert>
          </motion.div>
        );
      }

      case 'failed': {
        return (
          <motion.div key="failed" {...motionVariants}>
            <Alert variant="destructive" className="max-w-4xl mx-auto">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Analysis Failed</AlertTitle>
              <AlertDescription className="text-sm">
                {error || 'An unexpected error occurred.'}
                <Button
                  variant="destructive"
                  onClick={() => resetState()}
                  className="mt-4 w-full min-h-[44px]"
                >
                  <RefreshCw className="mr-2 h-4 w-4" /> Try Again
                </Button>
              </AlertDescription>
            </Alert>
          </motion.div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8">
      <div className={cn(isCameraOpen && 'hidden md:block')}>
        <h1 className="text-h1 font-bold tracking-tight flex items-center gap-2 text-primary">
          <ScanLine className="h-6 w-6 sm:h-7 sm:h-7 md:h-8 md:w-8 text-primary shrink-0 animate-pulse" />
          AI Food Recognition
        </h1>
        <p className="text-body text-muted-foreground mt-1">
          Upload a food image or use your camera and let our AI do the work.
        </p>
      </div>

      <div className="min-h-[280px] sm:min-h-[360px] md:min-h-[420px] flex items-start sm:items-center justify-center">
        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>
      </div>

      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

      {/* This input is triggered by the camera overlay's gallery button */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/png, image/jpeg, image/webp"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0]);
          }
        }}
      />

      <FoodConfirmationModal
        isOpen={!!foodForLogging}
        onClose={() => setFoodForLogging(null)}
        foodItem={foodForLogging}
      />
      <FoodPlannerModal
        isOpen={!!foodForPlanning}
        onClose={() => setFoodForPlanning(null)}
        foodItem={foodForPlanning}
      />
    </div>
  );
}

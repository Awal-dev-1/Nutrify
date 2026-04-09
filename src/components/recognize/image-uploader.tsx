
'use client';

import { useState, useRef, type DragEvent } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { UploadCloud, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

const MAX_FILE_SIZE_MB = 10;
const ACCEPTED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function ImageUploader({ onFileSelect, disabled }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setError(null);
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      setError(`Invalid file type. Please upload a JPG, PNG, or WEBP image.`);
      return;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`File is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }
    onFileSelect(file);
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;
    const files = e.dataTransfer.files;
    if (files && files[0]) handleFile(files[0]);
  };

  return (
    <div className="w-full space-y-3 sm:space-y-4">
      <Card
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={cn(
          'relative overflow-hidden group transition-all shadow-lg',
          'border-2 border-dashed',
          isDragging ? 'border-primary bg-primary/10' : 'border-border',
          disabled
            ? 'cursor-not-allowed bg-muted/50'
            : 'cursor-pointer hover:border-primary/50'
        )}
        onClick={() => fileInputRef.current?.click()}
      >
        <CardContent
          className={cn(
            'flex flex-col items-center justify-center w-full text-center space-y-3',
            'p-8 sm:p-10',
            'bg-background/50 backdrop-blur-sm'
          )}
        >
          <div
            className={cn(
              'p-3 sm:p-4 rounded-full bg-muted/80 transition-colors',
              isDragging && 'bg-primary/20 text-primary'
            )}
          >
            <UploadCloud className="w-7 h-7 sm:w-10 sm:h-10 text-muted-foreground" />
          </div>

          <p className="text-base sm:text-lg font-semibold leading-snug">
            Choose from Gallery
          </p>

          <p className="text-xs sm:text-sm text-muted-foreground">
            <span className="hidden sm:inline">Or drag and drop an image here</span>
          </p>
        </CardContent>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={ACCEPTED_FILE_TYPES.join(',')}
          onChange={(e) => e.target.files && handleFile(e.target.files[0])}
          disabled={disabled}
        />
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Upload Error</AlertTitle>
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}


'use client';

import {
  ref,
  uploadBytes,
  getDownloadURL,
  getStorage,
} from 'firebase/storage';
import { doc, setDoc, serverTimestamp, Firestore } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import imageCompression from 'browser-image-compression';
import { recognizeFood, type RecognizeFoodOutput } from '@/ai/flows/recognize-food-flow';
import type { AIPrediction } from '@/types/ai';
import type { User } from 'firebase/auth';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { UserProfile } from '@/firebase';

const compressImage = async (file: File): Promise<File> => {
  const options = {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  };
  try {
    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  } catch (error) {
    console.error('Image compression failed:', error);
    return file; // Return original file if compression fails
  }
};

/**
 * Saves the scan result and uploads the image in the background.
 * This function is designed to be "fire-and-forget".
 */
const saveHistoryInBackground = (
  db: Firestore,
  user: User,
  compressedFile: File,
  predictions: AIPrediction[]
) => {
  const scanId = uuidv4();
  const storage = getStorage();
  const storagePath = `ai-recognition/${user.uid}/${scanId}.jpg`;
  const storageRef = ref(storage, storagePath);
  const scanDocRef = doc(db, 'users', user.uid, 'aiScans', scanId);

  // Upload image first, then save doc with URL
  uploadBytes(storageRef, compressedFile)
    .then(uploadResult => getDownloadURL(uploadResult.ref))
    .then(imageUrl => {
      const dataToSet = {
        id: scanId,
        status: 'completed',
        imageUrl,
        predictions,
        createdAt: serverTimestamp(),
        processedAt: serverTimestamp(),
        error: null,
      };
      // Write to Firestore (non-blocking)
      setDoc(scanDocRef, dataToSet)
        .catch(error => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
              path: scanDocRef.path,
              operation: 'create',
              requestResourceData: dataToSet
          }));
        });
    })
    .catch(error => {
      // Log errors but don't block the main thread
      console.error('Failed to save AI scan history in background:', error);
    });
};

export const runAiScan = async (
  db: Firestore,
  user: User,
  file: File,
  onStatusUpdate: (status: 'compressing' | 'preparing' | 'analyzing') => void,
  userProfile?: UserProfile | null
): Promise<RecognizeFoodOutput> => {
  // First, compress the image (this is fast)
  onStatusUpdate('compressing');
  const compressedFile = await compressImage(file);

  // Convert to Data URI for the AI model
  onStatusUpdate('preparing');
  const reader = new FileReader();
  const dataUriPromise = new Promise<string>((resolve, reject) => {
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
  reader.readAsDataURL(compressedFile);
  const photoDataUri = await dataUriPromise;

  // The main blocking call: get the AI analysis
  onStatusUpdate('analyzing');
  const aiResult = await recognizeFood({
    photoDataUri,
    userProfile: userProfile ? { health: userProfile.health } : undefined,
  });

  // Now, process the result.
  if (aiResult.isFood && aiResult.predictions.length > 0) {
    // IMPORTANT: This is a "fire-and-forget" call. We do NOT await it.
    saveHistoryInBackground(db, user, compressedFile, aiResult.predictions);
  }

  // Return the result to the UI immediately.
  return aiResult;
};

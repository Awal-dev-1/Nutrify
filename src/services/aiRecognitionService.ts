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

const compressImage = async (file: File): Promise<File> => {
  const options = {
    maxSizeMB: 1,
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
const saveHistoryInBackground = async (
  db: Firestore,
  user: User,
  compressedFile: File,
  predictions: AIPrediction[]
) => {
  try {
    const scanId = uuidv4();
    const storage = getStorage();
    const storagePath = `ai-recognition/${user.uid}/${scanId}.jpg`;
    const storageRef = ref(storage, storagePath);

    // Upload image and get its URL
    const uploadResult = await uploadBytes(storageRef, compressedFile);
    const imageUrl = await getDownloadURL(uploadResult.ref);

    // Prepare the data for Firestore
    const scanDocRef = doc(db, 'users', user.uid, 'aiScans', scanId);
    const dataToSet = {
      id: scanId,
      status: 'completed',
      imageUrl,
      predictions,
      createdAt: serverTimestamp(),
      processedAt: serverTimestamp(),
      error: null,
    };
    
    // Write to Firestore (already non-blocking thanks to error emitter pattern)
    setDoc(scanDocRef, dataToSet)
      .catch(error => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: scanDocRef.path,
            operation: 'create',
            requestResourceData: dataToSet
        }));
      });
  } catch (error) {
    // We log the error but don't re-throw, as this is a background task.
    console.error('Failed to save AI scan history in background:', error);
  }
};

export const runAiScan = async (
  db: Firestore,
  user: User,
  file: File,
  userGoal?: string
): Promise<RecognizeFoodOutput> => {
  // First, compress the image (this is fast)
  const compressedFile = await compressImage(file);

  // Convert to Data URI for the AI model
  const reader = new FileReader();
  const dataUriPromise = new Promise<string>((resolve, reject) => {
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
  reader.readAsDataURL(compressedFile);
  const photoDataUri = await dataUriPromise;

  // The main blocking call: get the AI analysis
  const aiResult = await recognizeFood({ photoDataUri, userGoal });

  // Now, process the result.
  if (aiResult.isFood && aiResult.predictions.length > 0) {
    const rawPredictions = aiResult.predictions;

    // Filter and sort the predictions
    const filteredPredictions = rawPredictions
      .filter((p) => p.confidence >= 0.6)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);

    // If there are valid predictions, save the history in the background.
    if (filteredPredictions.length > 0) {
      // IMPORTANT: This is a "fire-and-forget" call. We do NOT await it.
      saveHistoryInBackground(db, user, compressedFile, filteredPredictions);
    }

    // Immediately return the filtered predictions to the UI.
    return { ...aiResult, predictions: filteredPredictions };
  }

  // If it's not food or there are no predictions, return the result immediately.
  return aiResult;
};

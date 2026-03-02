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
import { recognizeFood } from '@/ai/flows/recognize-food-flow';
import type { AIPrediction } from '@/types/ai';
import type { User } from 'firebase/auth';

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
    // If compression fails, return the original file but warn.
    // This might still cause the size limit error, but it's better than crashing.
    return file;
  }
};

/**
 * Saves the AI scan results and image to Firestore and Storage.
 * This is intended to be a "fire-and-forget" operation from the main flow.
 */
const saveScanHistory = async (
  db: Firestore,
  userId: string,
  imageFile: File, // Changed from `file` to `imageFile` for clarity
  predictions: AIPrediction[]
): Promise<void> => {
  try {
    const scanId = uuidv4();
    const storage = getStorage();

    // The image is already compressed from the calling function.
    const storagePath = `ai-recognition/${userId}/${scanId}.jpg`;
    const storageRef = ref(storage, storagePath);
    const uploadResult = await uploadBytes(storageRef, imageFile);
    const imageUrl = await getDownloadURL(uploadResult.ref);

    const scanDocRef = doc(db, 'users', userId, 'aiScans', scanId);
    await setDoc(scanDocRef, {
      id: scanId,
      status: 'completed',
      imageUrl,
      predictions,
      createdAt: serverTimestamp(),
      processedAt: serverTimestamp(),
      error: null,
    });
  } catch (error) {
    console.error('Failed to save AI scan history:', error);
    // We don't re-throw here as this is a background task.
  }
};

/**
 * Orchestrates the AI food recognition process.
 *
 * @param db - Firestore instance.
 * @param user - The authenticated Firebase user.
 * @param file - The image file to analyze.
 * @returns A promise that resolves to an array of AI predictions.
 */
export const runAiScan = async (
  db: Firestore,
  user: User,
  file: File
): Promise<AIPrediction[]> => {
  // 1. Compress the image before doing anything else to reduce payload size.
  const compressedFile = await compressImage(file);

  // 2. Convert the compressed file to a data URI for the AI flow
  const reader = new FileReader();
  const dataUriPromise = new Promise<string>((resolve, reject) => {
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
  reader.readAsDataURL(compressedFile);
  const photoDataUri = await dataUriPromise;

  // 3. Call the AI flow to get predictions
  const aiResult = await recognizeFood({ photoDataUri });
  const rawPredictions = aiResult.predictions;

  // 4. Filter and sort predictions
  const filteredPredictions = rawPredictions
    .filter((p) => p.confidence >= 0.6)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3);

  // 5. Asynchronously save the scan history without blocking the UI.
  //    Pass the compressed file to avoid re-compression.
  if (filteredPredictions.length > 0) {
    saveScanHistory(db, user.uid, compressedFile, filteredPredictions);
  }

  // 6. Return the predictions to the frontend immediately
  return filteredPredictions;
};

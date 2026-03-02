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
    return file;
  }
};

const saveScanHistory = async (
  db: Firestore,
  userId: string,
  imageFile: File,
  predictions: AIPrediction[]
): Promise<void> => {
  try {
    const scanId = uuidv4();
    const storage = getStorage();

    const storagePath = `ai-recognition/${userId}/${scanId}.jpg`;
    const storageRef = ref(storage, storagePath);
    const uploadResult = await uploadBytes(storageRef, imageFile);
    const imageUrl = await getDownloadURL(uploadResult.ref);

    const scanDocRef = doc(db, 'users', userId, 'aiScans', scanId);
    const dataToSet = {
      id: scanId,
      status: 'completed',
      imageUrl,
      predictions,
      createdAt: serverTimestamp(),
      processedAt: serverTimestamp(),
      error: null,
    };
    
    setDoc(scanDocRef, dataToSet)
      .catch(error => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: scanDocRef.path,
            operation: 'create',
            requestResourceData: dataToSet
        }));
      });

  } catch (error) {
    console.error('Failed to save AI scan history (Storage Error):', error);
  }
};

export const runAiScan = async (
  db: Firestore,
  user: User,
  file: File
): Promise<AIPrediction[]> => {
  const compressedFile = await compressImage(file);

  const reader = new FileReader();
  const dataUriPromise = new Promise<string>((resolve, reject) => {
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
  reader.readAsDataURL(compressedFile);
  const photoDataUri = await dataUriPromise;

  const aiResult = await recognizeFood({ photoDataUri });
  const rawPredictions = aiResult.predictions;

  const filteredPredictions = rawPredictions
    .filter((p) => p.confidence >= 0.6)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3);

  if (filteredPredictions.length > 0) {
    saveScanHistory(db, user.uid, compressedFile, filteredPredictions);
  }

  return filteredPredictions;
};

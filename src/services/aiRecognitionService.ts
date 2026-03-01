'use client';
import { FirebaseApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, updateDoc, Firestore, serverTimestamp, collection } from 'firebase/firestore';
import { recognizeFood } from '@/ai/flows/recognize-food-flow';

/**
 * Uploads an image to Firebase Storage for AI recognition.
 * @returns The public URL of the uploaded image.
 */
export async function uploadFoodImage(
  app: FirebaseApp,
  userId: string,
  scanId: string,
  file: File
): Promise<string> {
  const storage = getStorage(app);
  const filePath = `ai-recognition/${userId}/${scanId}.jpg`;
  const storageRef = ref(storage, filePath);
  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
}

/**
 * Creates the initial scan document in Firestore with a 'processing' status.
 */
export async function createScanDocument(
  db: Firestore,
  userId: string,
  scanId: string,
  imageUrl: string
) {
  const scanRef = doc(db, 'users', userId, 'aiScans', scanId);
  await setDoc(scanRef, {
    imageUrl,
    status: 'processing',
    predictions: [],
    selectedFoodId: null,
    createdAt: serverTimestamp(),
  });
}

/**
 * Calls the AI flow to process the image and updates the scan document with results.
 * This function replaces the backend Cloud Function for the MVP.
 */
export async function runFoodRecognition(
  db: Firestore,
  userId: string,
  scanId: string,
  imageDataUri: string
) {
  const scanRef = doc(db, 'users', userId, 'aiScans', scanId);

  try {
    const result = await recognizeFood({ imageDataUri });

    if (!result.isFood) {
        await updateDoc(scanRef, {
            status: 'failed',
            predictions: [],
            reason: 'The uploaded image was not identified as a food item.',
        });
        return;
    }

    await updateDoc(scanRef, {
      status: 'completed',
      predictions: result.predictions,
    });
  } catch (error) {
    console.error("Failed to run AI food recognition:", error);
    await updateDoc(scanRef, {
      status: 'failed',
      reason: 'The AI model failed to process the image.'
    });
  }
}


/**
 * Generates a new unique ID for a scan document.
 */
export function generateScanId(db: Firestore): string {
    // This is a client-side way to get a unique ID.
    return doc(collection(db, 'temp')).id;
}

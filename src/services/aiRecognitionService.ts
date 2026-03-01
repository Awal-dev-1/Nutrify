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
 * Orchestrates a one-step AI recognition process.
 * 1. Identify food and get nutritional info from image.
 */
export async function runFoodRecognition(
  db: Firestore,
  userId: string,
  scanId: string,
  imageUrl: string,
  userGoal?: string
) {
  const scanRef = doc(db, 'users', userId, 'aiScans', scanId);

  try {
    // Call the single, powerful recognition flow
    const result = await recognizeFood({ 
      imageUrl,
      userGoal,
    });

    if (!result.isFoodQuery || result.foodItems.length === 0) {
      throw new Error(`AI could not identify a food in the image or it was not a food item.`);
    }

    // Update Firestore with the rich data from the new flow
    await updateDoc(scanRef, {
      status: 'completed',
      predictions: result.foodItems, // Pass the full array of rich FoodItem objects
    });

  } catch (error) {
    console.error("Failed to run AI food recognition pipeline:", error);
    await updateDoc(scanRef, {
      status: 'failed',
      reason: error instanceof Error ? error.message : 'The AI model failed to process the request.'
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

'use client';
import { FirebaseApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, updateDoc, Firestore, serverTimestamp, collection } from 'firebase/firestore';
import { recognizeFood } from '@/ai/flows/recognize-food-flow';
import { searchFoods } from '@/ai/flows/search-foods-flow';

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
 * Orchestrates a two-step AI recognition process.
 * 1. Identify food name from image.
 * 2. Search for detailed nutritional info using the name.
 */
export async function runFoodRecognition(
  db: Firestore,
  userId: string,
  scanId: string,
  imageUrl: string
) {
  const scanRef = doc(db, 'users', userId, 'aiScans', scanId);

  try {
    // Step 1: Get the food name from the image
    const recognitionResult = await recognizeFood({ imageUrl });
    const foodName = recognitionResult.foodName;

    if (!foodName) {
        throw new Error("AI could not extract a food name from the image.");
    }

    // Step 2: Use the food name to get detailed nutritional data
    const searchResult = await searchFoods({ query: foodName });

    if (!searchResult.isFoodQuery || searchResult.foodItems.length === 0) {
      throw new Error(`Could not find nutritional details for "${foodName}".`);
    }

    // Update Firestore with the rich data from the search flow
    await updateDoc(scanRef, {
      status: 'completed',
      predictions: searchResult.foodItems, // Pass the array of results
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

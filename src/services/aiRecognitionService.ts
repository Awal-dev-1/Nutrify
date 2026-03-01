'use client';
import { FirebaseApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, updateDoc, Firestore, serverTimestamp, collection, getDoc } from 'firebase/firestore';
import { recognizeFood } from '@/ai/flows/recognize-food-flow';
import { searchFoods } from '@/ai/flows/search-foods-flow';
import type { UserProfile } from '@/firebase';

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
 * A two-step process to get detailed food info from an image.
 * 1. Calls a simple AI flow to get the food's name from the image.
 * 2. Calls a powerful search flow to get detailed nutritional data for that name.
 */
export async function runFoodRecognition(
  db: Firestore,
  userId: string,
  scanId: string,
  imageUrl: string
) {
  const scanRef = doc(db, 'users', userId, 'aiScans', scanId);
  const userRef = doc(db, 'users', userId);

  try {
    // Step 1: Get the name of the food from the image
    const recognitionResult = await recognizeFood({ imageUrl });

    if (!recognitionResult.isFood || !recognitionResult.foodName) {
      await updateDoc(scanRef, {
        status: 'failed',
        reason: 'AI could not identify a food item in the image.',
        predictions: [],
      });
      return;
    }
    
    // Step 2: Use the food name to get detailed information via the search flow
    const userSnap = await getDoc(userRef);
    const userProfile = userSnap.exists() ? userSnap.data() as UserProfile : null;
    const userGoal = userProfile?.health?.primaryGoal;

    const searchResult = await searchFoods({
        query: recognitionResult.foodName,
        userGoal,
    });

    if (!searchResult.isFoodQuery || searchResult.foodItems.length === 0) {
        await updateDoc(scanRef, {
            status: 'failed',
            reason: `Identified "${recognitionResult.foodName}", but could not find detailed nutritional data.`,
            predictions: [],
        });
        return;
    }

    // Step 3: Update Firestore with the rich data from the search flow
    await updateDoc(scanRef, {
      status: 'completed',
      predictions: searchResult.foodItems,
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

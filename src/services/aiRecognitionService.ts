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
 * 1. Identify the food's name from the image.
 * 2. Use that name to search for detailed nutritional info.
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
    // STEP 1: Get the food name from the image using the simple recognition flow.
    const nameResult = await recognizeFood({ imageUrl });

    if (!nameResult.isFood) {
      throw new Error('No food was detected in the image.');
    }

    // STEP 2: Use the identified name to get detailed info from the powerful search flow.
    const detailsResult = await searchFoods({
      query: nameResult.foodName,
      userGoal: userGoal,
    });

    if (!detailsResult.isFoodQuery || detailsResult.foodItems.length === 0) {
      throw new Error(`AI could not find nutritional details for "${nameResult.foodName}".`);
    }

    // Update Firestore with the rich data from the search flow
    await updateDoc(scanRef, {
      status: 'completed',
      predictions: detailsResult.foodItems, // This now contains the full FoodItem object
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

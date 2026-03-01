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
 * Calls a multimodal AI model to analyze a food image and get detailed nutritional data.
 */
export async function runFoodRecognition(
  db: Firestore,
  userId: string,
  scanId: string,
  imageUrl: string
) {
  const scanRef = doc(db, 'users', userId, 'aiScans', scanId);

  try {
    // Call the single, powerful flow to get all data
    const result = await recognizeFood({ imageUrl });

    if (!result.isFood || !result.foodItem) {
      await updateDoc(scanRef, {
        status: 'failed',
        reason: 'AI could not identify a food item in the image.',
        predictions: [],
      });
      return;
    }

    // Update Firestore with the rich data from the AI flow
    // The frontend expects `predictions` to be an array.
    await updateDoc(scanRef, {
      status: 'completed',
      predictions: [result.foodItem], // Put the single result in an array
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

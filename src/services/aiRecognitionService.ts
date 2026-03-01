'use client';
import { FirebaseApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, updateDoc, Firestore, serverTimestamp, collection, getDoc } from 'firebase/firestore';
import { recognizeFood } from '@/ai/flows/recognize-food-flow';
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
 * Calls the AI flow to identify the food and get its details, then updates the scan document.
 * This simulates a backend Cloud Function.
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
    // 1. Get user goal for personalization
    const userSnap = await getDoc(userRef);
    const userProfile = userSnap.exists() ? userSnap.data() as UserProfile : null;
    const userGoal = userProfile?.health?.primaryGoal;

    // 2. Call the AI flow
    const aiResult = await recognizeFood({ imageUrl, userGoal });

    if (!aiResult.isFood || aiResult.foodItems.length === 0) {
      await updateDoc(scanRef, {
        status: 'failed',
        reason: 'AI could not identify any food in the image.',
        predictions: [],
      });
      return;
    }

    // 3. Update Firestore with the direct AI result
    await updateDoc(scanRef, {
      status: 'completed',
      predictions: aiResult.foodItems, // Store the rich food item data directly
    });
  } catch (error) {
    console.error("Failed to run AI food recognition:", error);
    await updateDoc(scanRef, {
      status: 'failed',
      reason: error instanceof Error ? error.message : 'The AI model failed to process the image.'
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

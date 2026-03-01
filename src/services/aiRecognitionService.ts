'use client';
import { FirebaseApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, updateDoc, Firestore, serverTimestamp, collection, getDocs, query } from 'firebase/firestore';
import { recognizeFood } from '@/ai/flows/recognize-food-flow';
import type { Food } from '@/lib/data';
import type { AiScan } from '@/types/ai';

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

let allFoods: Food[] = []; // In-memory cache
async function getCachedFoods(db: Firestore): Promise<Food[]> {
  if (allFoods.length === 0) {
    const foodsQuery = query(collection(db, 'foodItems'));
    const foodsSnap = await getDocs(foodsQuery);
    allFoods = foodsSnap.docs.map(doc => ({ ...(doc.data() as Omit<Food, 'id'>), id: doc.id }));
  }
  return allFoods;
}

/**
 * Calls the AI flow to get labels, matches them against the food database, and updates the scan document.
 * This simulates a backend Cloud Function.
 */
export async function runFoodRecognition(
  db: Firestore,
  userId: string,
  scanId: string,
  imageUrl: string
) {
  const scanRef = doc(db, 'users', userId, 'aiScans', scanId);

  try {
    // 1. Get generic labels from AI
    const aiResult = await recognizeFood({ imageUrl });

    if (!aiResult.labels || aiResult.labels.length === 0) {
      await updateDoc(scanRef, {
        status: 'failed',
        reason: 'AI could not detect any food items in the image.',
      });
      return;
    }

    // 2. Get all food items from Firestore (cached)
    const foodDb = await getCachedFoods(db);

    // 3. Filter AI labels and match with food DB
    const highConfidenceLabels = aiResult.labels.filter(l => l.confidence > 0.6);
    const matches: (AiScan['predictions'][0] & { score: number })[] = [];

    for (const food of foodDb) {
      let bestScore = 0;
      const foodNameLower = food.name.toLowerCase();
      const foodTagsLower = food.tags.map(t => t.toLowerCase());

      for (const label of highConfidenceLabels) {
        const labelLower = label.label.toLowerCase();
        let currentScore = 0;
        if (foodNameLower.includes(labelLower)) {
          currentScore = label.confidence * 100; // Primary match
        } else if (foodTagsLower.some(tag => tag.includes(labelLower))) {
          currentScore = label.confidence * 50; // Secondary match on tags
        }

        if (currentScore > bestScore) {
          bestScore = currentScore;
        }
      }
      
      if (bestScore > 0) {
        matches.push({
          name: food.name,
          foodId: food.id,
          confidence: 0, // Placeholder
          score: bestScore,
        });
      }
    }

    // 4. Sort, limit, and format final predictions
    const finalPredictions = matches
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(match => ({
        name: match.name,
        foodId: match.foodId,
        confidence: Math.min(match.score / 100, 1), // Normalize score
      }));

    if (finalPredictions.length === 0) {
      await updateDoc(scanRef, {
        status: 'failed',
        predictions: [],
        reason: 'No matching food found in the database for the detected items.',
      });
      return;
    }

    // 5. Update Firestore
    await updateDoc(scanRef, {
      status: 'completed',
      predictions: finalPredictions,
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

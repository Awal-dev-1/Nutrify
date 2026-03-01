'use client';
import { FirebaseApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, updateDoc, Firestore, serverTimestamp, collection } from 'firebase/firestore';

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
 * Simulates a backend AI processing function and updates the scan document with results.
 * In a real application, this logic would live in a Cloud Function.
 */
export async function simulateBackendProcessing(
  db: Firestore,
  userId: string,
  scanId: string
) {
  const scanRef = doc(db, 'users', userId, 'aiScans', scanId);
  // Simulate AI processing time
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // In a real app, this would come from an AI service
  const mockPredictions = [
    { name: "Jollof Rice", confidence: 0.87 },
    { name: "Banku and Tilapia", confidence: 0.65 },
    { name: "Kelewele", confidence: 0.52 },
  ];

  try {
    await updateDoc(scanRef, {
      status: 'completed',
      predictions: mockPredictions,
    });
  } catch (error) {
      console.error("Failed to update scan document:", error);
      await updateDoc(scanRef, {
        status: 'failed',
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

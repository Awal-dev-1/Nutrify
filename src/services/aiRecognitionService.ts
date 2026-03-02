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

const compressImage = async (file: File): Promise<File> => {
    const options = {
      maxSizeMB: 1, // Max size in MB
      maxWidthOrHeight: 1920, // Max width or height
      useWebWorker: true,
    };
    try {
      const compressedFile = await imageCompression(file, options);
      return compressedFile;
    } catch (error) {
      console.error('Image compression failed:', error);
      return file; // Return original file if compression fails
    }
}

/**
 * Uploads an image to Firebase Storage and creates a corresponding
 * scan document in Firestore to trigger the backend AI process.
 * @param db Firestore instance
 * @param file The image file to upload.
 * @param userId The ID of the current user.
 * @returns The unique ID of the scan session.
 */
export const uploadImageAndCreateScan = async (
  db: Firestore,
  file: File,
  userId: string
): Promise<string> => {
  const scanId = uuidv4();
  const storage = getStorage();

  // 1. Compress the image
  const compressedFile = await compressImage(file);

  // 2. Upload image to Firebase Storage
  const storagePath = `ai-recognition/${userId}/${scanId}.jpg`;
  const storageRef = ref(storage, storagePath);
  const uploadResult = await uploadBytes(storageRef, compressedFile);
  const imageUrl = await getDownloadURL(uploadResult.ref);

  // 3. Create the initial scan document in Firestore
  const scanDocRef = doc(db, 'users', userId, 'aiScans', scanId);
  await setDoc(scanDocRef, {
    id: scanId,
    status: 'processing',
    imageUrl,
    predictions: [],
    createdAt: serverTimestamp(),
    error: null,
  });

  return scanId;
};

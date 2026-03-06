'use client';

import { doc, updateDoc, Firestore, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import imageCompression from 'browser-image-compression';
import { updateProfile as updateAuthProfile } from 'firebase/auth';
import type { Auth, User } from 'firebase/auth';

const compressImage = async (file: File): Promise<File> => {
  const options = {
    maxSizeMB: 2, // 2MB
    maxWidthOrHeight: 1024,
    useWebWorker: true,
  };
  try {
    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  } catch (error) {
    console.error('Image compression failed:', error);
    return file; // Return original file if compression fails
  }
};

export const updateUserProfileAndPhoto = async (
  db: Firestore,
  auth: Auth,
  displayName: string,
  imageFile: File | null
) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated.");

  let newPhotoURL: string | null = user.photoURL; // Start with the current URL

  if (imageFile) {
    const storage = getStorage();
    const compressedFile = await compressImage(imageFile);
    // Use a consistent path for profile images
    const storageRef = ref(storage, `profile-images/${user.uid}`);
    await uploadBytes(storageRef, compressedFile);
    newPhotoURL = await getDownloadURL(storageRef);
  }

  const authProfileUpdates: { displayName?: string; photoURL?: string | null } = {};
  if (displayName !== user.displayName) {
    authProfileUpdates.displayName = displayName;
  }
  if (newPhotoURL !== user.photoURL) {
    authProfileUpdates.photoURL = newPhotoURL;
  }
  
  if (Object.keys(authProfileUpdates).length > 0) {
    await updateAuthProfile(user, authProfileUpdates);
  }
  
  const userDocRef = doc(db, 'users', user.uid);
  // Prepare updates for Firestore, ensuring we don't write undefined values.
  const firestoreUpdates: Record<string, any> = {
    'updatedAt': serverTimestamp(),
  };

  if (displayName) firestoreUpdates.name = displayName;
  if (newPhotoURL) firestoreUpdates['profile.profileImageUrl'] = newPhotoURL;

  // Only update if there are changes to name or photo.
  if (Object.keys(firestoreUpdates).length > 1) {
    try {
      await updateDoc(userDocRef, firestoreUpdates);
    } catch(error) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: userDocRef.path,
        operation: 'update',
        requestResourceData: firestoreUpdates
      }));
      throw error; // Re-throw to be caught by the UI
    }
  }
};

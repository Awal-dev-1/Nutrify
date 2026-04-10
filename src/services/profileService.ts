
'use client';

import { doc, updateDoc, Firestore, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import imageCompression from 'browser-image-compression';
import { updateProfile as updateAuthProfile } from 'firebase/auth';
import type { Auth } from 'firebase/auth';

const compressImage = async (file: File): Promise<File> => {
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 800,
    useWebWorker: true,
  };
  try {
    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  } catch (error) {
    console.error('Image compression failed, using original file:', error);
    return file;
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

  const nameChanged = displayName && displayName !== user.displayName;
  const photoChanged = imageFile !== null;

  if (!nameChanged && !photoChanged) {
    return; // Nothing to update
  }

  let newPhotoURL: string | undefined = undefined;

  // Handle image upload if a file is provided.
  if (photoChanged) {
    const storage = getStorage();
    const compressedFile = await compressImage(imageFile!);
    
    // Use a consistent file path. Overwriting cleans up the old file automatically.
    const filePath = `users/${user.uid}/profile_images/profile.jpg`;
    const storageRef = ref(storage, filePath);

    const metadata = {
      contentType: imageFile!.type,
    };

    await uploadBytes(storageRef, compressedFile, metadata);
    newPhotoURL = await getDownloadURL(storageRef);
  }

  // Prepare updates for Firebase Auth profile
  const authUpdates: { displayName?: string, photoURL?: string } = {};
  if (nameChanged) authUpdates.displayName = displayName;
  if (newPhotoURL) authUpdates.photoURL = newPhotoURL;

  // Update auth profile if there are changes
  if (Object.keys(authUpdates).length > 0) {
    await updateAuthProfile(user, authUpdates);
  }

  // Prepare updates for Firestore document
  const firestoreUpdates: Record<string, any> = { 'updatedAt': serverTimestamp() };
  if (nameChanged) firestoreUpdates.name = displayName;
  if (newPhotoURL) firestoreUpdates['profile.profileImageUrl'] = newPhotoURL;

  const userDocRef = doc(db, 'users', user.uid);

  try {
    // This is a user-facing action, so we await the Firestore update
    await updateDoc(userDocRef, firestoreUpdates);
  } catch (error) {
    // If the Firestore update fails, re-throw the error for the UI to handle.
    // No need to use the errorEmitter here as this is a direct, awaited action.
    console.error("Failed to update user profile in Firestore:", error);
    throw error;
  }
};

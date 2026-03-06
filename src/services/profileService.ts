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

  const nameChanged = displayName && displayName !== user.displayName;
  const photoChanged = imageFile !== null;

  // If nothing changed, do nothing.
  if (!nameChanged && !photoChanged) {
    return;
  }

  let newPhotoURL: string | undefined = undefined;
  if (photoChanged) {
    const storage = getStorage();
    const compressedFile = await compressImage(imageFile!);
    const storageRef = ref(storage, `profile-images/${user.uid}`);
    await uploadBytes(storageRef, compressedFile);
    newPhotoURL = await getDownloadURL(storageRef);
  }

  // Update auth profile
  const authUpdates: { displayName?: string, photoURL?: string } = {};
  if (nameChanged) authUpdates.displayName = displayName;
  if (newPhotoURL) authUpdates.photoURL = newPhotoURL;
  if (Object.keys(authUpdates).length > 0) {
    await updateAuthProfile(user, authUpdates);
  }

  // Update Firestore document
  const firestoreUpdates: Record<string, any> = { 'updatedAt': serverTimestamp() };
  if (nameChanged) firestoreUpdates.name = displayName;
  if (newPhotoURL) firestoreUpdates['profile.profileImageUrl'] = newPhotoURL;

  const userDocRef = doc(db, 'users', user.uid);
  try {
    await updateDoc(userDocRef, firestoreUpdates);
  } catch (error) {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: userDocRef.path,
      operation: 'update',
      requestResourceData: firestoreUpdates,
    }));
    throw error;
  }
};

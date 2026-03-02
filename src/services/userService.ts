'use client';

import { doc, updateDoc, Firestore, serverTimestamp } from 'firebase/firestore';

/**
 * A flexible function to update fields in the user's document in Firestore.
 * It uses dot notation for updating nested fields securely.
 *
 * @param db - The Firestore instance.
 * @param userId - The ID of the user to update.
 * @param updates - An object where keys can be dot-separated paths (e.g., 'profile.name').
 */
export const updateUserDocument = async (
  db: Firestore,
  userId: string,
  updates: Record<string, any>
) => {
  // Client-side validation example
  if (updates.name && (typeof updates.name !== 'string' || updates.name.trim().length < 2)) {
    throw new Error("Display name must be at least 2 characters.");
  }

  const userRef = doc(db, 'users', userId);

  // Add the updatedAt timestamp to every update operation.
  const updatesWithTimestamp = {
    ...updates,
    updatedAt: serverTimestamp()
  };

  await updateDoc(userRef, updatesWithTimestamp);
};

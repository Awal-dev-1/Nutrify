'use client';

import { doc, updateDoc, Firestore, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export const updateUserDocument = (
  db: Firestore,
  userId: string,
  updates: Record<string, any>
) => {
  if (updates.name && (typeof updates.name !== 'string' || updates.name.trim().length < 2)) {
    throw new Error("Display name must be at least 2 characters.");
  }

  const userRef = doc(db, 'users', userId);

  const updatesWithTimestamp = {
    ...updates,
    updatedAt: serverTimestamp()
  };

  updateDoc(userRef, updatesWithTimestamp).catch(error => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: userRef.path,
        operation: 'update',
        requestResourceData: updatesWithTimestamp,
    }));
  });
};

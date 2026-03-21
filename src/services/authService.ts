
'use client';

import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  deleteUser,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, Firestore, deleteDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

// 1. Sign Up
export const signup = async (
  auth: Auth,
  db: Firestore,
  email: string,
  password: string,
  name: string
) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // This update is for Firebase Auth user profile, not Firestore
  await updateProfile(user, { displayName: name });

  const userRef = doc(db, 'users', user.uid);
  const userProfileData = {
    id: user.uid,
    name,
    email,
    onboardingCompleted: false,
    createdAt: serverTimestamp(),
  };

  try {
    // This is a critical step, so we await it to ensure it completes.
    await setDoc(userRef, userProfileData);
  } catch (error) {
    // If creating the Firestore doc fails, we should roll back the auth user creation
    // to prevent an inconsistent state (auth user exists, but no profile doc).
    await deleteUser(user).catch(deleteError => {
      // Log if the cleanup fails, but the primary error is the setDoc failure.
      console.error("Failed to cleanup auth user after signup failure:", deleteError);
    });
    
    // Bubble up the original error to the UI so it can be handled.
    // The error handler in the signup form will now catch this.
    throw error;
  }

  return user;
};

// 2. Login
export const login = async (auth: Auth, email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

// 3. Logout
export const logout = async (auth: Auth) => {
  await signOut(auth);
};

// 4. Password Reset
export const resetPassword = async (auth: Auth, email: string) => {
  await sendPasswordResetEmail(auth, email);
};

// 5. Account Deletion
export const deleteUserAccount = async (auth: Auth, db: Firestore) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("No user is currently signed in to delete.");
  }

  const userDocRef = doc(db, "users", user.uid);
  
  try {
    // First, delete the user's document from Firestore. This should be awaited.
    await deleteDoc(userDocRef);
  } catch (error) {
     // If deleting the document fails, emit a contextual error and stop.
    errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: userDocRef.path,
        operation: 'delete'
    }));
     // Re-throw the error to inform the caller that the deletion failed.
    throw new Error("Failed to delete user data from the database.");
  }

  // Once the database document is gone, delete the auth user.
  await deleteUser(user);
};

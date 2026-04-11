
'use client';

import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  deleteUser,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendEmailVerification,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  serverTimestamp,
  Firestore,
  deleteDoc,
  collection,
  query,
  getDocs,
  writeBatch,
  updateDoc,
} from 'firebase/firestore';
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

  // Send verification email
  await sendEmailVerification(user);

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

// 5. Change Password (when user is authenticated)
export const changeUserPassword = async (
  auth: Auth,
  currentPassword: string,
  newPassword: string
) => {
  const user = auth.currentUser;
  if (!user || !user.email) {
    throw new Error("No authenticated user found or user has no email.");
  }

  const credential = EmailAuthProvider.credential(user.email, currentPassword);

  // Re-authenticate before changing the password
  await reauthenticateWithCredential(user, credential);

  // If re-authentication is successful, update the password
  await updatePassword(user, newPassword);
};


// 6. Account Deletion (Refactored for Asynchronous Backend Deletion)
export const deleteUserAccount = async (auth: Auth, db: Firestore) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("No user is currently signed in to delete.");
  }
  const userId = user.uid;
  const userDocRef = doc(db, "users", userId);

  // --- Step 1: Soft Delete (Client-side) ---
  // This is a fast operation. We mark the user document for deletion.
  // A backend process (like a Firebase Cloud Function) should be triggered by this update
  // to perform the heavy data cleanup asynchronously.
  try {
    await updateDoc(userDocRef, {
      isDeleted: true,
      deletedAt: serverTimestamp(),
    });
  } catch (error: any) {
    console.error("Failed to mark user for deletion:", error);
    // If we can't even mark the user for deletion, we stop here.
    throw new Error("Could not initiate account deletion. Please try again.");
  }

  // --- Step 2: Sign Out (Client-side) ---
  // Immediately sign the user out to give them instant feedback.
  await signOut(auth);

  /*
   * --- Step 3: Asynchronous Backend Cleanup (Conceptual) ---
   *
   * The following logic should be implemented in a SECURE BACKEND ENVIRONMENT
   * (e.g., a Firebase Cloud Function triggered by the Firestore document update).
   * It is included here for architectural clarity ONLY.
   *
   * //--- Backend Cloud Function: onDeleteUser.js ---
   *
   * const functions = require('firebase-functions');
   * const admin = require('firebase-admin');
   * admin.initializeApp();
   *
   * exports.cleanupUserData = functions.firestore
   *   .document('/users/{userId}')
   *   .onUpdate(async (change, context) => {
   *     const newValue = change.after.data();
   *     const previousValue = change.before.data();
   *     const userId = context.params.userId;
   *
   *     // If the 'isDeleted' flag was just set to true, start the cleanup.
   *     if (newValue.isDeleted && !previousValue.isDeleted) {
   *       console.log(`[Backend] Starting cleanup for user: ${userId}`);
   *
   *       const db = admin.firestore();
   *       const auth = admin.auth();
   *       const bucket = admin.storage().bucket();
   *
   *       try {
   *         // 1. Delete Storage data using efficient prefix deletion
   *         await Promise.all([
   *           bucket.deleteFiles({ prefix: `users/${userId}/` }),
   *           bucket.deleteFiles({ prefix: `ai-recognition/${userId}/` })
   *         ]);
   *
   *         // 2. Delete Firestore subcollections
   *         // This requires a recursive delete helper function for Cloud Functions.
   *         const subcollections = ['dailyLogs', 'generatedRecommendations', 'aiScans', 'plannedMeals', 'recentSearches'];
   *         for (const sub of subcollections) {
   *           // Logic to recursively delete subcollection documents would go here.
   *         }
   *
   *         // 3. Delete the main user document
   *         await db.collection('users').doc(userId).delete();
   *
   *         // 4. Delete the Auth user (MUST BE LAST)
   *         await auth.deleteUser(userId);
   *
   *         console.log(`[Backend] Successfully cleaned up data for user: ${userId}`);
   *       } catch (error) {
   *         console.error(`[Backend] CRITICAL: Failed to clean up user ${userId}.`, error);
   *         // Add retry logic or flag the document for manual review.
   *         await change.after.ref.update({ deletionError: error.message });
   *       }
   *     }
   *   });
   */
};


// 8. Resend Verification Email
export const resendVerificationEmail = async (auth: Auth) => {
  const user = auth.currentUser;
  if (user) {
    await sendEmailVerification(user);
  } else {
    throw new Error("No user is currently signed in.");
  }
};

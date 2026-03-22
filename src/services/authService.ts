
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

// Helper function to delete all documents in a collection/subcollection
const deleteCollection = async (db: Firestore, collectionPath: string) => {
  const collectionRef = collection(db, collectionPath);
  const q = query(collectionRef);
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    return;
  }

  const batchSize = 500;
  for (let i = 0; i < querySnapshot.docs.length; i += batchSize) {
    const batch = writeBatch(db);
    const chunk = querySnapshot.docs.slice(i, i + batchSize);
    chunk.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  }
};


// 6. Account Deletion
export const deleteUserAccount = async (auth: Auth, db: Firestore) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("No user is currently signed in to delete.");
  }
  
  const userId = user.uid;

  // List of all user-specific subcollections to be deleted
  const subcollections = [
    'dailyLogs',
    'generatedRecommendations',
    'aiScans',
    'plannedMeals',
    'recentSearches'
  ];

  try {
    // Delete all documents in all subcollections
    for (const subcollection of subcollections) {
      const path = `users/${userId}/${subcollection}`;
      await deleteCollection(db, path);
    }

    // After subcollections are deleted, delete the main user document
    const userDocRef = doc(db, "users", userId);
    await deleteDoc(userDocRef);

  } catch (error: any) {
    const permissionError = new FirestorePermissionError({
      path: `users/${userId} and its subcollections`,
      operation: 'delete',
    });
    errorEmitter.emit('permission-error', permissionError);
    // Provide a more specific error message to the user.
    throw new Error("Failed to delete user data from the database. This could be due to a permissions issue.");
  }

  // Once all Firestore data is gone, delete the auth user.
  try {
    await deleteUser(user);
  } catch (error: any) {
    if (error.code === 'auth/requires-recent-login') {
      // This is a critical state. The data is gone but auth user remains.
      // The message must be clear and direct the user on how to complete the process.
      throw new Error('Your data has been removed, but we require re-authentication to delete your account profile. Please log out, log back in, and delete your account again to complete the process.');
    }
    // For other auth errors, the situation is also critical.
    throw new Error(`Failed to delete your authentication profile: ${error.message}. Your data has been removed, but the account could not be fully deleted. Please contact support.`);
  }
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

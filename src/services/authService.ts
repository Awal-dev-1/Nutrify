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

  // Update profile display name in Firebase Auth
  await updateProfile(user, { displayName: name });

  // Create user document in Firestore
  const userRef = doc(db, 'users', user.uid);
  await setDoc(userRef, {
    id: user.uid,
    name,
    email,
    onboardingCompleted: false,
    createdAt: serverTimestamp(),
  });

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

  // First, delete the user's document in Firestore.
  const userDocRef = doc(db, "users", user.uid);
  await deleteDoc(userDocRef);

  // Note: This client-side implementation does NOT delete subcollections
  // (like dailyLogs, aiScans, etc.). A secure, production-grade implementation
  // would use a Cloud Function to recursively delete all user data.

  // Finally, delete the user from Firebase Authentication.
  await deleteUser(user);
};

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

  await updateProfile(user, { displayName: name });

  const userRef = doc(db, 'users', user.uid);
  const userProfileData = {
    id: user.uid,
    name,
    email,
    onboardingCompleted: false,
    createdAt: serverTimestamp(),
  };

  setDoc(userRef, userProfileData).catch(error => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: userRef.path,
      operation: 'create',
      requestResourceData: userProfileData,
    }));
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

  const userDocRef = doc(db, "users", user.uid);
  
  // Non-blocking delete with contextual error
  deleteDoc(userDocRef).catch(error => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: userDocRef.path,
          operation: 'delete'
      }));
  });

  // This is an auth operation, which can be awaited as it might have its own UI flow.
  await deleteUser(user);
};

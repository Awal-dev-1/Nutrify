
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
import { getStorage, ref, listAll, deleteObject, type StorageReference } from 'firebase/storage';
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

// Helper to recursively delete all contents of a Firebase Storage folder
const deleteFolderContents = async (folderRef: StorageReference) => {
    try {
        const res = await listAll(folderRef);
        // Delete all files in the current folder
        const deleteFilePromises = res.items.map(itemRef => deleteObject(itemRef));
        await Promise.all(deleteFilePromises);
        
        // Recursively delete all subfolders
        const deleteFolderPromises = res.prefixes.map(prefixRef => deleteFolderContents(prefixRef));
        await Promise.all(deleteFolderPromises);
    } catch (error) {
        // Log and re-throw the error to ensure the calling Promise.all fails.
        console.error(`Failed to delete contents of ${folderRef.fullPath}`, error);
        throw error;
    }
};

// Helper function to delete all documents in a collection using batched writes
const deleteCollection = async (db: Firestore, collectionPath: string) => {
  const collectionRef = collection(db, collectionPath);
  const q = query(collectionRef);
  
  try {
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return;
    }

    const batchSize = 500; // Firestore batch limit
    for (let i = 0; i < querySnapshot.docs.length; i += batchSize) {
      const batch = writeBatch(db);
      const chunk = querySnapshot.docs.slice(i, i + batchSize);
      chunk.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    }
  } catch (error) {
    // Propagate the error to be caught by the main deletion function
    console.error(`Failed during batch deletion of ${collectionPath}`, error);
    throw error;
  }
};


// 6. Account Deletion (Optimized with granular error handling)
export const deleteUserAccount = async (auth: Auth, db: Firestore) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("No user is currently signed in to delete.");
  }
  
  const userId = user.uid;
  const storage = getStorage();

  // --- Step 1: Delete Storage Data ---
  try {
    // These paths must match what's used in `aiRecognitionService` and `profileService`.
    const userProfileImagesRef = ref(storage, `users/${userId}/profile_images`);
    const aiScansStorageRef = ref(storage, `ai-recognition/${userId}`);
    await Promise.all([
      deleteFolderContents(userProfileImagesRef),
      deleteFolderContents(aiScansStorageRef),
    ]);
  } catch (error: any) {
     console.error("Storage cleanup failed:", error);
     throw new Error(`Storage cleanup failed: ${error.message}. Please try again or contact support.`);
  }

  // --- Step 2: Delete Firestore Data ---
  try {
    const subcollections = [
      'dailyLogs',
      'generatedRecommendations',
      'aiScans',
      'plannedMeals',
      'recentSearches'
    ];
    await Promise.all(subcollections.map(sub => deleteCollection(db, `users/${userId}/${sub}`)));
    
    // Finally, delete the main user document
    const userDocRef = doc(db, "users", userId);
    await deleteDoc(userDocRef);
  } catch (error: any) {
    if (error.code === 'permission-denied') {
        const permissionError = new FirestorePermissionError({
          path: `users/${userId}`, // Point to the root document, as that's the source of all sub-collection permissions.
          operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
        throw new Error("Permission denied. Failed to delete user data from the database.");
    }
    console.error("Firestore data deletion failed:", error);
    throw new Error("Failed to delete user data due to a network or permission issue.");
  }

  // --- Step 3: Delete the user from Firebase Authentication ---
  try {
    await deleteUser(user);
  } catch (error: any) {
    if (error.code === 'auth/requires-recent-login') {
      throw new Error('Your data has been removed, but we require re-authentication to delete your account. Please log in again and retry deletion to complete the process.');
    }
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

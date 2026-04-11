
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'

// This function ensures Firebase is initialized only once.
const initializeFirebaseApp = (): FirebaseApp => {
  if (getApps().length === 0) {
    // This is the standard pattern for Firebase App Hosting.
    // It will automatically use the environment variables in production.
    // For local development, it falls back to your firebaseConfig object.
    try {
      return initializeApp();
    } catch (e) {
      if (process.env.NODE_ENV === "production") {
        console.warn('Automatic Firebase initialization failed. This may happen if environment variables are not set. Falling back to local config.', e);
      }
      return initializeApp(firebaseConfig);
    }
  }
  return getApp();
};

const firebaseApp = initializeFirebaseApp();
const auth = getAuth(firebaseApp);
const firestore = getFirestore(firebaseApp);

export function initializeFirebase() {
  return {
    firebaseApp,
    auth,
    firestore,
  };
}

export function getSdks() {
  return {
    firebaseApp,
    auth,
    firestore,
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';

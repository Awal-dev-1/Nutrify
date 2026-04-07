
'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, onSnapshot } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener'
import { errorEmitter, FirestorePermissionError } from '@/firebase';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  onboardingCompleted: boolean;
  profile?: {
    gender: string;
    age: number;
    heightCm: number;
    weightKg: number;
    activityLevel: string;
    profileImageUrl?: string;
  };
  health?: {
    primaryGoal: string;
    dietaryPreferences: string[];
  };
  goals?: {
    dailyCalorieGoal: number;
    proteinPercentageGoal: number;
    carbsPercentageGoal: number;
    fatPercentageGoal: number;
    ironTargetMg?: number;
    vitaminATargetMcg?: number;
    calciumTargetMg?: number;
    magnesiumTargetMg?: number;
    vitaminDTargetMcg?: number;
  };
  preferences?: {
    themePreference?: 'light' | 'dark' | 'system';
    unitPreference?: 'metric' | 'imperial';
    languagePreference?: 'en' | 'tw' | 'ew';
    reminderEnabled?: boolean;
    weeklySummaryEnabled?: boolean;
  };
  createdAt: any;
  updatedAt?: any;
}

interface UserAuthState {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

interface UserProfileState {
  userProfile: UserProfile | null;
  isProfileLoading: boolean;
  profileError: Error | null;
}

export interface FirebaseContextState {
  areServicesAvailable: boolean;
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
  userProfile: UserProfile | null;
  isProfileLoading: boolean;
  profileError: Error | null;
}

export interface FirebaseServicesAndUser {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
  userProfile: UserProfile | null;
  isProfileLoading: boolean;
  profileError: Error | null;
}

export interface UserHookResult {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
  userProfile: UserProfile | null;
  isProfileLoading: boolean;
  profileError: Error | null;
}

export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

interface FirebaseProviderProps {
    children: ReactNode;
    firebaseApp?: FirebaseApp;
    firestore?: Firestore;
    auth?: Auth;
}

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
}) => {
  const [userAuthState, setUserAuthState] = useState<UserAuthState>({
    user: null,
    isUserLoading: true,
    userError: null,
  });

  const [profileState, setProfileState] = useState<UserProfileState>({
    userProfile: null,
    isProfileLoading: true,
    profileError: null,
  });

  useEffect(() => {
    if (!auth) {
      setUserAuthState({ user: null, isUserLoading: false, userError: new Error("Auth service not provided.") });
      return;
    }

    // The listener for auth changes.
    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        setUserAuthState({ user: firebaseUser, isUserLoading: false, userError: null });
      },
      (error) => {
        console.error("FirebaseProvider: onAuthStateChanged error:", error);
        setUserAuthState({ user: null, isUserLoading: false, userError: error });
      }
    );

    // Set persistence once in the background. This should only run once.
    // We don't await this as onAuthStateChanged will report the correct auth state
    // regardless of persistence. This avoids a potential delay in initial auth state reporting.
    setPersistence(auth, browserSessionPersistence).catch((error) => {
        console.error("FirebaseProvider: setPersistence error:", error);
    });

    return () => unsubscribe();
  }, [auth]);

  const { user, isUserLoading } = userAuthState;

  useEffect(() => {
    if (!firestore) {
        setProfileState({ userProfile: null, isProfileLoading: false, profileError: new Error("Firestore not available") });
        return;
    };
    if (isUserLoading) return;

    if (user) {
        setProfileState({ userProfile: null, isProfileLoading: true, profileError: null });
        const userDocRef = doc(firestore, 'users', user.uid);
        const unsubscribe = onSnapshot(userDocRef,
            (snapshot) => {
                if (snapshot.exists()) {
                    setProfileState({
                        userProfile: { id: snapshot.id, ...snapshot.data() } as UserProfile,
                        isProfileLoading: false,
                        profileError: null,
                    });
                } else {
                    setProfileState({ userProfile: null, isProfileLoading: false, profileError: null });
                }
            },
            (error) => {
                const contextualError = new FirestorePermissionError({
                  path: userDocRef.path,
                  operation: 'get'
                });
                setProfileState({ userProfile: null, isProfileLoading: false, profileError: contextualError });
                errorEmitter.emit('permission-error', contextualError);
            }
        );
        return () => unsubscribe();
    } else {
        setProfileState({ userProfile: null, isProfileLoading: false, profileError: null });
    }
  }, [user, isUserLoading, firestore]);

  const contextValue = useMemo((): FirebaseContextState => {
    const servicesAvailable = !!(firebaseApp && firestore && auth);
    return {
      areServicesAvailable: servicesAvailable,
      firebaseApp: servicesAvailable ? firebaseApp : null,
      firestore: servicesAvailable ? firestore : null,
      auth: servicesAvailable ? auth : null,
      user: userAuthState.user,
      isUserLoading: userAuthState.isUserLoading,
      userError: userAuthState.userError,
      userProfile: profileState.userProfile,
      isProfileLoading: profileState.isProfileLoading,
      profileError: profileState.profileError,
    };
  }, [firebaseApp, firestore, auth, userAuthState, profileState]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = (): FirebaseServicesAndUser => {
  const context = useContext(FirebaseContext);

  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }

  if (!context.areServicesAvailable || !context.firebaseApp || !context.firestore || !context.auth) {
    throw new Error('Firebase core services not available. Check FirebaseProvider props.');
  }

  return {
    firebaseApp: context.firebaseApp,
    firestore: context.firestore,
    auth: context.auth,
    user: context.user,
    isUserLoading: context.isUserLoading,
    userError: context.userError,
    userProfile: context.userProfile,
    isProfileLoading: context.isProfileLoading,
    profileError: context.profileError,
  };
};

export const useAuth = (): Auth => {
  const { auth } = useFirebase();
  return auth;
};

export const useFirestore = (): Firestore => {
  const { firestore } = useFirebase();
  return firestore;
};

export const useFirebaseApp = (): FirebaseApp => {
  const { firebaseApp } = useFirebase();
  return firebaseApp;
};

type MemoFirebase <T> = T & {__memo?: boolean};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | (MemoFirebase<T>) {
  const memoized = useMemo(factory, deps);

  if(typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;

  return memoized;
}

export const useUser = (): UserHookResult => {
  const { user, isUserLoading, userError, userProfile, isProfileLoading, profileError } = useFirebase();
  return { user, isUserLoading, userError, userProfile, isProfileLoading, profileError };
};

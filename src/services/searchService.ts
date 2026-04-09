
'use client';

import {
  collection,
  addDoc,
  serverTimestamp,
  type Firestore,
  query,
  orderBy,
  limit,
  getDocs,
  writeBatch,
  doc,
  deleteDoc,
} from 'firebase/firestore';
import type { FoodItem } from '@/types/food';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const RECENTS_LIMIT = 10; // Keep only the last 10 recent searches

export const addRecentSearch = (
  db: Firestore,
  userId: string,
  foodItem: FoodItem
) => {
  const recentsColRef = collection(db, 'users', userId, 'recentSearches');
  
  const newRecentSearch = {
    foodName: foodItem.foodName,
    searchedAt: serverTimestamp(),
    calories: foodItem.calories,
    protein: foodItem.macronutrientBreakdown.protein,
    carbs: foodItem.macronutrientBreakdown.carbohydrates,
    fat: foodItem.macronutrientBreakdown.fat,
    foodData: JSON.stringify(foodItem) 
  };

  addDoc(recentsColRef, newRecentSearch).then(() => {
    // Prune old searches if the count exceeds the limit. This is fire-and-forget.
    const q = query(recentsColRef, orderBy('searchedAt', 'desc'));
    getDocs(q).then(querySnapshot => {
      if (querySnapshot.size > RECENTS_LIMIT) {
        const docsToDelete = querySnapshot.docs.slice(RECENTS_LIMIT);
        const batch = writeBatch(db);
        docsToDelete.forEach(doc => batch.delete(doc.ref));
        batch.commit().catch(error => {
           errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: recentsColRef.path,
            operation: 'delete',
          }));
        })
      }
    }).catch(error => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: recentsColRef.path,
        operation: 'list',
      }));
    })
  }).catch(error => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: recentsColRef.path,
      operation: 'create',
      requestResourceData: newRecentSearch,
    }));
  });
};

export const deleteRecentSearch = (
  db: Firestore,
  userId: string,
  searchId: string
) => {
  const searchDocRef = doc(db, 'users', userId, 'recentSearches', searchId);
  deleteDoc(searchDocRef).catch(error => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: searchDocRef.path,
      operation: 'delete',
    }));
  });
};

'use client';

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  type Firestore,
  runTransaction,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { User } from 'firebase/auth';
import type { UserProfile } from '@/firebase';

// Create Post
export const createPost = (
  db: Firestore,
  user: User,
  userProfile: UserProfile,
  title: string,
  content: string,
  tag: string
) => {
  const postsColRef = collection(db, 'community_posts');
  const newPost = {
    userId: user.uid,
    username: userProfile.name,
    userAvatar: userProfile.profile?.profileImageUrl || user.photoURL || '',
    title,
    content,
    tag,
    createdAt: serverTimestamp(),
    updatedAt: null,
    likes: [],
    dislikes: [],
  };

  addDoc(postsColRef, newPost).catch(error => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: postsColRef.path,
      operation: 'create',
      requestResourceData: newPost,
    }));
  });
};

// Update Post
export const updatePost = (
  db: Firestore,
  postId: string,
  title: string,
  content: string,
  tag: string
) => {
  const postDocRef = doc(db, 'community_posts', postId);
  const updatedData = {
    title,
    content,
    tag,
    updatedAt: serverTimestamp(),
  };

  updateDoc(postDocRef, updatedData).catch(error => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: postDocRef.path,
      operation: 'update',
      requestResourceData: updatedData,
    }));
  });
};

// Delete Post
export const deletePost = (db: Firestore, postId: string) => {
  const postDocRef = doc(db, 'community_posts', postId);
  deleteDoc(postDocRef).catch(error => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: postDocRef.path,
      operation: 'delete',
    }));
  });
};

// Toggle Like
export const toggleLike = (db: Firestore, postId: string, userId: string) => {
  const postDocRef = doc(db, 'community_posts', postId);
  
  runTransaction(db, async (transaction) => {
    const postDoc = await transaction.get(postDocRef);
    if (!postDoc.exists()) {
      throw "Document does not exist!";
    }
    
    const likes = postDoc.data().likes || [];
    const dislikes = postDoc.data().dislikes || [];
    
    if (likes.includes(userId)) {
      // User is unliking
      transaction.update(postDocRef, { likes: arrayRemove(userId) });
    } else {
      // User is liking
      transaction.update(postDocRef, { likes: arrayUnion(userId) });
      // If user had previously disliked, remove the dislike
      if (dislikes.includes(userId)) {
        transaction.update(postDocRef, { dislikes: arrayRemove(userId) });
      }
    }
  }).catch(error => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: postDocRef.path,
      operation: 'update',
      requestResourceData: { likes: '...' } // Representational data
    }));
  });
};

// Toggle Dislike
export const toggleDislike = (db: Firestore, postId: string, userId: string) => {
  const postDocRef = doc(db, 'community_posts', postId);
  
  runTransaction(db, async (transaction) => {
    const postDoc = await transaction.get(postDocRef);
    if (!postDoc.exists()) {
      throw "Document does not exist!";
    }
    
    const likes = postDoc.data().likes || [];
    const dislikes = postDoc.data().dislikes || [];

    if (dislikes.includes(userId)) {
      // User is un-disliking
      transaction.update(postDocRef, { dislikes: arrayRemove(userId) });
    } else {
      // User is disliking
      transaction.update(postDocRef, { dislikes: arrayUnion(userId) });
      // If user had previously liked, remove the like
      if (likes.includes(userId)) {
        transaction.update(postDocRef, { likes: arrayRemove(userId) });
      }
    }
  }).catch(error => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: postDocRef.path,
      operation: 'update',
      requestResourceData: { dislikes: '...' }
    }));
  });
};

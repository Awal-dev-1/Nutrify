'use client';

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  type Firestore,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { CommunityPost } from '@/types/community';
import { PlaceHolderImages } from '@/lib/placeholder-images';

type PostData = Pick<CommunityPost, 'title' | 'content' | 'tag'>;

// Create a new post
export const addPost = (db: Firestore, user: User, postData: PostData) => {
  const postsColRef = collection(db, 'community_posts');
  const newPost = {
    ...postData,
    userId: user.uid,
    username: user.displayName || 'Anonymous User',
    userAvatar: user.photoURL || `https://picsum.photos/seed/${user.uid}/40/40`,
    createdAt: serverTimestamp(),
    updatedAt: null,
  };

  addDoc(postsColRef, newPost).catch(error => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: postsColRef.path,
      operation: 'create',
      requestResourceData: newPost,
    }));
  });
};

// Post an AI-generated tip to the community, associated with the user who generated it
export const addAiGeneratedPost = (db: Firestore, userId: string, postData: PostData) => {
  const postsColRef = collection(db, 'community_posts');
  const aiAvatar = PlaceHolderImages.find(p => p.id === 'ai-coach-avatar')?.imageUrl || '';

  const newPost = {
    ...postData,
    userId: userId, // The user who triggered it, for ownership
    username: 'Nutrify AI Coach',
    userAvatar: aiAvatar,
    createdAt: serverTimestamp(),
    updatedAt: null,
    isAiPost: true, // Flag to identify AI posts
  };

  addDoc(postsColRef, newPost).catch(error => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: postsColRef.path,
      operation: 'create',
      requestResourceData: newPost,
    }));
  });
};

// Update an existing post
export const updatePost = (db: Firestore, postId: string, postData: Partial<PostData>) => {
  const postDocRef = doc(db, 'community_posts', postId);
  const dataToUpdate = {
    ...postData,
    updatedAt: serverTimestamp(),
  };

  updateDoc(postDocRef, dataToUpdate).catch(error => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: postDocRef.path,
      operation: 'update',
      requestResourceData: dataToUpdate,
    }));
  });
};

// Delete a post
export const deletePost = (db: Firestore, postId: string) => {
  const postDocRef = doc(db, 'community_posts', postId);
  deleteDoc(postDocRef).catch(error => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: postDocRef.path,
      operation: 'delete',
    }));
  });
};

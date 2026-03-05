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
import type { User } from 'firebase/auth';
import type { UserProfile } from '@/firebase';

// Create Post
export const createPost = async (
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

  await addDoc(postsColRef, newPost);
};

// Update Post
export const updatePost = async (
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

  await updateDoc(postDocRef, updatedData);
};

// Delete Post
export const deletePost = async (db: Firestore, postId: string) => {
  const postDocRef = doc(db, 'community_posts', postId);
  await deleteDoc(postDocRef);
};

// Toggle Like
export const toggleLike = async (db: Firestore, postId: string, userId: string) => {
  const postDocRef = doc(db, 'community_posts', postId);
  
  await runTransaction(db, async (transaction) => {
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
  });
};

// Toggle Dislike
export const toggleDislike = async (db: Firestore, postId: string, userId: string) => {
  const postDocRef = doc(db, 'community_posts', postId);
  
  await runTransaction(db, async (transaction) => {
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
  });
};

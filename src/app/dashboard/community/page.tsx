'use client';
import React, { useState, useMemo } from 'react';
import { Users, Loader2, AlertCircle } from 'lucide-react';
import { CreatePostForm } from '@/components/community/create-post-form';
import { CommunityFeed } from '@/components/community/community-feed';
import type { CommunityPost } from '@/types/community';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { addPost, updatePost, deletePost } from '@/services/communityService';
import { collection, query, orderBy } from 'firebase/firestore';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export default function CommunityPage() {
  const { user } = useUser();
  const db = useFirestore();

  const communityPostsQuery = useMemoFirebase(
    () => (db ? query(collection(db, 'community_posts'), orderBy('createdAt', 'desc')) : null),
    [db]
  );
  const { data: posts, isLoading, error } = useCollection<CommunityPost>(communityPostsQuery);

  const handleAddPost = (postData: Pick<CommunityPost, 'title' | 'content' | 'tag'>) => {
    if (!user || !db) return;
    addPost(db, user, postData);
  };

  const handleUpdatePost = (updatedPost: CommunityPost) => {
    if (!db) return;
    updatePost(db, updatedPost.id, {
      title: updatedPost.title,
      content: updatedPost.content,
      tag: updatedPost.tag,
    });
  };

  const handleDeletePost = (postId: string) => {
    if (!db) return;
    deletePost(db, postId);
  };

  const renderFeed = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error loading posts</AlertTitle>
          <AlertDescription>
            Could not load the community feed. Please try again later.
          </AlertDescription>
        </Alert>
      );
    }
    
    return (
      <CommunityFeed
        posts={posts || []}
        currentUserId={user?.uid || ''}
        onUpdatePost={handleUpdatePost}
        onDeletePost={handleDeletePost}
      />
    );
  };

  return (
    <div className="space-y-8">
      {/* 1. Page Header */}
      <div className="bg-card p-6 rounded-lg shadow-sm border">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10 text-primary">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{color: '#00B37E'}}>Community</h1>
            <p className="text-muted-foreground">
              Share nutrition ideas, recipes, and healthy tips with others.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Create Post Section */}
      <CreatePostForm onAddPost={handleAddPost} />

      {/* 3. Community Feed */}
      {renderFeed()}
    </div>
  );
}

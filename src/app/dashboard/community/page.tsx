'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import {
  createPost,
  updatePost,
  deletePost,
  toggleLike,
  toggleDislike,
} from '@/services/communityService';
import { useToast } from '@/hooks/use-toast';
import { CreatePostForm } from '@/components/community/CreatePostForm';
import { PostCard } from '@/components/community/PostCard';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { MessageSquare, Users, AlertCircle } from 'lucide-react';
import type { CommunityPost } from '@/types/community';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function CommunityPage() {
  const { user, userProfile } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  const [editingPost, setEditingPost] = useState<CommunityPost | null>(null);

  const postsQuery = useMemoFirebase(
    () => db ? query(collection(db, 'community_posts'), orderBy('createdAt', 'desc')) : null,
    [db]
  );
  
  const { data: postsData, isLoading, error } = useCollection<CommunityPost>(postsQuery);

  const handleCreatePost = async (data: { title: string; content: string; tag: string }) => {
    if (!user || !db || !userProfile) return;
    try {
      await createPost(db, user, userProfile, data.title, data.content, data.tag);
      toast({ title: 'Post Created!', description: 'Your post is now live on the community feed.' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error Creating Post', description: err.message });
    }
  };

  const handleUpdatePost = async (postId: string, data: { title: string; content: string; tag: string }) => {
    if (!db) return;
    try {
      await updatePost(db, postId, data.title, data.content, data.tag);
      setEditingPost(null);
      toast({ title: 'Post Updated!', description: 'Your changes have been saved.' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error Updating Post', description: err.message });
    }
  };

  const handleLike = async (postId: string) => {
    if (!user || !db) return;
    try {
      await toggleLike(db, postId, user.uid);
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not update reaction.' });
    }
  };
  
  const handleDislike = async (postId: string) => {
    if (!user || !db) return;
    try {
      await toggleDislike(db, postId, user.uid);
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not update reaction.' });
    }
  };

  const handleDelete = async (postId: string) => {
    if (!db) return;
    try {
      await deletePost(db, postId);
      toast({ title: 'Post Deleted', variant: 'destructive' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error Deleting Post', description: err.message });
    }
  };

  if (error && !isLoading) {
    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight">Community Feed</h1>
                <p className="text-muted-foreground">
                    Share ideas, recipes, and tips with other Nutrify users.
                </p>
                </div>
            </div>
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Failed to Load Feed</AlertTitle>
                <AlertDescription>{error.message}</AlertDescription>
            </Alert>
        </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Community Feed</h1>
          <p className="text-muted-foreground">
            Share ideas, recipes, and tips with other Nutrify users.
          </p>
        </div>
      </div>

      {/* Create/Edit Post Form */}
      <CreatePostForm
        onSubmit={editingPost ? (data) => handleUpdatePost(editingPost.id, data) : handleCreatePost}
        editingPost={editingPost}
        onCancelEdit={() => setEditingPost(null)}
      />

      {/* Posts Feed */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
        ) : postsData && postsData.length === 0 ? (
          <EmptyState
            icon={<MessageSquare className="h-16 w-16 text-muted-foreground" />}
            title="It's quiet in here..."
            description="Be the first one to share something with the community!"
          />
        ) : (
          postsData?.map(post => (
            <PostCard
              key={post.id}
              post={post}
              currentUser={user}
              onLike={() => handleLike(post.id)}
              onDislike={() => handleDislike(post.id)}
              onEdit={() => setEditingPost(post)}
              onDelete={() => handleDelete(post.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

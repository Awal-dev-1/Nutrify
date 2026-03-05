'use client';

import { useState, useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
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
import { MessageSquare, Users } from 'lucide-react';
import type { CommunityPost } from '@/types/community';

export default function CommunityPage() {
  const { user, userProfile } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  const [editingPost, setEditingPost] = useState<CommunityPost | null>(null);

  const postsQuery = useMemoFirebase(
    () => (db ? query(collection(db, 'community_posts')) : null),
    [db]
  );

  const { data: postsData, isLoading } = useCollection<CommunityPost>(postsQuery);

  const sortedPosts = useMemo(() => {
    if (!postsData) return [];
    // Firestore Timestamps can be null during creation before server value is set.
    return [...postsData].sort((a, b) => 
        (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)
    );
  }, [postsData]);

  const handleCreatePost = (data: { title: string; content: string; tag: string }) => {
    if (!user || !db || !userProfile) return;
    createPost(db, user, userProfile, data.title, data.content, data.tag);
    toast({ title: 'Post Created!', description: 'Your post is now live on the community feed.' });
  };

  const handleUpdatePost = (postId: string, data: { title: string; content: string; tag: string }) => {
    if (!db) return;
    updatePost(db, postId, data.title, data.content, data.tag);
    setEditingPost(null);
    toast({ title: 'Post Updated!', description: 'Your changes have been saved.' });
  };
  
  const handleLike = (postId: string) => {
    if (!user || !db) return;
    toggleLike(db, postId, user.uid);
  };
  
  const handleDislike = (postId: string) => {
    if (!user || !db) return;
    toggleDislike(db, postId, user.uid);
  };

  const handleDelete = (postId: string) => {
    if (!db) return;
    deletePost(db, postId);
    toast({ title: 'Post Deleted', variant: 'destructive' });
  };

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
        ) : sortedPosts.length === 0 ? (
          <EmptyState
            icon={<MessageSquare className="h-16 w-16 text-muted-foreground" />}
            title="It's quiet in here..."
            description="Be the first one to share something with the community!"
          />
        ) : (
          sortedPosts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              currentUser={user}
              onLike={handleLike}
              onDislike={handleDislike}
              onEdit={() => setEditingPost(post)}
              onDelete={() => handleDelete(post.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

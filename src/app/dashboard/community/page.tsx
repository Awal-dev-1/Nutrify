
'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, getDocs } from 'firebase/firestore';
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
import { MessageSquare, AlertCircle } from 'lucide-react';
import type { CommunityPost } from '@/types/community';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// To ensure we get the ID from Firestore documents
type CommunityPostWithId = CommunityPost & { id: string };

export default function CommunityPage() {
  const { user, userProfile } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  const [posts, setPosts] = useState<CommunityPostWithId[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<CommunityPostWithId | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      if (!db) {
        setIsLoading(false);
        setError("Database connection not available.");
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const postsQuery = query(collection(db, 'community_posts'));
        const querySnapshot = await getDocs(postsQuery);
        
        const postsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as CommunityPostWithId));

        // Sort posts on the client-side to avoid indexing issues
        postsData.sort((a, b) => {
          const timeA = a.createdAt?.toDate?.().getTime() || 0;
          const timeB = b.createdAt?.toDate?.().getTime() || 0;
          return timeB - timeA;
        });

        setPosts(postsData);
      } catch (err: any) {
        console.error("Failed to fetch posts:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPosts();
  }, [db]);

  const handleCreatePost = async (data: { title: string; content: string; tag: string }) => {
    if (!user || !db || !userProfile) return;
    try {
      await createPost(db, user, userProfile, data.title, data.content, data.tag);
      toast({ title: 'Post Created!', description: 'Your post is now live.' });
      // Manually trigger a refetch
      const event = new Event('refetchPosts');
      window.dispatchEvent(event);
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error Creating Post', description: err.message });
    }
  };
  
  useEffect(() => {
    const refetch = () => {
      const fetchPosts = async () => {
        if (!db) return;
        try {
          const postsQuery = query(collection(db, 'community_posts'));
          const querySnapshot = await getDocs(postsQuery);
          const postsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CommunityPostWithId));
          postsData.sort((a, b) => (b.createdAt?.toDate()?.getTime() || 0) - (a.createdAt?.toDate()?.getTime() || 0));
          setPosts(postsData);
        } catch (err) { /* already handled */ }
      };
      fetchPosts();
    };

    window.addEventListener('refetchPosts', refetch);
    return () => window.removeEventListener('refetchPosts', refetch);
  }, [db]);


  const handleUpdatePost = async (postId: string, data: { title: string; content: string; tag: string }) => {
    if (!db) return;
    try {
      await updatePost(db, postId, data.title, data.content, data.tag);
      toast({ title: 'Post Updated!', description: 'Your changes have been saved.' });
      setEditingPost(null);
      const event = new Event('refetchPosts');
      window.dispatchEvent(event);
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error Updating Post', description: err.message });
    }
  };
  
  const handleOptimisticUpdate = (postId: string, updateFn: (post: CommunityPostWithId) => CommunityPostWithId) => {
      setPosts(currentPosts => 
          currentPosts.map(p => p.id === postId ? updateFn(p) : p)
      );
  }

  const handleLike = async (postId: string) => {
    if (!user || !db) return;

    // Optimistic update
    handleOptimisticUpdate(postId, post => {
        const hasLiked = post.likes.includes(user.uid);
        const newLikes = hasLiked ? post.likes.filter(uid => uid !== user.uid) : [...post.likes, user.uid];
        const newDislikes = post.dislikes.filter(uid => uid !== user.uid);
        return { ...post, likes: newLikes, dislikes: newDislikes };
    });

    try {
      await toggleLike(db, postId, user.uid);
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not update reaction.' });
      const event = new Event('refetchPosts');
      window.dispatchEvent(event); // Revert on error
    }
  };
  
  const handleDislike = async (postId: string) => {
    if (!user || !db) return;

    // Optimistic update
     handleOptimisticUpdate(postId, post => {
        const hasDisliked = post.dislikes.includes(user.uid);
        const newDislikes = hasDisliked ? post.dislikes.filter(uid => uid !== user.uid) : [...post.dislikes, user.uid];
        const newLikes = post.likes.filter(uid => uid !== user.uid);
        return { ...post, likes: newLikes, dislikes: newDislikes };
    });

    try {
      await toggleDislike(db, postId, user.uid);
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not update reaction.' });
      const event = new Event('refetchPosts');
      window.dispatchEvent(event); // Revert on error
    }
  };

  const handleDelete = async (postId: string) => {
    if (!db) return;
    try {
      await deletePost(db, postId);
      toast({ title: 'Post Deleted', variant: 'destructive' });
      const event = new Event('refetchPosts');
      window.dispatchEvent(event); // Refetch after delete
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
                <AlertDescription>{error}</AlertDescription>
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
        ) : posts && posts.length === 0 ? (
          <EmptyState
            icon={<MessageSquare className="h-16 w-16 text-muted-foreground" />}
            title="It's quiet in here..."
            description="Be the first one to share something with the community!"
          />
        ) : (
          posts?.map(post => (
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

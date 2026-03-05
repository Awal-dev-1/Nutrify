'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { Users, Loader2, AlertCircle } from 'lucide-react';
import { CreatePostForm } from '@/components/community/create-post-form';
import { CommunityFeed } from '@/components/community/community-feed';
import type { CommunityPost } from '@/types/community';
import { useUser, useFirestore } from '@/firebase';
import { addPost, updatePost, deletePost } from '@/services/communityService';
import { collection, query, getDocs } from 'firebase/firestore';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export default function CommunityPage() {
  const { user } = useUser();
  const db = useFirestore();

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = async () => {
    if (!db || !user) return;
    
    // Set loading to true only if it's the initial load
    if (posts.length === 0) {
        setIsLoading(true);
    }
    setError(null);
    try {
      const postsQuery = query(collection(db, 'community_posts'));
      const querySnapshot = await getDocs(postsQuery);
      const fetchedPosts = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as CommunityPost[];
      setPosts(fetchedPosts);
    } catch (e: any) {
      console.error("Error fetching posts:", e);
      setError("Could not load community feed. Please check your permissions and try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch posts once on component mount
  useEffect(() => {
    fetchPosts();
  }, [db, user]);

  const handleAddPost = (postData: Pick<CommunityPost, 'title' | 'content' | 'tag'>) => {
    if (!user || !db) return;
    addPost(db, user, postData);
    // Refetch posts after a short delay to allow Firestore to process the write
    setTimeout(() => {
      fetchPosts();
    }, 1000);
  };

  const handleUpdatePost = (updatedPost: CommunityPost) => {
    if (!db) return;
    updatePost(db, updatedPost.id, {
      title: updatedPost.title,
      content: updatedPost.content,
      tag: updatedPost.tag,
    });
    // Optimistically update the UI
    setPosts(prevPosts => prevPosts.map(p => p.id === updatedPost.id ? { ...p, ...updatedPost} : p));
  };

  const handleDeletePost = (postId: string) => {
    if (!db) return;
    deletePost(db, postId);
    // Optimistically update the UI
    setPosts(prevPosts => prevPosts.filter(p => p.id !== postId));
  };

  const sortedPosts = useMemo(() => {
    return [...posts].sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
      return dateB.getTime() - dateA.getTime();
    });
  }, [posts]);

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
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      );
    }
    
    return (
      <CommunityFeed
        posts={sortedPosts}
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

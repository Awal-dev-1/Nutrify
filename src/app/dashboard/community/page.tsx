'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { Users, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { CreatePostForm } from '@/components/community/create-post-form';
import { CommunityFeed } from '@/components/community/community-feed';
import type { CommunityPost } from '@/types/community';
import { useUser, useFirestore } from '@/firebase';
import { addPost, updatePost, deletePost, addAiGeneratedPost } from '@/services/communityService';
import { collection, query, getDocs } from 'firebase/firestore';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { generateCommunityPost } from '@/ai/flows/generate-community-post';

export default function CommunityPage() {
  const { user } = useUser();
  const db = useFirestore();

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = async () => {
    if (!db || !user) {
        setIsLoading(false);
        return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      const postsQuery = query(collection(db, 'community_posts'));
      const querySnapshot = await getDocs(postsQuery);
      const fetchedPosts = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as CommunityPost[];
      
      const sorted = [...fetchedPosts].sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
      setPosts(sorted);
    } catch (e: any) {
      console.error("Error fetching posts:", e);
      if (e.code === 'permission-denied') {
        setError("Could not load community feed. Please check your permissions and try again later.");
      } else {
        setError(e.message || "An unknown error occurred while fetching posts.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (db && user) {
        fetchPosts();
    } else {
        setIsLoading(false);
    }
  }, [db, user]);

  const handleAddPost = (postData: Pick<CommunityPost, 'title' | 'content' | 'tag'>) => {
    if (!user || !db) return;
    addPost(db, user, postData);
    setTimeout(() => {
      fetchPosts();
    }, 1000);
  };

  const handleGenerateAiPost = async () => {
    if (!user || !db) return;
    setIsGenerating(true);
    setError(null);
    try {
      const aiPostData = await generateCommunityPost();
      addAiGeneratedPost(db, user.uid, aiPostData);
      setTimeout(() => fetchPosts(), 1000);
    } catch (e: any) {
      console.error("Error generating AI post:", e);
      setError("Failed to generate an AI tip. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdatePost = (updatedPost: CommunityPost) => {
    if (!db) return;
    updatePost(db, updatedPost.id, {
      title: updatedPost.title,
      content: updatedPost.content,
      tag: updatedPost.tag,
    });
    setPosts(prevPosts => prevPosts.map(p => p.id === updatedPost.id ? { ...p, ...updatedPost} : p));
  };

  const handleDeletePost = (postId: string) => {
    if (!db) return;
    deletePost(db, postId);
    setPosts(prevPosts => prevPosts.filter(p => p.id !== postId));
  };

  const renderFeed = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      );
    }

    if (error && posts.length === 0) {
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
        posts={posts}
        currentUserId={user?.uid || ''}
        onUpdatePost={handleUpdatePost}
        onDeletePost={handleDeletePost}
      />
    );
  };

  return (
    <div className="space-y-8">
      <div className="bg-card p-6 rounded-lg shadow-sm border">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
          <Button onClick={handleGenerateAiPost} disabled={isGenerating}>
            {isGenerating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Generate AI Tip
          </Button>
        </div>
      </div>

      {error && !isLoading && (
        <Alert variant="destructive">
          <AlertTitle>An error occurred</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <CreatePostForm onAddPost={handleAddPost} />
      
      {renderFeed()}
    </div>
  );
}

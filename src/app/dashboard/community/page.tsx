'use client';
import React, { useState } from 'react';
import { Users } from 'lucide-react';
import { CreatePostForm } from '@/components/community/create-post-form';
import { CommunityFeed } from '@/components/community/community-feed';
import type { CommunityPost } from '@/types/community';
import { useUser } from '@/firebase';

// Mock data for initial state
const initialPosts: CommunityPost[] = [
  {
    id: '1',
    userId: 'user-2',
    username: 'Ama Serwaa',
    userAvatarUrl: 'https://picsum.photos/seed/ama/40/40',
    title: 'My Favorite Low-Calorie Banku Recipe!',
    content: 'I found a great way to make Banku with less corn dough and more cassava dough. It feels lighter and is great for weight management. I pair it with grilled tilapia and a simple pepper sauce. So delicious and guilt-free!',
    tag: 'Recipe',
    createdAt: new Date(Date.now() - 3600000 * 2), // 2 hours ago
  },
  {
    id: '2',
    userId: 'user-1', // This will match the mock current user
    username: 'Kofi Mensah',
    userAvatarUrl: 'https://picsum.photos/seed/kofi/40/40',
    title: 'Morning Walk Benefits',
    content: 'Just a reminder to everyone: a simple 30-minute walk in the morning can do wonders. It boosts your metabolism, improves your mood, and sets a positive tone for the whole day. You don\'t need a gym to stay active!',
    tag: 'Fitness',
    createdAt: new Date(Date.now() - 3600000 * 5), // 5 hours ago
  },
];

export default function CommunityPage() {
  const { user } = useUser();
  const [posts, setPosts] = useState<CommunityPost[]>(initialPosts);
  
  // A mock user ID until full auth is wired up
  const currentUserId = user?.uid || 'user-1';

  const addPost = (post: Omit<CommunityPost, 'id' | 'createdAt' | 'userId' | 'username' | 'userAvatarUrl'>) => {
    const newPost: CommunityPost = {
      id: new Date().toISOString(),
      userId: currentUserId,
      username: user?.displayName || 'Kofi Mensah',
      userAvatarUrl: user?.photoURL || 'https://picsum.photos/seed/kofi/40/40',
      ...post,
      createdAt: new Date(),
    };
    setPosts(prevPosts => [newPost, ...prevPosts]);
  };

  const updatePost = (updatedPost: CommunityPost) => {
    setPosts(posts.map(p => (p.id === updatedPost.id ? updatedPost : p)));
  };

  const deletePost = (postId: string) => {
    setPosts(posts.filter(p => p.id !== postId));
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
      <CreatePostForm onAddPost={addPost} />

      {/* 3. Community Feed */}
      <CommunityFeed
        posts={posts}
        currentUserId={currentUserId}
        onUpdatePost={updatePost}
        onDeletePost={deletePost}
      />
    </div>
  );
}

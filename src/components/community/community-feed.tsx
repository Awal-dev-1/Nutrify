'use client';
import { CommunityPost } from '@/types/community';
import { PostCard } from './post-card';
import { EditPostModal } from './edit-post-modal';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageSquareOff } from 'lucide-react';

interface CommunityFeedProps {
  posts: CommunityPost[];
  currentUserId: string;
  onUpdatePost: (post: CommunityPost) => void;
  onDeletePost: (postId: string) => void;
}

export function CommunityFeed({ posts, currentUserId, onUpdatePost, onDeletePost }: CommunityFeedProps) {
  const [editingPost, setEditingPost] = useState<CommunityPost | null>(null);

  if (posts.length === 0) {
    return (
      <div className="text-center py-16 border-2 border-dashed rounded-lg">
        <MessageSquareOff className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No ideas shared yet.</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Be the first to share a healthy tip with the community!
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatePresence>
          {posts.map((post) => (
            <motion.div
              key={post.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <PostCard
                post={post}
                isOwner={post.userId === currentUserId}
                onEdit={() => setEditingPost(post)}
                onDelete={() => onDeletePost(post.id)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <EditPostModal
        post={editingPost}
        isOpen={!!editingPost}
        onClose={() => setEditingPost(null)}
        onSave={(updatedPost) => {
          onUpdatePost(updatedPost);
          setEditingPost(null);
        }}
      />
    </>
  );
}

'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Edit,
  Trash2,
  MoreVertical,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { formatDistanceToNow } from 'date-fns';
import type { CommunityPost } from '@/types/community';
import type { User } from 'firebase/auth';

interface PostCardProps {
  post: CommunityPost;
  currentUser: User | null;
  onLike: (postId: string) => void;
  onDislike: (postId: string) => void;
  onEdit: (postId: string) => void;
  onDelete: (postId: string) => void;
}

export function PostCard({ post, currentUser, onLike, onDislike, onEdit, onDelete }: PostCardProps) {
  const isOwner = currentUser?.uid === post.userId;
  const hasLiked = post.likes.includes(currentUser?.uid || '');
  const hasDisliked = post.dislikes.includes(currentUser?.uid || '');

  const timeAgo = post.createdAt ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true }) : 'just now';
  const lastUpdated = post.updatedAt ? formatDistanceToNow(post.updatedAt.toDate(), { addSuffix: true }) : null;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarImage src={post.userAvatar} alt={post.username} />
              <AvatarFallback>{post.username.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{post.username}</CardTitle>
              <CardDescription className="flex items-center gap-2 text-xs">
                <span>{timeAgo}</span>
                {post.updatedAt && (
                    <>
                    <span>&bull;</span>
                    <span className="italic">edited {lastUpdated}</span>
                    </>
                )}
              </CardDescription>
            </div>
          </div>
          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(post.id)}>
                  <Edit className="mr-2 h-4 w-4" />
                  <span>Edit</span>
                </DropdownMenuItem>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>Delete</span>
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete your post. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDelete(post.id)} className="bg-destructive hover:bg-destructive/90">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <h3 className="text-xl font-semibold">{post.title}</h3>
        <p className="text-muted-foreground whitespace-pre-wrap">{post.content}</p>
        <Badge variant="secondary">{post.tag}</Badge>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button variant={hasLiked ? 'default' : 'outline'} size="sm" onClick={() => onLike(post.id)}>
            <ThumbsUp className="h-4 w-4" />
            <span className="ml-2">{post.likes.length}</span>
          </Button>
          <Button variant={hasDisliked ? 'destructive' : 'outline'} size="sm" onClick={() => onDislike(post.id)}>
            <ThumbsDown className="h-4 w-4" />
            <span className="ml-2">{post.dislikes.length}</span>
          </Button>
        </div>
        <Button variant="ghost" size="sm">
          <MessageSquare className="h-4 w-4 mr-2" />
          Comment
        </Button>
      </CardFooter>
    </Card>
  );
}

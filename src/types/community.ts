import type { Timestamp } from 'firebase/firestore';

export interface CommunityPost {
  id: string;
  userId: string;
  username: string;
  userAvatar?: string;
  title: string;
  content: string;
  tag: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  likes: string[];
  dislikes: string[];
}

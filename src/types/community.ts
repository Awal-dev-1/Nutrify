export interface CommunityPost {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  title: string;
  content: string;
  tag: 'Healthy Tips' | 'Recipe' | 'Weight Loss' | 'Fitness' | 'Nutrition Advice';
  createdAt: any; // Can be a Date or Firestore Timestamp
  updatedAt?: any; // Optional, can be a Date or Firestore Timestamp
  isAiPost?: boolean;
}

export interface CommunityPost {
  id: string;
  userId: string;
  username: string;
  userAvatarUrl: string;
  title: string;
  content: string;
  tag: 'Healthy Tips' | 'Recipe' | 'Weight Loss' | 'Fitness' | 'Nutrition Advice';
  createdAt: Date;
}

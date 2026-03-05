'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Send, X } from 'lucide-react';
import type { CommunityPost } from '@/types/community';

const formSchema = z.object({
  title: z.string().min(5, { message: 'Title must be at least 5 characters.' }).max(100),
  content: z.string().min(10, { message: 'Content must be at least 10 characters.' }).max(1000),
  tag: z.string().min(1, { message: 'Please select a tag.' }),
});

interface CreatePostFormProps {
  onSubmit: (data: z.infer<typeof formSchema>) => void;
  editingPost?: CommunityPost | null;
  onCancelEdit?: () => void;
}

const postTags = ['Healthy Tips', 'Recipe', 'Weight Loss', 'Fitness', 'Nutrition Advice', 'General'];

export function CreatePostForm({ onSubmit, editingPost, onCancelEdit }: CreatePostFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      content: '',
      tag: '',
    },
  });
  
  const isEditing = !!editingPost;

  useEffect(() => {
    if (editingPost) {
      form.reset({
        title: editingPost.title,
        content: editingPost.content,
        tag: editingPost.tag,
      });
    } else {
      form.reset({ title: '', content: '', tag: '' });
    }
  }, [editingPost, form]);

  const handleFormSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmit(values);
    if (!isEditing) {
      form.reset();
    }
  };
  
  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit Your Post' : 'Share Something'}</CardTitle>
        <CardDescription>
          {isEditing ? 'Make changes to your post below.' : 'Share a recipe, a tip, or a success story with the community.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., My Favorite Healthy Breakfast" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tag"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tag</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a tag" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {postTags.map(tag => (
                          <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Share more details here..." {...field} rows={4} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end gap-3">
              {isEditing && (
                <Button type="button" variant="outline" onClick={onCancelEdit}>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                {isEditing ? 'Save Changes' : 'Create Post'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

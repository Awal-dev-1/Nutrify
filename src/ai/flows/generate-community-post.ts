'use server';
/**
 * @fileOverview A Genkit flow for generating an AI community post.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateCommunityPostOutputSchema = z.object({
  title: z.string().describe("A short, engaging title for the community post."),
  content: z.string().describe("The main content of the post. Should be helpful and encouraging."),
  tag: z.enum(['Healthy Tips', 'Recipe', 'Weight Loss', 'Fitness', 'Nutrition Advice']).describe("The most relevant tag for the post."),
});
export type GenerateCommunityPostOutput = z.infer<typeof GenerateCommunityPostOutputSchema>;

export async function generateCommunityPost(): Promise<GenerateCommunityPostOutput> {
  return generateCommunityPostFlow();
}

const generateCommunityPostPrompt = ai.definePrompt({
  name: 'generateCommunityPostPrompt',
  output: { schema: GenerateCommunityPostOutputSchema },
  prompt: `You are an expert nutritionist and motivational coach for Nutrify, a Ghanaian health app. Your task is to generate a single, helpful, and engaging community post.

The post should be encouraging and provide a practical tip, a simple recipe idea, or a motivational thought related to healthy living, fitness, or nutrition, with a focus on Ghanaian culture and foods where appropriate.

Generate a title, content, and a relevant tag for the post. Keep the content concise and easy to read.

Generate the output in JSON format according to the provided schema.`,
});

const generateCommunityPostFlow = ai.defineFlow(
  {
    name: 'generateCommunityPostFlow',
    outputSchema: GenerateCommunityPostOutputSchema,
  },
  async () => {
    const { output } = await generateCommunityPostPrompt({});
    if (!output) {
      throw new Error("The AI failed to generate a community post.");
    }
    return output;
  }
);

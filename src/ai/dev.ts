'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/generate-personalized-meal-plan.ts';
import '@/ai/flows/search-foods-flow.ts';
import '@/ai/flows/recognize-food-flow.ts';
import '@/ai/flows/generate-food-recommendations.ts';
import '@/ai/flows/generate-daily-recommendations.ts';

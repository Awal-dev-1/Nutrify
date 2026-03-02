'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/generate-personalized-meal-plan.ts';
import '@/ai/flows/search-foods-flow.ts';

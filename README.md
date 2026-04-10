# Nutrify: AI-Powered Nutrition Platform

Nutrify is a smart nutrition platform for Ghana, built with Next.js and Firebase. This application helps users track their nutritional intake, discover local foods, and achieve their health goals with the help of AI-powered features.

## Core Features for Presentation

### 1. Login / Registration Page

> “Users can create an account and log in securely.”

**How it works:** This feature is handled by Firebase Authentication, providing a secure and reliable system for user management. When a new user signs up with their name, email, and password, a corresponding user profile document is automatically created in the Firestore database. The system includes robust form validation and handles errors gracefully, such as when an email is already in use. Upon successful login, the application intelligently redirects users either to the initial onboarding flow if they are new, or directly to their personalized dashboard if they have already completed the setup.

---

### 2. Dashboard

> “Displays daily nutrition summary and user progress.”

**How it works:** The dashboard is the central hub of the user experience. It provides a real-time, at-a-glance summary of the user's nutritional progress for the current day. Using data streamed directly from Firestore, it displays key metrics like calories consumed against a daily goal, as well as a breakdown of macronutrients (protein, carbs, and fat). The interface uses progress bars and charts to make complex data easy to understand, helping users quickly assess their performance. It also features quick-action buttons to log new meals or search for foods.

---

### 3. Food Logging

> “Users can enter or search for foods they have eaten.”

**How it works:** Food logging is primarily managed through the "Daily Tracker" page. Here, users can navigate between different dates to view their history or log new meals for the current day. Meals are organized into "Breakfast," "Lunch," and "Dinner" sections. To add a food, the user can trigger a modal that uses an AI-powered search. As soon as a food is added, the daily log in Firestore is updated, and the new totals are reflected across the application in real-time, thanks to the reactive nature of the Firebase hooks.

---

### 4. AI Food Recognition

> “Users can upload an image, and the system identifies the food automatically.”

**How it works:** This feature leverages a powerful multi-modal AI model through a server-side Genkit flow. The user can either upload an image or use their device's camera. The image data is sent to the AI, which analyzes it to identify the food, estimate its nutritional content, and provide a personalized health analysis based on the user's profile. If the AI is uncertain, it is designed to return multiple predictions with confidence scores, allowing the user to select the correct one. The identified food can then be seamlessly added to their daily tracker.

---

### 5. Nutritional Analysis

> “The system shows calories, proteins, fats, and other nutrients.”

**How it works:** Nutritional analysis is a core capability woven throughout the app. When the AI recognizes or searches for a food, it returns a detailed breakdown of both macronutrients (protein, carbs, fat) and essential micronutrients (vitamins and minerals). This data is then presented to the user in a clean, organized format on the food detail screen, using accordions and summary cards to prevent information overload. Furthermore, the "Analytics" page aggregates this data over time, allowing users to track long-term trends in their nutrient intake.

---

### 6. Meal Tracking

> “Users can track their meals daily and monitor habits over time.”

**How it works:** The "Daily Tracker" page is the primary interface for this function, where users can view and manage their logged meals for any given day. Beyond daily tracking, the "Analytics" page provides a powerful long-term perspective, allowing users to visualize their eating habits and consistency over 7, 30, or 90 days. This historical data is not just for viewing; it is also fed back into the AI systems to generate more relevant and effective meal plans and recommendations over time.

---

### 7. Recommendations

> “The system suggests healthier food choices based on user data.”

**How it works:** This proactive feature uses an AI agent to help users discover healthy meals tailored to their needs. On the "Recommendations" page, a user can trigger a Genkit flow that analyzes their health goals (e.g., "lose weight") and dietary preferences. The AI then generates a curated list of suitable meals, with a strong focus on local Ghanaian cuisine. Each recommendation comes with a full recipe, a nutritional breakdown, and a personalized "reason" explaining why it aligns with the user's specific health objectives.

## Getting Started

To get started, run the development server:

```bash
npm run dev
```

Open [http://localhost:9002](http://localhost:9002) with your browser to see the result.

# Nutrify: AI-Powered Nutrition Platform

Nutrify is a smart nutrition platform for Ghana, built with Next.js and Firebase. This application helps users track their nutritional intake, discover local foods, and achieve their health goals with the help of AI-powered features.

## Core Features

*   **Secure Authentication**: Firebase-powered login and registration with email/password.
*   **Personalized Onboarding**: A guided setup flow to capture user details, goals, and preferences.
*   **AI Food Recognition**: Upload an image of a meal, and our AI will identify the food and provide a detailed nutritional breakdown.
*   **AI-Powered Search**: A natural language search interface to get instant nutritional information for any food.
*   **Daily Tracking**: Log meals for breakfast, lunch, and dinner, with real-time updates to your daily calorie and macronutrient totals.
*   **Smart Recommendations**: Get AI-generated meal suggestions based on your health goals and dietary preferences.
*   **AI Meal Planner**: Automatically generate a full 7-day meal plan tailored to your profile.
*   **In-Depth Analytics**: Visualize your nutritional trends over 7, 30, or 90 days with interactive charts.

## Tech Stack

*   **Framework**: [Next.js](https://nextjs.org/) 15 (with App Router)
*   **Hosting**: [Firebase App Hosting](https://firebase.google.com/docs/hosting)
*   **Database**: [Firestore](https://firebase.google.com/docs/firestore)
*   **Authentication**: [Firebase Authentication](https://firebase.google.com/docs/auth)
*   **AI/Generative**: [Google AI & Genkit](https://firebase.google.com/docs/gen-ai)
*   **UI**: [Tailwind CSS](https://tailwindcss.com/) with [ShadCN](https://ui.shadcn.com/) components
*   **Styling**: [Framer Motion](https://www.framer.com/motion/) for animations

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

*   Node.js (v18 or later)
*   npm, yarn, or pnpm

### Installation

1.  Clone the repo
    ```sh
    git clone https://github.com/your_username/nutrify.git
    ```
2.  Install NPM packages
    ```sh
    npm install
    ```
3.  Set up your environment variables. Create a `.env` file in the root and add your Firebase configuration details:
    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
    # ... and so on
    ```
4.  Run the development server:
    ```bash
    npm run dev
    ```

Open [http://localhost:9002](http://localhost:9002) with your browser to see the result.

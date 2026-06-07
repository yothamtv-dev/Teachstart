# EduPlan AI - Setup Guide

Welcome to EduPlan AI! This guide will walk you through setting up the platform.

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier is fine)
- An OpenAI API key

## Step 1: Clone or Download the Project

```bash
git clone <your-repo-url> eduplan-ai
cd eduplan-ai
pnpm install
```

## Step 2: Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Copy your project URL and anon key
3. Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
```

## Step 3: Initialize the Database

1. Go to your Supabase dashboard
2. Open the SQL Editor
3. Copy the entire contents of `scripts/schema.sql`
4. Paste it into the SQL Editor and run it

This will create all necessary tables with proper Row Level Security policies.

## Step 4: Start the Development Server

```bash
pnpm dev
```

The app will be available at `http://localhost:3000`

## Step 5: Create Your Account

1. Navigate to `/auth/signup`
2. Create a teacher account with your email
3. Log in with your credentials
4. You'll be redirected to the dashboard

## Features Available

### 1. Lesson Builder
- Drag-and-drop interface to create lessons
- Multiple block types: text, image, video, quiz, activity
- Real-time metrics showing lesson quality
- Save lessons to your library

### 2. AI Lesson Generator
- Generate full lessons from a topic using OpenAI
- Customize the tone, grade level, and duration
- Preview generated content before saving

### 3. Question Generator
- Automatically generate quiz questions from lesson content
- Multiple question types: multiple choice, short answer, true/false
- Difficulty level selection

### 4. Time Estimation
- Automatic calculation of lesson duration
- Per-block time estimates
- Helps with lesson planning

### 5. Lesson Templates
- Browse pre-made templates for common subjects
- Customize templates for your needs
- Save custom templates for reuse

### 6. Community Marketplace
- Browse and download lessons shared by other teachers
- Share your own lessons with the community
- Rating and review system

### 7. Student Engagement Tracker
- Monitor student participation and performance
- View completion percentages
- Track quiz scores and progress

### 8. Analytics Dashboard
- Visualize lesson performance metrics
- Track which lessons are most engaging
- Compare class performance

### 9. Curriculum Alignment
- Tag lessons with curriculum standards
- View which standards are covered
- Gap analysis for your curriculum

### 10. Peer Community
- Connect with other teachers
- Share resources and best practices
- Collaborate on lesson planning

## Database Schema

The following tables are created:

- `profiles` - Teacher profile information
- `lessons` - Lesson metadata and blocks
- `blocks` - Individual lesson components
- `templates` - Pre-made lesson templates
- `student_engagement` - Student participation data
- `lesson_resources` - Attached files and media
- `curriculum_standards` - Educational standards alignment
- `community_shared_lessons` - Community marketplace listings
- `lesson_ratings` - Community ratings and reviews
- `lesson_versions` - Version history tracking

## API Routes

### Lesson Generation
- `POST /api/generate-lesson` - Generate lesson from topic
- `POST /api/generate-questions` - Generate quiz questions
- `POST /api/estimate-time` - Calculate lesson duration
- `POST /api/calculate-score` - Calculate reusability score

## Troubleshooting

### "Supabase URL not found"
- Check that your `.env.local` file is in the root directory
- Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set

### "Database tables not found"
- Run the SQL initialization script in Supabase SQL Editor
- Verify all tables were created successfully

### "OpenAI API errors"
- Check that your `OPENAI_API_KEY` is valid
- Ensure your OpenAI account has sufficient credits
- Check API usage limits

### "Auth errors on signup"
- Enable email auth in Supabase Auth settings
- Check that email confirmations are enabled (optional)

## Deployment

To deploy to Vercel:

1. Push your code to GitHub
2. Connect your repo to Vercel
3. Add environment variables in Vercel Settings
4. Deploy!

```bash
vercel deploy --prod
```

## Support

For issues or questions:
1. Check the README.md for feature documentation
2. Review the API routes in `app/api/`
3. Check component implementations in `components/`

## Next Steps

1. Explore the lesson builder with drag-and-drop
2. Try generating an AI lesson
3. Customize the platform for your needs
4. Invite students to use the platform

Happy teaching! 🎓

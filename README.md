# EduPlan AI - AI-Powered Lesson Planning Platform

A comprehensive lesson planning platform that empowers teachers with AI-assisted lesson creation, drag-and-drop building, student engagement tracking, and community collaboration.

## Features

### Core Features

1. **Drag-and-Drop Lesson Builder** - Intuitive visual editor to create lessons with multiple block types (Introduction, Content, Activity, Discussion, Assessment)

2. **AI Lesson Generator** - Automatically generate complete lesson structures using OpenAI GPT-4o based on topics, grade levels, and durations

3. **Time Estimation** - AI-powered time estimation for each lesson component (reading, activities, discussion, assessment)

4. **Reusability Scoring** - Automatic evaluation of lesson quality with metrics for clarity, engagement, completeness, and reusability

5. **Lesson Metrics** - Analyze lessons with detailed quality scores and AI-generated improvement recommendations

6. **Lesson Templates** - Pre-built professional templates for various subjects and grade levels

7. **Community Marketplace** - Share lessons with other teachers and discover lessons from the community

8. **Analytics Dashboard** - Track student engagement, performance trends, and lesson effectiveness

9. **Lesson Management** - Full CRUD operations for lessons with search and filtering

10. **User Authentication** - Secure teacher accounts with Supabase Auth

## Getting Started

### Prerequisites
- Node.js 18+ and pnpm
- Supabase project (free tier available)
- OpenAI API key

### Quick Setup (5 minutes)

1. **Install dependencies**
   ```bash
   pnpm install
   ```

2. **Set environment variables**
   ```bash
   cp .env.local.example .env.local
   # Fill in your Supabase and OpenAI keys
   ```

3. **Initialize database** ⚠️ IMPORTANT
   - See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for detailed instructions
   - TL;DR: Go to Supabase dashboard > SQL Editor > Copy `scripts/schema.sql` > Run

4. **Start the development server**
   ```bash
   pnpm dev
   ```

5. **Open in browser**
   - Go to http://localhost:3000
   - Sign up with any email/password
   - Start creating lessons!

### Database Setup

**The app won't work until the database is initialized.** See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for step-by-step instructions (takes 2-3 minutes).

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Supabase
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth
- **AI**: OpenAI GPT-4o via Vercel AI SDK
- **Drag-and-Drop**: @dnd-kit
- **Charts**: Recharts
- **File Storage**: Supabase Storage (for future resource uploads)

## Project Structure

```
app/
├── auth/
│   ├── login/
│   └── signup/
├── dashboard/
│   ├── page.tsx (home)
│   ├── builder/ (lesson editor)
│   ├── lessons/ (lesson management)
│   ├── templates/
│   ├── community/
│   ├── analytics/
│   └── settings/
├── api/
│   ├── generate-lesson/
│   ├── generate-questions/
│   ├── estimate-time/
│   └── calculate-score/
├── layout.tsx
└── page.tsx

components/
├── dashboard/
│   ├── dashboard-nav.tsx
│   └── dashboard-sidebar.tsx
├── lesson-builder/
│   ├── lesson-canvas.tsx
│   ├── lesson-block.tsx
│   ├── block-library.tsx
│   ├── ai-generator-dialog.tsx
│   └── lesson-metrics.tsx
└── ui/ (shadcn/ui components)

lib/
├── supabase.ts
└── utils.ts

hooks/
└── use-auth.ts

scripts/
├── schema.sql (database schema)
└── setup-db.js (database setup)
```

## Database Schema

### Tables

- **profiles** - Teacher account information
- **lessons** - Lesson plans with blocks and metadata
- **lesson_blocks** - Individual lesson components
- **lesson_templates** - Pre-built lesson templates
- **shared_lessons** - Community lesson marketplace
- **student_engagement** - Student performance and engagement tracking
- **lesson_ratings** - Community ratings and feedback
- **curriculum_standards** - Curriculum alignment data
- **lesson_versions** - Lesson version history
- **learning_objectives** - Learning outcomes for lessons

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd eduplan-ai
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   OPENAI_API_KEY=your_openai_api_key
   ```

4. **Initialize the database**
   - Copy the SQL from `scripts/schema.sql`
   - Open your Supabase dashboard
   - Go to SQL Editor and paste the schema
   - Click "Run" to create all tables and enable RLS

5. **Start the development server**
   ```bash
   pnpm dev
   ```

6. **Access the application**
   - Visit `http://localhost:3000`
   - Sign up for a new account
   - Start creating lessons!

## Core Workflows

### Creating a Lesson

1. Click "Create Lesson" in the dashboard
2. Use the drag-and-drop builder to add blocks
3. Customize each block's title, content, and duration
4. Use "Analyze Lesson" to get quality metrics
5. Save the lesson

### Using AI Generator

1. Click "AI Generator" in the lesson builder
2. Enter topic, grade level, and duration
3. The AI generates a complete lesson structure
4. Customize the generated content as needed
5. Save the lesson

### Sharing Lessons

1. Go to "My Lessons"
2. Click "Share" on any lesson
3. The lesson is added to the Community Marketplace
4. Other teachers can view and use your lesson

### Viewing Analytics

1. Go to "Analytics" in the sidebar
2. View engagement trends and lesson statistics
3. See which lessons perform best
4. Track student engagement over time

## API Endpoints

### POST `/api/generate-lesson`
Generate a lesson structure from a topic
- **Body**: `{ topic, gradeLevel?, subject?, duration? }`
- **Returns**: Stream of JSON lesson structure

### POST `/api/generate-questions`
Generate quiz questions from content
- **Body**: `{ content, questionCount?, questionType? }`
- **Returns**: Stream of JSON questions

### POST `/api/estimate-time`
Estimate lesson duration
- **Body**: `{ blocks, gradeLevel? }`
- **Returns**: Time estimate breakdown

### POST `/api/calculate-score`
Calculate lesson quality metrics
- **Body**: `{ blocks, title }`
- **Returns**: Quality scores and recommendations

## Features in Development

- Resource uploads (PDFs, images, videos)
- Curriculum alignment suggestions
- Student assignment tracking
- Collaborative lesson editing
- Mobile app
- Offline support
- Lesson cloning
- Advanced search with filters

## Security & Privacy

- Row Level Security (RLS) enabled on all tables
- Teachers can only access their own lessons
- Secure authentication with Supabase Auth
- Password hashing with bcrypt
- HTTPS enforced in production

## Performance Optimizations

- Server-side rendering for fast initial loads
- Streaming responses for AI generation
- Image optimization
- CSS minification
- Code splitting
- Database query optimization

## Contributing

Contributions are welcome! Please submit pull requests with:
- Clear description of changes
- Tests for new features
- Updated documentation

## License

MIT License - feel free to use this project for educational purposes.

## Support

For issues or questions:
1. Check the FAQ in the dashboard
2. Visit the community forum
3. Contact support@eduplan.ai

## Roadmap

- Q1 2024: Mobile app launch
- Q1 2024: Advanced analytics
- Q2 2024: Curriculum standards integration
- Q2 2024: Collaborative editing
- Q3 2024: AI-powered grading
- Q3 2024: Parent communication tools

---

**EduPlan AI** - Empowering Teachers with Intelligent Lesson Planning

# Teach smart - Database Setup Guide

## Quick Setup (5 minutes)

Your Supabase project is connected and ready. You just need to initialize the database schema by running one SQL file.

### Step-by-Step Instructions

#### Option 1: Manual Setup (Recommended - Easiest)

1. **Open Supabase Dashboard**
   - Go to https://supabase.com
   - Sign in with your account
   - Select your Teach smart project

2. **Open SQL Editor**
   - In the left sidebar, click **"SQL Editor"**
   - Click **"+ New Query"** button (top left)

3. **Copy the Schema**
   - Open this file in your project: `scripts/schema.sql`
   - Select all the content (Ctrl+A / Cmd+A)
   - Copy it (Ctrl+C / Cmd+C)

4. **Paste into Supabase**
   - Click in the SQL editor box
   - Paste the schema (Ctrl+V / Cmd+V)

5. **Run the Schema**
   - Click the blue **"Run"** button (bottom right of editor)
   - Wait for it to complete (should take 2-3 seconds)
   - You should see "✓" checkmarks next to each completed statement

6. **Verify Success**
   - Go to **"Databases"** in the left sidebar
   - Expand the "public" schema
   - You should see these tables:
     - users
     - lessons
     - lesson_blocks
     - quiz_questions
     - resources
     - curriculum_standards
     - lesson_templates
     - shared_lessons
     - student_engagement
     - lesson_version_history

#### Option 2: Command Line Setup

If you prefer using the command line:

```bash
# Make sure your environment variables are set
# Then run:
pnpm run init:db

# Or manually with psql:
psql $POSTGRES_URL < scripts/schema.sql
```

### What Gets Created

The schema creates 10 tables:

| Table | Purpose |
|-------|---------|
| **users** | Teacher profiles and metadata |
| **lessons** | Lesson metadata and settings |
| **lesson_blocks** | Individual content blocks in lessons |
| **quiz_questions** | Quiz/assessment questions |
| **resources** | Files, images, videos, links |
| **curriculum_standards** | Standards (CCSS, etc.) for alignment |
| **lesson_templates** | Reusable lesson templates |
| **shared_lessons** | Peer sharing marketplace |
| **student_engagement** | Student progress tracking |
| **lesson_version_history** | Version control for lessons |

### Row Level Security (RLS)

The schema automatically sets up RLS policies so that:
- Users can only see/edit their own lessons
- Teachers can see shared lessons from others
- Student data is protected

### Troubleshooting

#### Error: "relation already exists"
- The tables might already be partially created
- This is safe to ignore - it just means some tables already exist

#### Error: "permission denied"
- Make sure you're using the service role key (in Supabase > Settings > API)
- The SUPABASE_SERVICE_ROLE_KEY should have full database access

#### 404 or 429 errors when signing up
- The database schema hasn't been created yet
- Follow the setup steps above
- These errors will disappear once the schema is initialized

#### "Failed to load resource: 400 error"
- This typically means auth tables aren't properly configured
- Make sure Supabase Auth is enabled (it should be by default)
- Run the schema setup to ensure auth.users exists

### After Setup

1. **Refresh your app** - Go back to your application and refresh the page
2. **Sign up** - Create a new account with any email/password
3. **Start creating** - Begin building your first lesson!

### Need Help?

- Check the logs in your browser's Developer Tools (F12) > Console tab
- Visit the Supabase documentation: https://supabase.com/docs
- Check the troubleshooting section above

---

### Pro subscriptions (AI features)

1. `scripts/patches/006-subscription-tier.sql` — subscription columns  
2. `scripts/patches/008-fix-users-rls-recursion.sql` — if you see infinite recursion on `users`  
3. `scripts/patches/009-subscribe-rls-fix.sql` — if Subscribe to Pro says "Update was blocked"

AI routes require **Pro**. Users click **Subscribe to Pro** in **Settings** (no Stripe). Optionally set `SUBSCRIBE_PROMO_CODE` and `NEXT_PUBLIC_SUBSCRIBE_REQUIRES_CODE=true` so only users with a school code can upgrade. Admins can also set plans in **Admin → Users**.

---

Once the database is initialized, the app will be fully functional!

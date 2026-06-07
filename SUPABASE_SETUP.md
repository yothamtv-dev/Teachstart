# Supabase Database Setup - Visual Guide

This guide walks you through initializing your Supabase database for EduPlan AI.

## Why You Need This

The app requires database tables to store:
- User profiles and authentication data
- Lessons and lesson content blocks
- Quiz questions and assessments
- Student progress tracking
- Community shared lessons

Without these tables, you'll see 404 and 429 errors when trying to sign up.

## Setup Instructions

### 1️⃣ Open Supabase Dashboard

1. Go to **https://supabase.com**
2. Click **"Sign in"** (top right)
3. Enter your email and password
4. Select your **EduPlan AI** project (or the one connected to this app)

### 2️⃣ Navigate to SQL Editor

In the left sidebar, you should see several options:
- Home
- Databases
- SQL Editor ← **Click this**
- Auth
- Storage
- etc.

Click **"SQL Editor"**

### 3️⃣ Create a New Query

At the top of the SQL Editor section, click the **"+ New Query"** button.

You should see a blank SQL editor window appear.

### 4️⃣ Copy the Schema SQL

1. Open the file `scripts/schema.sql` in your code editor (or this repository)
2. Select all the content:
   - Windows/Linux: Press `Ctrl + A`
   - Mac: Press `Cmd + A`
3. Copy it:
   - Windows/Linux: Press `Ctrl + C`
   - Mac: Press `Cmd + C`

### 5️⃣ Paste into Supabase

1. Click in the SQL editor window on the Supabase page
2. Paste the content:
   - Windows/Linux: Press `Ctrl + V`
   - Mac: Press `Cmd + V`

You should see a large block of SQL code in the editor.

### 6️⃣ Run the Schema

1. Look for the blue **"Run"** button (usually bottom right of the editor)
2. Click it
3. Wait 2-3 seconds for the query to execute

### 7️⃣ Check for Success

After running, you should see:
- ✅ No error messages
- Green checkmark(s) indicating successful execution
- The code runs without warnings

### 8️⃣ Verify the Tables Were Created

1. In the left sidebar, click **"Databases"**
2. Click the dropdown arrow next to **"public"** schema
3. You should see these tables:
   - `users`
   - `lessons`
   - `lesson_blocks`
   - `quiz_questions`
   - `resources`
   - `curriculum_standards`
   - `lesson_templates`
   - `shared_lessons`
   - `student_engagement`
   - `lesson_version_history`

If you see all these tables, you're done! ✅

### 9️⃣ Back to Your App

1. Go back to your running app (http://localhost:3000)
2. Refresh the page (F5 or Cmd+R)
3. Try signing up with a test email and password
4. You should now see the dashboard!

---

## Troubleshooting

### "Error: relation already exists"

This is fine! It just means some tables were already created.

**Solution**: Ignore this error and continue. The existing tables are what you need.

### "Error: permission denied"

This means your database user doesn't have the right permissions.

**Solution**: 
- Make sure you're using the Supabase dashboard (not a local database)
- You should be logged in with the account that created the project
- Try refreshing the page and running the query again

### Still seeing 404/429 errors after setup?

The issue might be with environment variables.

**Solution**:
1. Check your `.env.local` file has these variables:
   - `NEXT_PUBLIC_SUPABASE_URL` (matches your Supabase project URL)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (from Supabase > Settings > API)

2. If you changed `.env.local`, restart your dev server:
   - Stop it (Ctrl+C)
   - Run `pnpm dev` again

3. Refresh your app in the browser

### Can't find SQL Editor?

Make sure you're looking in the left sidebar of the Supabase dashboard, not the top navigation.

The left sidebar has:
- Home
- Databases
- SQL Editor ← This one
- Auth
- etc.

---

## What Each Table Does

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| **users** | Teacher profiles | id, email, full_name, school_name |
| **lessons** | Lesson metadata | id, user_id, title, subject, grade_level |
| **lesson_blocks** | Content blocks | id, lesson_id, block_type, position |
| **quiz_questions** | Assessment questions | id, lesson_block_id, question_text, options |
| **resources** | Media files | id, lesson_id, resource_type, file_path |
| **curriculum_standards** | Educational standards | id, standard_code, subject, grade_level |
| **lesson_templates** | Reusable templates | id, user_id, title, is_template |
| **shared_lessons** | Community shared | id, lesson_id, user_id, shared_by |
| **student_engagement** | Progress tracking | id, lesson_id, student_id, completion |
| **lesson_version_history** | Version control | id, lesson_id, version_number, changes |

---

## Next Steps

Once the database is set up:

1. ✅ Sign up in the app
2. ✅ Create your first lesson
3. ✅ Try the AI generator
4. ✅ Explore all features!

---

**Questions?** Check the main README.md or QUICKSTART.md for more help!

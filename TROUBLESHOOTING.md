# EduPlan AI Troubleshooting Guide

This guide helps you fix common errors and issues.

## 🚨 Common Errors

### Error: 429 (Too Many Requests)

**What it means**: Supabase is rejecting authentication requests because something is wrong with the auth setup.

**Why it happens**:
- Database schema hasn't been initialized yet
- Auth tables don't exist
- Repeated failed login attempts trigger rate limiting

**How to fix**:

1. **Initialize the database schema** (if you haven't already)
   - See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for step-by-step instructions
   - Copy `scripts/schema.sql` and run it in Supabase SQL Editor

2. **Wait a few minutes** if you see rate limit errors
   - The rate limiting is temporary (usually 5-15 minutes)
   - After waiting, refresh the page and try again

3. **Check environment variables**
   - Make sure `.env.local` has correct Supabase credentials
   - Restart dev server after any `.env.local` changes

### Error: 404 (Not Found)

**What it means**: The API endpoint wasn't found, usually because auth tables don't exist.

**How to fix**:
1. Initialize database schema (see above)
2. Verify all tables were created in Supabase
3. Refresh your app

### Error: 400 (Bad Request)

**What it means**: The request is malformed or missing required data.

**Common causes**:
- Auth service configuration issue
- Missing environment variables
- Invalid credentials

**How to fix**:
1. Check that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are in `.env.local`
2. Verify they match your Supabase project settings
3. Restart dev server
4. Clear browser cache (Ctrl+Shift+Delete or Cmd+Shift+Delete)

---

## 🔧 Verification Steps

### Step 1: Check Environment Variables

Your `.env.local` should have these variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY-HERE
OPENAI_API_KEY=sk-YOUR-KEY-HERE  # Optional, for AI features
```

To verify:
1. Open `.env.local` in your code editor
2. Check all three values are present (especially the first two)
3. They should be actual values, not placeholders
4. No extra spaces or quotes around them

### Step 2: Check Supabase Tables

1. Go to https://supabase.com
2. Select your project
3. Click **"Databases"** in left sidebar
4. Expand **"public"** schema
5. You should see these 10 tables:
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

**If these tables don't exist**: Run `scripts/schema.sql` in Supabase SQL Editor

### Step 3: Restart Everything

Sometimes the simplest fix works:

```bash
# 1. Stop the dev server (Ctrl+C)

# 2. Clear node_modules and reinstall
pnpm install --force

# 3. Start the dev server again
pnpm dev

# 4. Clear browser cache (Ctrl+Shift+Delete)

# 5. Refresh the app (F5)
```

---

## 🐛 Debugging Tips

### Check Browser Console

1. Open your app in browser
2. Press F12 (or Cmd+Option+I on Mac)
3. Click the **"Console"** tab
4. Look for any red error messages
5. Share these errors if seeking help

### Check Network Tab

1. In DevTools, click **"Network"** tab
2. Try to sign up
3. Look for failed requests (red colored)
4. Click on them to see the error details
5. Check the Response tab for error message

### Check Server Logs

1. Look at your terminal where `pnpm dev` is running
2. Watch for error messages when you attempt sign up
3. Any errors there will help diagnose the issue

---

## ✅ Verification Checklist

Before reporting an issue, verify:

- [ ] Database schema has been run in Supabase
- [ ] All 10 tables exist in Supabase
- [ ] `.env.local` has correct Supabase credentials
- [ ] Dev server has been restarted since editing `.env.local`
- [ ] Browser cache has been cleared (Ctrl+Shift+Delete)
- [ ] App has been refreshed (F5)
- [ ] Waited 5+ minutes if seeing rate limit errors

---

## 📞 Getting Help

If you're still stuck:

1. **Check all documentation files**
   - [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - Database setup
   - [DATABASE_SETUP.md](./DATABASE_SETUP.md) - Detailed DB instructions
   - [README.md](./README.md) - Feature overview

2. **Review error messages carefully**
   - Error codes tell you a lot (404, 429, 400, etc.)
   - Browser console often shows the actual problem

3. **Try the verification steps above**
   - Most issues are configuration related

4. **Check Supabase docs**
   - https://supabase.com/docs for official docs
   - Check your Supabase project dashboard for clues

---

## 🔄 Common Solutions

| Problem | Solution |
|---------|----------|
| 429 errors | Initialize database schema (see SUPABASE_SETUP.md) |
| Can't see tables | Run schema.sql in Supabase SQL Editor |
| Wrong credentials error | Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY |
| "Env variable not found" | Restart dev server after editing .env.local |
| App won't load | Clear browser cache and refresh (Ctrl+Shift+Delete then F5) |
| Signup button doesn't work | Check browser console for errors (F12) |
| Rate limiting after multiple tries | Wait 5-15 minutes, then try again |

---

## 🎯 Next Steps After Fixing

Once errors are resolved:

1. Sign up in the app
2. Create your first lesson
3. Try the drag-and-drop builder
4. Test the AI generator (if OpenAI key is configured)
5. Explore the dashboard and analytics

---

**Still having issues?** Check [INDEX.md](./INDEX.md) for all documentation resources.

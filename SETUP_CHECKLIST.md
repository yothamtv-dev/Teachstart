# EduPlan AI Setup Checklist

Use this checklist to ensure everything is properly configured.

## ✅ Environment Setup

- [ ] Node.js 18+ installed (`node --version`)
- [ ] pnpm installed (`pnpm --version`)
- [ ] Project cloned/downloaded
- [ ] Dependencies installed (`pnpm install`)

## ✅ Supabase Configuration

- [ ] Supabase project created at https://supabase.com
- [ ] Project URL copied to `.env.local` as `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Anon key copied to `.env.local` as `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Service role key saved (for database initialization)

## ✅ Database Initialization

- [ ] Supabase SQL Editor opened
- [ ] New query created
- [ ] `scripts/schema.sql` content copied
- [ ] Schema pasted into SQL editor and run successfully
- [ ] All 10 tables created:
  - [ ] users
  - [ ] lessons
  - [ ] lesson_blocks
  - [ ] quiz_questions
  - [ ] resources
  - [ ] curriculum_standards
  - [ ] lesson_templates
  - [ ] shared_lessons
  - [ ] student_engagement
  - [ ] lesson_version_history

## ✅ OpenAI Setup (Optional - for AI features)

- [ ] OpenAI account created at https://openai.com
- [ ] API key generated
- [ ] API key added to `.env.local` as `OPENAI_API_KEY`
- [ ] API key has sufficient credits/quota

## ✅ Application Testing

- [ ] Dev server started (`pnpm dev`)
- [ ] App loads at http://localhost:3000 without errors
- [ ] Can access login page
- [ ] Can sign up with test email/password
- [ ] Dashboard loads after signup
- [ ] Can see "Create Lesson" button
- [ ] Can create a new lesson
- [ ] Lesson builder interface appears

## ✅ Feature Testing

### Lesson Builder
- [ ] Can drag blocks in and out
- [ ] Can reorder blocks
- [ ] Can delete blocks
- [ ] Can edit block content
- [ ] Can save lessons

### AI Features (requires OpenAI key)
- [ ] AI Generator dialog opens
- [ ] Can enter a topic
- [ ] AI generates lesson content
- [ ] Generated blocks appear in builder

### Dashboard
- [ ] Can view lesson list
- [ ] Can search/filter lessons
- [ ] Can edit existing lessons
- [ ] Can delete lessons
- [ ] Can view lesson details

### Navigation
- [ ] Dashboard menu items work
- [ ] Can navigate between pages
- [ ] Can logout
- [ ] Can login again

## ✅ Deployment Checklist (for Vercel)

- [ ] Code pushed to GitHub
- [ ] Vercel project created and connected
- [ ] Environment variables set in Vercel:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `OPENAI_API_KEY` (if using AI features)
- [ ] Build succeeds without errors
- [ ] App deploys successfully
- [ ] Features work in production

## 🆘 Troubleshooting Quick Links

If you encounter issues:

| Problem | Solution |
|---------|----------|
| 404/429 errors on signup | See [DATABASE_SETUP.md](./DATABASE_SETUP.md) |
| Can't see tables in Supabase | Check SQL Editor > verify schema ran successfully |
| Environment variables not working | Restart dev server after editing `.env.local` |
| AI features not working | Check `OPENAI_API_KEY` is set and valid |
| Build fails on Vercel | Ensure all env vars are added in Vercel settings |
| App won't load | Check browser console (F12) for error messages |

## 📋 Status Summary

- **Total Items**: 45
- **Completed**: ___
- **Remaining**: ___

---

**Last Updated**: Setup checklist created
**Status**: Ready for deployment ✅

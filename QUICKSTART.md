# EduPlan AI - Quick Start Guide

Get up and running with EduPlan AI in 5 minutes! 🚀

## 1. Prerequisites (2 minutes)

You'll need:
- Node.js 18+ ([download](https://nodejs.org))
- A Supabase account ([signup free](https://supabase.com))
- An OpenAI API key ([get one](https://platform.openai.com/api-keys))

## 2. Clone & Install (1 minute)

```bash
# Clone the project
git clone <your-repo-url>
cd eduplan-ai

# Install dependencies
pnpm install
```

## 3. Configure Environment (1 minute)

Create `.env.local` file:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
OPENAI_API_KEY=sk-your_openai_key_here
```

## 4. Initialize Database (1 minute)

1. Go to your Supabase project dashboard
2. Open the SQL Editor
3. Copy all content from `scripts/schema.sql`
4. Paste into the editor and run it

✅ All tables are now created!

## 5. Start the App (instant!)

```bash
pnpm dev
```

Visit: **http://localhost:3000**

## First Steps

### Sign Up
1. Click "Sign Up" on login page
2. Enter email and password
3. Fill in your teacher profile
4. Click "Create Account"

### Create Your First Lesson
1. Click "Create Lesson" in sidebar
2. Enter lesson title and select subject/grade
3. Click "Create" to open builder

### Use the Lesson Builder
1. Select a block type from the left panel
2. Click "Add Block" to add content
3. Edit block content by clicking on it
4. Drag blocks to reorder them
5. Click "Save Lesson" when done

### Try AI Generation
1. In the lesson builder, click "Generate with AI"
2. Enter a topic (e.g., "Photosynthesis")
3. Select grade level and duration
4. Click "Generate"
5. Watch as the lesson is created! ✨

### View Your Lessons
1. Click "My Lessons" in sidebar
2. See all your created lessons
3. Click "Edit" to modify or "View" for details

## Quick Navigation

- **Dashboard** - Overview and recent lessons
- **Create Lesson** - Open the lesson builder
- **My Lessons** - View and manage all lessons
- **Templates** - Browse pre-made lesson templates
- **Community** - Share and discover lessons
- **Analytics** - View engagement metrics
- **Settings** - Update your profile

## Common Tasks

### Generate a Lesson from AI
```
Builder → "Generate with AI" button → 
  Topic + Grade Level + Duration → 
  Generate → Save
```

### Share a Lesson with Community
```
My Lessons → Click lesson → 
  Share to Community → 
  Fill details → Share
```

### Use a Template
```
Templates → Browse/Search → 
  Click template → Clone → 
  Opens in builder ready to customize
```

### Check Student Engagement
```
My Lessons → Click lesson → 
  Engagement section → 
  See student stats and progress
```

### View Analytics
```
Analytics → Choose time period → 
  View charts showing performance metrics
```

## Available Block Types

| Type | Use For | Duration |
|------|---------|----------|
| **Text** | Paragraphs, instructions | N/A |
| **Heading** | Section titles | N/A |
| **Image** | Visual content | N/A |
| **Video** | Video content | 5-20 min |
| **Quiz** | Assessment | 5-15 min |
| **Discussion** | Group work | 10-20 min |
| **Activity** | Hands-on learning | 15-30 min |

## Tips & Tricks

✨ **Pro Tips:**
- Use AI to generate a starting point, then customize
- Add a quiz block at the end for assessment
- Use heading blocks to structure your lesson
- Save frequently while editing
- Add multiple images to keep lessons visually engaging
- Give quizzes meaningful titles like "Check Your Understanding"

⚡ **Efficiency:**
- Clone existing lessons to save time
- Save lessons as templates for subjects you teach often
- Use the quality metrics to improve your lessons
- Generate questions to save hours of prep work

📚 **Best Practices:**
- Keep lessons between 30-60 minutes
- Include a mix of content types
- Start with a learning objective
- End with an assessment
- Share great lessons with the community

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+S` | Save lesson |
| `Delete` | Delete selected block |
| `Escape` | Deselect block |

## Troubleshooting

### "Supabase URL not found"
- Check that `.env.local` file exists
- Verify `NEXT_PUBLIC_SUPABASE_URL` is set
- Restart dev server after changing `.env.local`

### "Tables don't exist"
- Ensure you ran the SQL schema
- Check in Supabase SQL Editor that tables were created
- Verify no errors during schema execution

### "OpenAI API error"
- Check your API key is correct
- Verify it has API credits
- Check API rate limits haven't been exceeded

### "Login not working"
- Verify email is correct format
- Check password length (min 8 characters)
- Try signing up with new account

## Next Steps

1. **Create 3 sample lessons** to get familiar with the builder
2. **Try AI generation** with different topics
3. **Share a lesson** to the community
4. **Explore templates** and customize one
5. **Check your analytics** to see metrics
6. **Invite students** when you're ready

## Helpful Resources

- **Full Documentation**: See README.md
- **Setup Help**: See SETUP.md
- **Technical Details**: See IMPLEMENTATION.md
- **Feature Checklist**: See FEATURES.md

## What's Next?

- Deploy to Vercel for live access
- Add more subjects/grades
- Build a library of lessons
- Share with teacher community
- Gather student engagement data

## Support

Need help? Check:
1. SETUP.md for installation issues
2. README.md for feature documentation
3. IMPLEMENTATION.md for technical details

---

**You're all set! Happy lesson planning! 🎓**

Start by clicking "Create Lesson" and building your first lesson!

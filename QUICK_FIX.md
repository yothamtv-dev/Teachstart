# Quick Fix for Signup/Login Errors

## TL;DR - Do This Now (3 steps, 5 minutes)

### Step 1: Update Database (3 minutes)
1. Open Supabase Dashboard
2. Go to **SQL Editor → New Query**
3. Clear the editor
4. Copy **EVERYTHING** from your project's `scripts/schema.sql` file
5. Paste it into Supabase SQL Editor
6. Click **Run** (blue button)
7. Wait for success message ✓

### Step 2: Clear Browser Cache (1 minute)
1. Press **F12** to open DevTools
2. Right-click the refresh button at the top
3. Select "Empty cache and hard refresh"
4. Or: Go to **Application > Local Storage > Delete All**

### Step 3: Test Signup (1 minute)
1. Go back to your app
2. Click "Sign Up"
3. Use a NEW email (not one you tried before)
4. Fill in all fields
5. Click "Sign Up"
6. You should see "Account created!" ✓

## What Was Fixed

The database was missing one critical RLS policy that allows new users to insert their profile. The updated `schema.sql` now includes:

```sql
CREATE POLICY "Users can create their own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);
```

## Common Issues After Fix

### Still getting 403?
- The schema didn't run fully
- **Solution**: Go back to Step 1 and verify the Run completed

### Still getting 429 (rate limited)?
- Your email was tried too many times
- **Solution**: Wait 15 minutes OR use a different email address

### Still getting 422 (unprocessable)?
- Supabase auth has email confirmation enabled
- **Solution**: 
  - Go to Supabase Dashboard
  - Authentication > Providers
  - Turn OFF "Confirm email" under Email Provider

## Verify It Worked

You'll know it's working when:
- ✓ Signup shows "Account created!" message
- ✓ You're redirected to login page
- ✓ You can login with your new email
- ✓ Dashboard loads

## Still Not Working?

Open browser console (F12 > Console tab) and copy any red error messages, then we can debug the specific issue.

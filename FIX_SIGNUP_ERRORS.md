# Fixing 403 Forbidden & 429 Too Many Requests Errors

## What Went Wrong

You were seeing these errors:
- **403 (Forbidden)** on POST to `/rest/v1/users` - The RLS policy was blocking inserts
- **429 (Too Many Requests)** - The auth endpoint rate-limited due to repeated failed attempts

## The Fix (2 steps - 5 minutes)

### Step 1: Update the Database Schema

The `schema.sql` file has been updated with the missing RLS policy. You need to run the updated schema:

1. Go to your Supabase Dashboard
2. Go to **SQL Editor → New Query**
3. Clear any existing query
4. **Copy the ENTIRE updated file** from `scripts/schema.sql`
5. Paste it into the SQL Editor
6. Click **Run** (blue button)

**Important:** Make sure to copy the ENTIRE file - it now includes the missing INSERT policy on the users table.

### Step 2: Clear Browser Data & Test

1. **Clear your browser's local storage** (to clear old failed login attempts)
   - Press F12 to open DevTools
   - Go to **Application > Local Storage**
   - Delete any entries for your domain
   
2. **Refresh the page** (Cmd+R or Ctrl+R)

3. **Try signing up again** with a new email

## Why This Works

The schema now includes this critical policy:
```sql
CREATE POLICY "Users can create their own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);
```

This allows newly authenticated users to insert their profile into the `users` table.

## If You Still Get Errors

### 422 Unprocessable Content
- The auth endpoint is rejecting the request
- **Solution**: Ensure your Supabase project has email confirmation DISABLED (optional)
  - Go to Supabase Dashboard > Authentication > Providers
  - Toggle "Confirm email" OFF (under Email Provider)

### 403 Forbidden on users table
- The RLS policy might not have applied
- **Solution**: 
  1. Go to Supabase > SQL Editor
  2. Run: `DROP POLICY "Users can create their own profile" ON public.users;`
  3. Run: `CREATE POLICY "Users can create their own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);`

### Still Rate Limited (429)
- The endpoint is blocking you from too many failed attempts
- **Solution**: Wait 15-30 minutes before trying again, OR
  - Create a new test email address
  - Try with a different browser/incognito window

## Testing the Fix

Once fixed, you should be able to:
1. Click "Sign Up"
2. Fill in email/password
3. See "Account created!" success message
4. Be redirected to login page
5. Login with your new credentials
6. Access the dashboard

## Still Have Issues?

Check the browser console for specific error messages:
1. Open DevTools (F12)
2. Go to **Console** tab
3. Look for red error messages
4. Share those specific errors for more help

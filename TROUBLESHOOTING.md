# Troubleshooting Guide

## Common Issues

### 1. "Database error saving new user" during signup

**Cause**: This happens when there are database triggers that fail during user creation.

**Quick Fix**:
1. Go to your Supabase Dashboard → SQL Editor
2. Run the cleanup migration first:
```sql
-- Clean up any existing problematic triggers
DROP TRIGGER IF EXISTS create_profile_trigger ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS create_profile_for_user();
DROP FUNCTION IF EXISTS public.handle_new_user();
```
3. Try signing up again

**Permanent Fix**: 
1. Run `000_cleanup_existing_triggers.sql` first
2. Then run `001_create_profiles_with_trigger.sql` for the new trigger setup
3. This will automatically create profiles when users sign up

### 2. Stuck on "Loading..." or "Please wait..." forever

**Cause**: This usually happens when the profiles table hasn't been set up in your Supabase database.

**Solution**: 
- The app will now work without the profiles table
- Check the browser console for warnings about missing profiles table
- To fully set up profiles, run the SQL migration in your Supabase dashboard

### 3. Profile-related features not working

**Cause**: Profiles table not created in database.

**Solution**:
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to "SQL Editor"
4. Run the migration from `supabase/migrations/001_create_profiles_table_simple.sql`

### 4. Voice recognition not working

**Possible causes and solutions**:
- **Browser not supported**: Use Chrome, Edge, or Safari
- **HTTPS required**: Voice recognition requires HTTPS (works on localhost)
- **Microphone permissions**: Allow microphone access when prompted
- **ElevenLabs API issues**: Check your API key in `.env.local`

### 5. Other Authentication issues

**Common fixes**:
- Check your Supabase URL and anon key in `.env.local`
- Verify your Supabase project is active
- Check browser console for detailed error messages

## Development Setup

### Quick Start (without profiles)
```bash
npm install
npm run dev
```

The app will work for basic auth and onboarding, with profile features gracefully disabled.

### Full Setup (with profiles)
1. Set up environment variables in `.env.local`
2. Run the database migration in Supabase (use the simple version)
3. Start the development server

### Testing Authentication
1. Go to `/auth`
2. Create a new account
3. You should be redirected to onboarding (or dashboard if profiles aren't set up)

## Error Messages

### "Database error saving new user"
- **Run the quick fix above** to remove problematic triggers
- This is usually caused by database triggers failing

### "Profiles table not set up"
- **Safe to ignore** if you haven't run the migration yet
- App will work without profiles, just won't save names

### "Microphone permission denied"
- Click the microphone icon in your browser's address bar
- Allow microphone access
- Refresh the page and try again

### "Speech recognition not supported"
- Try a different browser (Chrome recommended)
- Ensure you're on HTTPS or localhost

## Getting Help

If you're still having issues:
1. Check the browser console for error messages
2. Verify all environment variables are set correctly
3. Make sure your Supabase project is properly configured
4. Try the quick fixes above for common database issues

# Database Setup Instructions

## Setting up the Profiles Table

You need to run the SQL migration in your Supabase dashboard to create the profiles table and set up automatic profile creation.

### Steps:

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to the "SQL Editor" tab
4. Create a new query
5. Copy and paste the contents of `supabase/migrations/001_create_profiles_table.sql`
6. Run the query

### What this migration does:

- Creates a `profiles` table with `user_uuid`, `first_name`, `last_name`
- Sets up Row Level Security (RLS) policies
- Creates a trigger to automatically create a profile when a user signs up
- Ensures one profile per user with proper foreign key constraints

### Testing the Setup:

After running the migration:
1. Create a new user account
2. Check that a profile record is automatically created
3. Test the onboarding flow with voice recognition
4. Verify that names are saved to the profile table

### Troubleshooting:

If you get permission errors:
- Make sure you're running the SQL as the database owner
- Check that RLS policies are correctly set up
- Verify the trigger function has SECURITY DEFINER

If the trigger doesn't work:
- Check if the trigger exists: `SELECT * FROM information_schema.triggers WHERE trigger_name = 'create_profile_trigger';`
- Manually test the function: `SELECT create_profile_for_user();`

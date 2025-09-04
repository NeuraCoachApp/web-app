# AI Coach Setup Guide

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Eleven Labs
NEXT_PUBLIC_ELEVENLABS_API_KEY=your_elevenlabs_api_key
NEXT_PUBLIC_ELEVENLABS_VOICE_ID=your_voice_id_or_use_default
```

## Eleven Labs Setup

1. Sign up for an [Eleven Labs account](https://elevenlabs.io/)
2. Get your API key from the profile section
3. Choose a voice ID (or use the default Bella voice: `EXAVITQu4vr4xnSDxMaL`)
4. Add the credentials to your `.env.local` file

## Features

### Onboarding Flow
- Animated blob character (Ava) that speaks using Eleven Labs
- Voice synthesis with personality-matched animations
- Progressive onboarding with user input collection
- Smooth transitions and animations

### Animated Blob
- Changes shape based on state (idle, listening, speaking)
- Dynamic gradients and glow effects
- Responsive animations using Framer Motion

### Voice Integration
- Text-to-speech using Eleven Labs API
- Personality-driven voice synthesis
- Audio controls and error handling
- Optional voice enablement for users

## Running the Application

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` to see the application.

## Database Setup

### Profiles Table
Run the SQL migration in your Supabase dashboard:
1. Go to SQL Editor in Supabase Dashboard
2. Run the contents of `supabase/migrations/001_create_profiles_table.sql`
3. This creates the profiles table and automatic profile creation trigger

## New Features

### Voice Recognition
- AI automatically captures user's first and last name from speech
- Uses browser's built-in Speech Recognition API
- Fallback to manual text input if voice recognition fails
- Names are parsed using intelligent pattern matching

### Profile System
- Automatic profile creation when users sign up
- Stores first_name and last_name separately in profiles table
- Profile data is automatically loaded in AuthContext
- Dashboard displays personalized greeting using profile data

### Enhanced Onboarding
- Voice input button for speaking your name
- Real-time speech recognition feedback
- Visual indicators for listening state
- Blob animation responds to listening state
- Automatic profile updates when names are captured

## Account Creation Changes

- Removed first name and last name fields from registration
- Users are redirected to onboarding flow after signup
- Onboarding collects user name via voice or text input
- Names are automatically saved to user profile

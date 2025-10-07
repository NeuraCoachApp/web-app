# NeuraCoach - AI-Powered Life Coaching Platform

A comprehensive Next.js web application that combines AI-powered coaching with human expertise to help users achieve their goals through structured daily check-ins, progress tracking, and personalized guidance.

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   # Fill in your environment variables (see Environment Setup section)
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open [http://localhost:3000](http://localhost:3000) in your browser**

## 🏗️ Architecture Overview

### Tech Stack
- **Frontend:** Next.js 14 with App Router, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Payments:** Stripe
- **AI/ML:** OpenAI GPT-4, ElevenLabs Voice Synthesis
- **Email:** Resend
- **State Management:** React Context + TanStack Query
- **UI Components:** Custom components with Framer Motion animations

### Core Features
1. **User Onboarding & Goal Creation** - Guided flow to set up personal goals
2. **AI-Powered Daily Check-ins** - Voice-enabled coaching conversations
3. **Progress Tracking** - Calendar views, milestone tracking, analytics
4. **Task Management** - Daily task lists with completion tracking
5. **Subscription Management** - Stripe integration for premium features
6. **Email Notifications** - Automated email sequences

## 📁 Project Structure

```
NeuraCoach/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── emails/               # Email service endpoints
│   │   │   ├── notification/     # General notifications
│   │   │   ├── payment-confirmation/
│   │   │   ├── payment-reminder/
│   │   │   ├── signup/           # Welcome emails
│   │   │   └── welcome/
│   │   └── webhook/
│   │       └── stripe/           # Stripe webhook handler
│   ├── auth/                     # Authentication pages
│   │   ├── page.tsx             # Auth landing
│   │   ├── signin/              # Sign in page
│   │   └── signup/              # Sign up page
│   ├── check-in/                # Daily check-in flow
│   ├── dashboard/               # Main dashboard
│   │   └── settings/            # User settings
│   ├── goal-creation/           # Goal setup flow
│   ├── onboarding/              # User onboarding
│   ├── pricing/                 # Pricing page
│   ├── about/                   # About page
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Landing page
├── src/
│   ├── classes/                 # Data models
│   │   ├── Goal.ts              # Goal class
│   │   ├── Milestone.ts         # Milestone class
│   │   ├── Task.ts              # Task class
│   │   └── Session.ts           # Session class
│   ├── components/              # React components
│   │   ├── auth/                # Authentication components
│   │   ├── check_in/            # Check-in flow components
│   │   ├── dashboard/           # Dashboard components
│   │   │   ├── calendar/        # Calendar views
│   │   │   ├── daily/           # Daily task management
│   │   │   ├── insights/        # Analytics and insights
│   │   │   ├── navigation/      # Dashboard navigation
│   │   │   ├── session/         # Session management
│   │   │   └── timeline/        # Goal timeline views
│   │   ├── goal_creation/       # Goal creation flow
│   │   ├── landing/             # Landing page components
│   │   ├── onboarding/          # Onboarding flow
│   │   ├── pricing/             # Pricing components
│   │   ├── ui/                  # Reusable UI components
│   │   └── voice/               # Voice interaction components
│   ├── contexts/                # React Context providers
│   │   ├── AuthContext.tsx      # Authentication state
│   │   ├── CoachContext.tsx     # Voice coaching state
│   │   ├── QueryProvider.tsx    # TanStack Query setup
│   │   ├── SubscriptionContext.tsx # Subscription state
│   │   └── ThemeContext.tsx     # Theme management
│   ├── hooks/                   # Custom React hooks
│   │   ├── goalCreation/        # Goal creation hooks
│   │   ├── useCheckIn.ts        # Check-in functionality
│   │   ├── useGoals.ts          # Goal management
│   │   ├── useOnboarding.ts     # Onboarding flow
│   │   └── useProfile.ts        # User profile management
│   ├── lib/                     # Utility libraries
│   │   ├── audio/               # Audio processing
│   │   │   ├── audio-analyzer.ts
│   │   │   ├── elevenlabs.ts    # Voice synthesis
│   │   │   ├── speech-recognition.ts
│   │   │   └── speech-timing.ts
│   │   ├── ai-task-adjustment.ts # AI task optimization
│   │   ├── mock-data.ts         # Development data
│   │   ├── openai-steps.ts      # OpenAI integration
│   │   ├── supabase.ts          # Database client
│   │   └── utils.ts             # General utilities
│   └── types/
│       └── database.ts          # TypeScript database types
├── sql/                         # Database schema and functions
│   ├── batch_goal_creation.sql
│   ├── check_in_functions.sql
│   ├── email_functions_fixed.sql
│   ├── extended_email_functions.sql
│   ├── profile_updates.sql
│   ├── rpc_functions.sql        # Database RPC functions
│   ├── stripe_subscription_tables.sql
│   └── task_management_functions.sql
├── public/                      # Static assets
├── package.json
├── next.config.js
├── tailwind.config.ts
└── tsconfig.json
```

## 🛣️ Application Routes

### Public Routes
- `/` - Landing page with hero, features, pricing
- `/about` - About page
- `/pricing` - Pricing plans and Stripe checkout

### Authentication Routes
- `/auth` - Authentication landing page
- `/auth/signin` - Sign in form
- `/auth/signup` - Sign up form

### Protected Routes (require authentication)
- `/onboarding` - New user onboarding flow
- `/goal-creation` - Goal setup and AI-powered planning
- `/dashboard` - Main application dashboard
  - `/dashboard/settings` - User settings and preferences
- `/check-in` - Daily check-in flow with voice coaching

### API Routes
- `/api/emails/*` - Email service endpoints
- `/api/webhook/stripe` - Stripe webhook handler

## 🎯 Core Features & Implementation

### 1. User Onboarding (`/onboarding`)
**Location:** `src/components/onboarding/`
**Key Files:**
- `OnboardingFlow.tsx` - Main onboarding component
- `OnboardingProvider.tsx` - State management
- `NameInputStep.tsx` - Name collection step

**Features:**
- Voice-guided introduction to the platform
- Personal information collection
- Welcome message and platform explanation

### 2. Goal Creation (`/goal-creation`)
**Location:** `src/components/goal_creation/`
**Key Files:**
- `GoalCreationFlow.tsx` - Main goal creation flow
- `GoalCreationProvider.tsx` - State management
- `ComprehensiveInputStep.tsx` - Multi-input collection

**Features:**
- AI-powered goal breakdown using OpenAI GPT-4
- Structured milestone and task generation
- Voice-guided input collection
- Automatic goal planning with 4-8 milestones and daily tasks

### 3. Dashboard (`/dashboard`)
**Location:** `src/components/dashboard/`
**Key Files:**
- `navigation/DashboardContent.tsx` - Main dashboard layout
- `daily/DailyTaskList.tsx` - Daily task management
- `timeline/GoalTimeline.tsx` - Goal progress visualization
- `insights/GoalInsights.tsx` - Analytics and progress insights
- `calendar/GoalCalendar.tsx` - Calendar-based progress tracking

**Features:**
- **Today's Tasks Tab:** Daily task list with completion tracking
- **Milestones Tab:** Visual timeline of goal progress
- **Insights Tab:** Analytics, streaks, and progress metrics
- Goal switching and management
- Check-in availability indicators

### 4. Daily Check-ins (`/check-in`)
**Location:** `src/components/check_in/`
**Key Files:**
- `CheckInFlow.tsx` - Main check-in flow controller
- `VoiceCoachChat.tsx` - AI-powered voice conversation
- `ProgressAssessment.tsx` - Task completion assessment
- `MoodMotivationInput.tsx` - Mood and motivation tracking

**Features:**
- **Progress Assessment:** Task completion review
- **Voice Coaching:** AI-powered conversation using OpenAI
- **Mood Tracking:** Slider-based mood and motivation input
- **Completion Summary:** Session summary and next steps

### 5. Voice Coaching System
**Location:** `src/components/voice/` and `src/contexts/CoachContext.tsx`
**Key Features:**
- ElevenLabs voice synthesis for AI responses
- Speech recognition for user input
- Real-time audio analysis and visualization
- Voice interaction state management

### 6. Subscription Management
**Location:** `app/api/webhook/stripe/route.ts`
**Features:**
- Stripe webhook handling for subscription events
- Two-tier pricing: AI Coach ($20/month) and AI + Human Coach ($280/month)
- Automatic subscription status updates
- Payment confirmation emails

## 🗄️ Database Schema

### Core Tables
- **`profile`** - User profiles and subscription status
- **`goal`** - User goals with AI-generated content
- **`milestone`** - Goal milestones with progress tracking
- **`task`** - Daily tasks with completion status
- **`session`** - Check-in session records
- **`subscriptions`** - Stripe subscription data
- **`email_logs`** - Email delivery tracking

### Key Relationships
- Users have many goals
- Goals have many milestones
- Milestones have many tasks
- Users have many sessions (check-ins)
- Users have subscription records

### RPC Functions
**Location:** `sql/rpc_functions.sql`
- `get_goal()` - Fetch goal with milestones and tasks
- `create_profile()` - Create user profile
- `upsert_subscription()` - Handle subscription updates
- `can_check_in_now()` - Check check-in availability
- `get_user_streak()` - Calculate user streak data

## 🔧 Environment Setup

Create a `.env.local` file with the following variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# ElevenLabs Configuration
ELEVENLABS_API_KEY=your_elevenlabs_api_key

# Stripe Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Email Configuration
NEXT_PUBLIC_RESEND_API_KEY=your_resend_api_key

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🚀 Development Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run ESLint

# Database
npm run types:generate  # Generate TypeScript types from Supabase
npm run types:watch     # Watch for database changes and regenerate types
```

## 🎨 Key Components & Patterns

### Context Providers
The app uses multiple React Context providers for state management:
- **AuthProvider:** User authentication and session management
- **CoachProvider:** Voice coaching and audio state
- **SubscriptionProvider:** Subscription status and billing
- **ThemeProvider:** Dark/light mode theming
- **QueryProvider:** TanStack Query for server state

### Custom Hooks
- **`useAuth()`** - Authentication state and methods
- **`useCoach()`** - Voice coaching functionality
- **`useGoals()`** - Goal management and CRUD operations
- **`useCheckIn()`** - Check-in flow state management
- **`useProfile()`** - User profile management

### AI Integration
- **OpenAI GPT-4:** Goal breakdown, coaching conversations, task generation
- **ElevenLabs:** Voice synthesis for AI responses
- **Speech Recognition:** Voice input for user interactions

## 🔄 Data Flow

1. **User Registration:** Supabase Auth → Profile Creation → Onboarding
2. **Goal Creation:** User Input → OpenAI Processing → Database Storage
3. **Daily Check-ins:** Task Assessment → AI Conversation → Progress Update
4. **Subscription:** Stripe Checkout → Webhook → Database Update → Email Notification

## 🚨 Important Notes for Developers

### Database Setup
1. Run all SQL files in the `sql/` directory in your Supabase SQL editor
2. Ensure RLS (Row Level Security) policies are properly configured
3. Set up the required RPC functions for data fetching

### Voice Features
- Requires user interaction before audio playback (browser security)
- ElevenLabs API key needed for voice synthesis
- Speech recognition uses browser APIs

### Stripe Integration
- Webhook endpoint: `/api/webhook/stripe`
- Handles subscription creation, updates, and cancellations
- Updates user subscription status in database

### Email System
- Uses Resend for email delivery
- All emails are logged in the `email_logs` table
- Email templates are inline HTML in API routes

## 🐛 Common Issues & Solutions

1. **Voice not working:** Ensure user has interacted with the page first
2. **Database errors:** Check RLS policies and RPC function permissions
3. **Stripe webhooks failing:** Verify webhook secret and endpoint URL
4. **Email delivery issues:** Check Resend API key and domain configuration

## 📈 Performance Considerations

- Uses TanStack Query for efficient data fetching and caching
- Implements proper loading states and error boundaries
- Voice synthesis includes retry logic and error handling
- Database queries are optimized with proper indexing

## 🔐 Security

- Row Level Security (RLS) enabled on all database tables
- API routes include proper error handling and validation
- Stripe webhook signature verification
- User data isolation through RLS policies

---

This documentation should provide a comprehensive understanding of the NeuraCoach application architecture, features, and implementation details for any developer taking over the project.
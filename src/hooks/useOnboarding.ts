import { useQuery } from '@tanstack/react-query'
import { useState, useCallback } from 'react'
import { useAuth } from '@/src/contexts/AuthContext'
import { useProfile, Profile, useUpdateProfile } from './useProfile'
import { goalsKeys, useCreateGoal } from './useGoals'
import { supabase } from '@/src/lib/supabase'
import { useSpeechRecognition } from '@/src/lib/speech-recognition'

export interface OnboardingStatus {
  needsProfileSetup: boolean
  needsGoalSetup: boolean
  shouldRedirectToOnboarding: boolean
  onboardingStep?: 'profile' | 'goal'
}

export interface OnboardingStep {
  id: string
  text: string
  subtext: string
  personality: string
}

export interface OnboardingState {
  currentStep: number
  userName: string
  firstName: string
  lastName: string
  showInput: boolean
  reason: string
  goal: string
  notificationTime: string
  speechError: string
  onboardingChecked: boolean
  flowCompleted: boolean // Flag to prevent reinitialization after completion
}

// New onboarding flow matching the specified script
export const onboardingSteps: OnboardingStep[] = [
  {
    id: 'greeting',
    text: "Hi there. Welcome.",
    subtext: "",
    personality: "warm and welcoming"
  },
  {
    id: 'name_input',
    text: "What is your name?",
    subtext: "",
    personality: "warm and friendly"
  },
  {
    id: 'personal_welcome',
    text: "Welcome [Name]!",
    subtext: "",
    personality: "warm and personalized"
  },
  {
    id: 'ava_introduction',
    text: "My name is Ava and I'll be guiding you through a new journey.",
    subtext: "",
    personality: "friendly and confident"
  },
  {
    id: 'growth_message',
    text: "If you want to grow, we'll guide you through the journey in a way no other platform has done before.",
    subtext: "",
    personality: "inspiring and confident"
  },
  {
    id: 'statistics',
    text: "Over 90% of people who set goals say achieving them makes them feel more confident and fulfilled, yet most struggle to stay consistent.",
    subtext: "",
    personality: "informative and understanding"
  },
  {
    id: 'reassurance',
    text: "Know you are not alone.",
    subtext: "",
    personality: "comforting and supportive"
  },
  {
    id: 'mission_statement',
    text: "We'll help you understand your goals and mindset, and feel more in control, through daily reflections and personalized exercises, one small step at a time.",
    subtext: "",
    personality: "encouraging and methodical"
  }
]

// Query keys for React Query
export const onboardingKeys = {
  all: ['onboarding'] as const,
  status: (userId: string) => [...onboardingKeys.all, 'status', userId] as const,
}

// Note: getUserGoals function moved to useGoals.ts to avoid duplication

/**
 * Check user's onboarding status based on profile only
 * Goals are handled separately in goal creation flow
 */
async function checkOnboardingStatus(
  userUuid: string, 
  profile: Profile | null
): Promise<OnboardingStatus> {
  // Check if profile has first_name and last_name
  const hasProfileInfo = profile?.first_name && profile?.last_name
  
  // If no profile info, needs profile onboarding (takes precedence)
  if (!hasProfileInfo) {
    return {
      needsProfileSetup: true,
      needsGoalSetup: false, // Goals handled separately
      shouldRedirectToOnboarding: true,
      onboardingStep: 'profile'
    }
  }
  
  // Profile is complete - no onboarding needed
  // Goal creation is handled separately
  return {
    needsProfileSetup: false,
    needsGoalSetup: false,
    shouldRedirectToOnboarding: false
  }
}

/**
 * Hook to fetch and cache onboarding status
 * This depends on both profile and goals data
 */
export function useOnboardingStatus(userId?: string) {
  const { data: profile } = useProfile(userId)

  return useQuery({
    queryKey: onboardingKeys.status(userId || ''),
    queryFn: async (): Promise<OnboardingStatus> => {
      if (!userId) {
        return {
          needsProfileSetup: true,
          needsGoalSetup: true,
          shouldRedirectToOnboarding: true,
          onboardingStep: 'profile'
        }
      }
      
      return await checkOnboardingStatus(userId, profile ?? null)
    },
    enabled: !!userId && profile !== undefined, // Wait for profile to be loaded
    staleTime: 2 * 60 * 1000, // 2 minutes (shorter than profile/goals since it's computed)
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook to check if user needs onboarding
 * Returns loading state and redirect decision
 */
export function useOnboardingRedirect() {
  const { user } = useAuth()
  const { data: onboardingStatus, isLoading, error } = useOnboardingStatus(user?.id)

  return {
    shouldRedirect: onboardingStatus?.shouldRedirectToOnboarding ?? false,
    onboardingStep: onboardingStatus?.onboardingStep,
    isLoading,
    error,
    status: onboardingStatus
  }
}

/**
 * Utility function to get current step text with name replacements
 */
export function getCurrentStepText(step: OnboardingStep, userName?: string, firstName?: string): string {
  if (step.id === 'personal_welcome') {
    return step.text.replace('[Name]', firstName || userName || 'there')
  }
  return step.text
}

/**
 * Main hook for managing onboarding flow state and actions
 */
export function useOnboardingFlow() {
  const { user } = useAuth()
  const { data: profile } = useProfile(user?.id)
  const { data: onboardingStatus } = useOnboardingStatus(user?.id)
  const updateProfileMutation = useUpdateProfile()
  const createGoalMutation = useCreateGoal()
  const { extractName } = useSpeechRecognition()

  // State management
  const [state, setState] = useState<OnboardingState>({
    currentStep: 0,
    userName: '',
    firstName: '',
    lastName: '',
    showInput: false,
    reason: '',
    goal: '',
    notificationTime: '09:00',
    speechError: '',
    onboardingChecked: false,
    flowCompleted: false
  })

  // Initialize starting step based on onboarding status
  const initializeStep = useCallback(() => {
    // Only initialize once when we first load the onboarding
    if (!user || !onboardingStatus || state.onboardingChecked) return

    // If flow was completed in this session, don't reinitialize
    if (state.flowCompleted) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🚫 [Onboarding] Flow already completed in this session, preventing reinitialization')
      }
      return
    }

    // If no onboarding needed, don't initialize
    if (!onboardingStatus.shouldRedirectToOnboarding) {
      return
    }

    // Don't initialize if we're already past the first few steps (prevents reset after profile save)
    if (state.currentStep > 2) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🚫 [Onboarding] Already in progress, preventing reset', {
          currentStep: state.currentStep,
          onboardingChecked: state.onboardingChecked
        })
      }
      return
    }

    // Debug logging to track initialization
    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 [Onboarding] Initializing onboarding flow', {
        currentStep: state.currentStep,
        onboardingChecked: state.onboardingChecked,
        profile: profile ? { first_name: profile.first_name, last_name: profile.last_name } : null
      })
    }

    // Always start from beginning for profile setup (slim flow)
    setState(prev => ({ 
      ...prev, 
      onboardingChecked: true,
      currentStep: 0, // Explicitly start at step 0
      firstName: profile?.first_name || '',
      lastName: profile?.last_name || '',
      userName: profile?.first_name ? 
        profile.first_name + (profile.last_name ? ` ${profile.last_name}` : '') : ''
    }))
  }, [user, profile, onboardingStatus, state.onboardingChecked, state.currentStep, state.flowCompleted])

  // Handle voice transcript for name input
  const handleVoiceTranscript = useCallback(async (transcript: string, isFinal: boolean) => {
    if (!isFinal) {
      setState(prev => ({ ...prev, userName: transcript }))
      return
    }

    setState(prev => ({ ...prev, speechError: '' }))
    
    try {
      const nameResult = extractName(transcript)
      if (nameResult.confidence > 0.3) {
        const newFirstName = nameResult.firstName || state.firstName
        const newLastName = nameResult.lastName || state.lastName
        
        setState(prev => ({
          ...prev,
          firstName: newFirstName,
          lastName: newLastName,
          userName: newFirstName + (newLastName ? ` ${newLastName}` : '')
        }))
        
        // Save to profile if we have a user
        if (user && (nameResult.firstName || nameResult.lastName)) {
          try {
            await updateProfileMutation.mutateAsync({
              first_name: nameResult.firstName || state.firstName || null,
              last_name: nameResult.lastName || state.lastName || null
            })
          } catch (error) {
            console.warn('Failed to save profile (database may not be set up):', error)
          }
        }
      } else {
        setState(prev => ({
          ...prev,
          userName: transcript,
          speechError: 'Could not extract first/last name, but kept your input.'
        }))
      }
    } catch (error) {
      console.error('Name extraction error:', error)
      setState(prev => ({ ...prev, userName: transcript }))
    }
  }, [user, state.firstName, state.lastName, extractName, updateProfileMutation])

  // Handle next step logic for new onboarding flow
  const handleNext = useCallback(async () => {
    if (state.currentStep === 1 && (state.userName.trim() || (state.firstName && state.firstName.trim()))) {
      // Process name input
      if (state.firstName && !state.userName.trim()) {
        setState(prev => ({
          ...prev,
          userName: state.firstName + (state.lastName ? ` ${state.lastName}` : '')
        }))
      }
      
      let finalFirstName: string | null = state.firstName
      let finalLastName: string | null = state.lastName
      
      // Extract names from manual input if needed
      if (state.userName.trim() && !state.firstName && !state.lastName) {
        const nameParts = state.userName.trim().split(/\s+/)
        if (nameParts.length >= 1) {
          finalFirstName = nameParts[0]
          setState(prev => ({ ...prev, firstName: nameParts[0] }))
        }
        if (nameParts.length >= 2) {
          finalLastName = nameParts.slice(1).join(' ')
          setState(prev => ({ ...prev, lastName: nameParts.slice(1).join(' ') }))
        }
        
        // Try AI extraction for complex patterns
        if (nameParts.length === 1 && (state.userName.toLowerCase().includes('name is') || 
            state.userName.toLowerCase().includes('i am') || state.userName.toLowerCase().includes("i'm"))) {
          try {
            const nameResult = extractName(state.userName.trim())
            if (nameResult.confidence > 0.3 && nameResult.firstName !== nameParts[0]) {
              finalFirstName = nameResult.firstName || null
              finalLastName = nameResult.lastName || null
              setState(prev => ({
                ...prev,
                firstName: nameResult.firstName || '',
                lastName: nameResult.lastName || ''
              }))
            }
          } catch (error) {
            console.warn('Failed to extract name from manual input:', error)
          }
        }
      }
      
      // Save profile and wait for completion
      if (user && (finalFirstName || finalLastName)) {
        try {
          await updateProfileMutation.mutateAsync({
            first_name: finalFirstName || null,
            last_name: finalLastName || null
          })
          // Wait a bit for cache invalidation to propagate
          await new Promise(resolve => setTimeout(resolve, 100))
        } catch (error) {
          console.warn('Failed to save profile (database may not be set up):', error)
        }
      }
      
      setState(prev => ({ ...prev, currentStep: 2, showInput: false }))
    } else if (state.currentStep < onboardingSteps.length - 1) {
      setState(prev => ({ ...prev, currentStep: state.currentStep + 1 }))
    }
    // Final step will be handled by navigation to dashboard
  }, [state, user, extractName, updateProfileMutation])

  // Auto-advance for non-input steps
  const shouldAutoAdvance = useCallback(() => {
    const inputSteps = [1] // Only name_input step requires input
    return !inputSteps.includes(state.currentStep)
  }, [state.currentStep])

  // Update state functions
  const updateState = useCallback((updates: Partial<OnboardingState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }, [])

  const setCurrentStep = useCallback((step: number) => {
    setState(prev => ({ ...prev, currentStep: step }))
  }, [])

  return {
    state,
    updateState,
    setCurrentStep,
    initializeStep,
    handleVoiceTranscript,
    handleNext,
    shouldAutoAdvance,
    getCurrentText: () => getCurrentStepText(
      onboardingSteps[state.currentStep], 
      state.userName, 
      state.firstName
    ),
    currentStepData: onboardingSteps[state.currentStep],
    isInputStep: [1].includes(state.currentStep), // Only name_input step requires input
    isLastStep: state.currentStep === onboardingSteps.length - 1,
    profile,
    onboardingStatus
  }
}

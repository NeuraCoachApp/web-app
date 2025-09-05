'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/src/contexts/AuthContext'
import { useCoach } from '@/src/contexts/CoachContext'
import { useRouter, useSearchParams } from 'next/navigation'
import AnimatedBlob from '@/src/components/ui/animated-blob'
import VoiceInput from '@/src/components/ui/voice-input'
import { motion, AnimatePresence } from 'framer-motion'
import { useSpeechRecognition } from '@/src/lib/speech-recognition'
import { useProfile, useUpdateProfile } from '@/src/hooks/useProfile'
import { useCreateGoal } from '@/src/hooks/useGoals'
import { useOnboardingStatus } from '@/src/hooks/useOnboarding'

const onboardingSteps = [
  {
    id: 'welcome',
    text: "Hi there, Welcome!",
    subtext: "What is your name?",
    personality: "warm and welcoming"
  },
  {
    id: 'greeting',
    text: "Welcome ____!",
    subtext: "My name is Ava and I'll be guiding you through a new journey.",
    personality: "friendly and encouraging"
  },
  {
    id: 'anxiety',
    text: "If you have anxiety, you're not alone.",
    subtext: "",
    personality: "empathetic and understanding"
  },
  {
    id: 'stats',
    text: "Over 8% of adults in the US alone report symptoms.",
    subtext: "",
    personality: "informative but gentle"
  },
  {
    id: 'not_alone',
    text: "Know you are not alone.",
    subtext: "",
    personality: "reassuring and supportive"
  },
  {
    id: 'understanding',
    text: "We'll help you understand your anxiety and find tools to control it - through daily check-ins, one small step at a time.",
    subtext: "",
    personality: "hopeful and motivating"
  },
  {
    id: 'questions_before',
    text: "Before we start, I have a few questions.",
    subtext: "",
    personality: "gentle and curious"
  },
  {
    id: 'questions_time',
    text: "So tell me ______",
    subtext: "What brings you to me today?",
    personality: "caring and attentive"
  },
  {
    id: 'goal_setup',
    text: "What would you like to work on?",
    subtext: "Tell me your main goal or what you'd like to achieve.",
    personality: "supportive and focused"
  },
  {
    id: 'notification_time',
    text: "What time would you like to receive daily notifications?",
    subtext: "",
    personality: "helpful and practical"
  },
  {
    id: 'daily_checkins',
    text: "Now that people who check in daily see an increase in mood 5x faster than those who do not check in regularly.",
    subtext: "",
    personality: "encouraging and factual"
  },
  {
    id: 'weekly_sessions',
    text: "Many people see results in as little as 2 weeks!",
    subtext: "",
    personality: "optimistic and motivating"
  },
  {
    id: 'final',
    text: "Alright ______, that's all the talking for now. Let's get started!",
    subtext: "",
    personality: "excited and ready"
  }
]

export default function Onboarding() {
  const { user, loading } = useAuth()
  const { data: profile } = useProfile(user?.id)
  const { data: onboardingStatus } = useOnboardingStatus(user?.id)
  const updateProfileMutation = useUpdateProfile()
  const createGoalMutation = useCreateGoal()
  const { 
    isSpeaking, 
    isListening, 
    hasVoiceEnabled, 
    enableVoice, 
    speak
  } = useCoach()
  const { extractName } = useSpeechRecognition()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [currentStep, setCurrentStep] = useState(0)
  const [userName, setUserName] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [showInput, setShowInput] = useState(false)
  const [reason, setReason] = useState('')
  const [goal, setGoal] = useState('')
  const [notificationTime, setNotificationTime] = useState('09:00')
  const [speechError, setSpeechError] = useState('')
  const [onboardingChecked, setOnboardingChecked] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth')
    }
  }, [user, loading, router])

  // Check onboarding status and set starting step
  useEffect(() => {
    if (!user || loading || onboardingChecked || !onboardingStatus) return

    // If no onboarding needed, redirect to dashboard
    if (!onboardingStatus.shouldRedirectToOnboarding) {
      router.push('/dashboard')
      return
    }

    // Set starting step based on what's needed
    if (onboardingStatus.onboardingStep === 'goal') {
      // Skip to goal setup step (step 8 in the array)
      const goalStepIndex = onboardingSteps.findIndex(step => step.id === 'goal_setup')
      if (goalStepIndex !== -1) {
        setCurrentStep(goalStepIndex)
        // Pre-fill profile info if available
        if (profile?.first_name) {
          setFirstName(profile.first_name)
          setUserName(profile.first_name + (profile.last_name ? ` ${profile.last_name}` : ''))
        }
        if (profile?.last_name) {
          setLastName(profile.last_name)
        }
      }
    }
    // If onboardingStep is 'profile' or undefined, start from beginning (step 0)
    
    setOnboardingChecked(true)
  }, [user, profile, loading, onboardingChecked, onboardingStatus, router])

  useEffect(() => {
    // Speak the current step text when it changes
    const speakCurrentStep = async () => {
      if (hasVoiceEnabled && currentStep >= 0) {
        const text = getCurrentText()
        const subtext = onboardingSteps[currentStep]?.subtext
        const fullText = subtext ? `${text} ${subtext}` : text
        
        // The CoachContext will handle preventing duplicates
        await speak(fullText)
      }
    }

    speakCurrentStep()
  }, [currentStep, userName, hasVoiceEnabled, speak])

  useEffect(() => {
    // Auto-advance for some steps (skip input steps)
    const inputSteps = [0, 7, 8, 9] // welcome (name), questions_time (reason), goal_setup, notification_time
    if (currentStep > 0 && !inputSteps.includes(currentStep)) {
      const timer = setTimeout(() => {
        if (currentStep < onboardingSteps.length - 1) {
          setCurrentStep(currentStep + 1)
        } else {
          router.push('/dashboard')
        }
      }, 4000)
      
      return () => clearTimeout(timer)
    }
  }, [currentStep, router])

  const handleVoiceTranscript = async (transcript: string, isFinal: boolean) => {
    if (!isFinal) {
      // Show interim results in the input
      setUserName(transcript)
      return
    }

    // Process final transcript
    setSpeechError('')
    
    try {
      const nameResult = extractName(transcript)
      
      if (nameResult.confidence > 0.3) {
        if (nameResult.firstName) {
          setFirstName(nameResult.firstName)
          setUserName(nameResult.firstName + (nameResult.lastName ? ` ${nameResult.lastName}` : ''))
        }
        if (nameResult.lastName) {
          setLastName(nameResult.lastName)
        }
        
        // Save to profile if we have a user
        if (user && (nameResult.firstName || nameResult.lastName)) {
          try {
            await updateProfileMutation.mutateAsync({
              first_name: nameResult.firstName || firstName || "",
              last_name: nameResult.lastName || lastName || ""
            })
          } catch (error) {
            console.warn('Failed to save profile (database may not be set up):', error)
          }
        }
      } else {
        // Keep the transcript as the user name if we can't extract structured names
        setUserName(transcript)
        setSpeechError('Could not extract first/last name, but kept your input.')
      }
    } catch (error) {
      console.error('Name extraction error:', error)
      setUserName(transcript) // Keep the raw transcript
    }
  }

  const handleNext = async () => {
    if (currentStep === 0 && (userName.trim() || (firstName && firstName.trim()))) {
      // If we have voice-captured name, make sure userName is set
      if (firstName && !userName.trim()) {
        setUserName(firstName + (lastName ? ` ${lastName}` : ''))
      }
      
      // Save profile if we haven't already
      if (user && (firstName || lastName)) {
        try {
          await updateProfileMutation.mutateAsync({
            first_name: firstName || "",
            last_name: lastName || ""
          })
        } catch (error) {
          console.warn('Failed to save profile (database may not be set up):', error)
        }
      }
      
      setCurrentStep(1)
      setShowInput(false)
    } else if (currentStep === 7 && reason.trim()) {
      setCurrentStep(8)
    } else if (currentStep === 8 && goal.trim()) {
      // Save the goal
      if (user && goal.trim()) {
        try {
          await createGoalMutation.mutateAsync(goal.trim())
        } catch (error) {
          console.warn('Failed to save goal:', error)
        }
      }
      setCurrentStep(9)
    } else if (currentStep === 9) {
      setCurrentStep(10)
    } else if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      router.push('/dashboard')
    }
  }

  const getCurrentText = () => {
    const step = onboardingSteps[currentStep]
    if (!step) return ''
    if (step.id === 'greeting' || step.id === 'final') {
      return step.text.replace('____', userName || firstName || 'there')
    }
    if (step.id === 'questions_time') {
      return step.text.replace('______', userName || firstName || 'friend')
    }
    return step.text
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Voice Toggle */}
        {!hasVoiceEnabled && (
          <div className="mb-8">
            <button
              onClick={enableVoice}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors mb-4"
            >
              🔊 Enable Voice (Recommended)
            </button>
            <p className="text-sm text-gray-400">
              For the best experience, enable voice to hear Ava speak
            </p>
          </div>
        )}

        {/* Animated Blob */}
        <div className="flex justify-center mb-8">
          <AnimatedBlob 
            isSpeaking={isSpeaking}
            isListening={isListening}
            size={200}
            className="mb-8"
          />
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <h1 className="text-2xl md:text-3xl font-medium text-center leading-relaxed">
              {getCurrentText()}
            </h1>
            
            {onboardingSteps[currentStep].subtext && (
              <p className="text-lg text-gray-300 text-center">
                {onboardingSteps[currentStep].subtext}
              </p>
            )}

            {/* Name Input */}
            {currentStep === 0 && (
              <div className="mt-8 space-y-4">
                <div className="relative max-w-md mx-auto">
                  <input
                    type="text"
                    placeholder="Enter your name or use voice input"
                    value={userName}
                    onChange={(e) => {
                      setUserName(e.target.value)
                      // Clear voice-captured names if user starts typing manually
                      if (e.target.value !== userName) {
                        setFirstName('')
                        setLastName('')
                      }
                    }}
                    className="w-full px-4 py-3 pr-12 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                  />
                  
                  {/* Voice Input Button inside the text input */}
                  {hasVoiceEnabled && (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                      <VoiceInput
                        onTranscript={handleVoiceTranscript}
                        onError={(error) => setSpeechError(error)}
                        placeholder="Say your name..."
                      />
                    </div>
                  )}
                </div>
                
                {speechError && (
                  <div className="text-red-400 text-sm text-center max-w-md mx-auto">
                    {speechError}
                  </div>
                )}
                
                {(firstName || lastName) && (
                  <div className="text-center text-sm text-green-400">
                    Captured: {firstName} {lastName}
                  </div>
                )}
                
                <button
                  onClick={handleNext}
                  disabled={!userName.trim() && !firstName}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Continue
                </button>
              </div>
            )}

            {/* Reason Input */}
            {currentStep === 7 && (
              <div className="mt-8 space-y-4">
                <textarea
                  placeholder="Tell me what brings you here today..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  className="w-full max-w-md mx-auto block px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  autoFocus
                />
                <button
                  onClick={handleNext}
                  disabled={!reason.trim()}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Continue
                </button>
              </div>
            )}

            {/* Goal Input */}
            {currentStep === 8 && (
              <div className="mt-8 space-y-4">
                <textarea
                  placeholder="What would you like to work on or achieve?"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  rows={4}
                  className="w-full max-w-md mx-auto block px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  autoFocus
                />
                <button
                  onClick={handleNext}
                  disabled={!goal.trim()}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Set Goal
                </button>
              </div>
            )}

            {/* Notification Time Input */}
            {currentStep === 9 && (
              <div className="mt-8 space-y-4">
                <div className="flex flex-col items-center space-y-4">
                  <input
                    type="time"
                    value={notificationTime}
                    onChange={(e) => setNotificationTime(e.target.value)}
                    className="px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleNext}
                    className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Set Notification Time
                  </button>
                </div>
              </div>
            )}

            {/* Auto-advance steps */}
            {currentStep > 0 && currentStep !== 7 && currentStep !== 8 && currentStep !== 9 && currentStep !== onboardingSteps.length - 1 && (
              <div className="mt-8">
                <div className="w-full bg-gray-700 rounded-full h-1">
                  <motion.div
                    className="bg-blue-500 h-1 rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 4 }}
                  />
                </div>
              </div>
            )}

            {/* Final step button */}
            {currentStep === onboardingSteps.length - 1 && (
              <div className="mt-8">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="px-12 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 text-lg font-medium"
                >
                  Let's Get Started!
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Progress indicator */}
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="flex space-x-2">
            {onboardingSteps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index <= currentStep ? 'bg-blue-500' : 'bg-gray-600'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

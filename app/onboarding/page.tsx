'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/src/contexts/AuthContext'
import { useCoach } from '@/src/contexts/CoachContext'
import { useRouter } from 'next/navigation'
import AnimatedBlob from '@/src/components/ui/animated-blob'
import { motion, AnimatePresence } from 'framer-motion'
import { updateProfile } from '@/src/lib/profile'
import { Mic, MicOff } from 'lucide-react'

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
  const { user, loading, refreshProfile } = useAuth()
  const { 
    isSpeaking, 
    isListening, 
    hasVoiceEnabled, 
    enableVoice, 
    speak, 
    startListening, 
    stopListening,
    requestMicPermission 
  } = useCoach()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [userName, setUserName] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [showInput, setShowInput] = useState(false)
  const [reason, setReason] = useState('')
  const [notificationTime, setNotificationTime] = useState('09:00')
  const [speechError, setSpeechError] = useState('')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth')
    }
  }, [user, loading, router])

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
    const inputSteps = [0, 7, 8] // welcome (name), questions_time (reason), notification_time
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

  const handleVoiceInput = async () => {
    setSpeechError('')

    try {
      // Request microphone permission first
      const hasPermission = await requestMicPermission()
      if (!hasPermission) {
        setSpeechError('Microphone permission is required for voice input')
        return
      }

      const nameResult = await startListening()
      
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
            await updateProfile(user.id, {
              first_name: nameResult.firstName || firstName || null,
              last_name: nameResult.lastName || lastName || null
            })
            await refreshProfile()
          } catch (error) {
            console.warn('Failed to save profile (database may not be set up):', error)
          }
        }
      } else {
        setSpeechError('Could not understand your name. Please try again or type it manually.')
      }
    } catch (error) {
      console.error('Speech recognition error:', error)
      if (error.message?.includes('permission')) {
        setSpeechError('Microphone permission denied. Please allow microphone access and try again.')
      } else {
        setSpeechError('Failed to recognize speech. Please try again or type your name.')
      }
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
          await updateProfile(user.id, {
            first_name: firstName || null,
            last_name: lastName || null
          })
          await refreshProfile()
        } catch (error) {
          console.warn('Failed to save profile (database may not be set up):', error)
        }
      }
      
      setCurrentStep(1)
      setShowInput(false)
    } else if (currentStep === 7 && reason.trim()) {
      setCurrentStep(8)
    } else if (currentStep === 8) {
      setCurrentStep(9)
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
                {hasVoiceEnabled && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <button
                        onClick={isListening ? stopListening : handleVoiceInput}
                        className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
                          isListening
                            ? 'bg-red-600 hover:bg-red-700'
                            : 'bg-purple-600 hover:bg-purple-700'
                        } text-white`}
                      >
                        {isListening ? (
                          <>
                            <MicOff className="w-4 h-4" />
                            Listening... (Click to stop)
                          </>
                        ) : (
                          <>
                            <Mic className="w-4 h-4" />
                            Speak Your Name
                          </>
                        )}
                      </button>
                    </div>
                    
                    {speechError && (
                      <div className="text-red-400 text-sm text-center">
                        {speechError}
                      </div>
                    )}
                    
                    <div className="text-gray-400 text-sm text-center">
                      or type it below
                    </div>
                  </div>
                )}
                
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={userName}
                  onChange={(e) => {
                    setUserName(e.target.value)
                    // Clear voice-captured names if user starts typing
                    if (e.target.value !== userName) {
                      setFirstName('')
                      setLastName('')
                    }
                  }}
                  className="w-full max-w-md mx-auto block px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus={!hasVoiceEnabled}
                />
                
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

            {/* Notification Time Input */}
            {currentStep === 8 && (
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
            {currentStep > 0 && currentStep !== 7 && currentStep !== 8 && currentStep !== onboardingSteps.length - 1 && (
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

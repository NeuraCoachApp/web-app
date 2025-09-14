'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useCheckInContext } from './CheckInProvider'
import { CoachBlob } from '@/src/components/voice/CoachBlob'
import { FlowInput } from '@/src/components/voice/FlowInput'
import { RealTimeCaptions } from '@/src/components/voice/RealTimeCaptions'
import { useCoach } from '@/src/contexts/CoachContext'
import OpenAI from 'openai'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPEN_AI_STEPS_CREATOR,
  dangerouslyAllowBrowser: true
})

interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
}

export function VoiceCoachChat() {
  const {
    selectedGoal,
    dailyProgress,
    todaysTasks,
    checkInData,
    updateCheckInData,
    setCurrentStep,
    getProgressPercentage
  } = useCheckInContext()

  const { speak, markUserInteracted, hasUserInteracted, isSpeaking, isPreparingSpeech } = useCoach()
  
  const [conversation, setConversation] = useState<ConversationMessage[]>([])
  const [currentInput, setCurrentInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [conversationComplete, setConversationComplete] = useState(false)
  const [sessionSummary, setSessionSummary] = useState('')
  const [hasStarted, setHasStarted] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  
  const chatStartTime = useRef<Date>(new Date())
  const messageCount = useRef<number>(0)

  // Auto-start conversation if user has already interacted (from previous step)
  useEffect(() => {
    if (!hasStarted && hasUserInteracted) {
      console.log('🎤 [VoiceCoachChat] User interaction detected, auto-starting conversation')
      const timer = setTimeout(async () => {
        setHasStarted(true)
        try {
          await startConversation()
        } catch (error) {
          console.error('❌ [VoiceCoachChat] Error auto-starting conversation:', error)
          setVoiceError('Voice synthesis failed to start. Please try again or continue with text input.')
        }
      }, 1000) // 1 second delay to ensure component is mounted
      
      return () => clearTimeout(timer)
    }
  }, [hasUserInteracted, hasStarted])

  // Check if conversation should end (5 minutes or meaningful progress)
  useEffect(() => {
    const now = new Date()
    const timeElapsed = now.getTime() - chatStartTime.current.getTime()
    const fiveMinutes = 5 * 60 * 1000

    // Only end conversation if time limit reached (5 minutes)
    // Remove automatic ending based on message count for now
    const userMessages = conversation.filter(msg => msg.role === 'user').length
    
    if (timeElapsed >= fiveMinutes && userMessages >= 2) {
      if (!conversationComplete) {
        console.log('🎤 [VoiceCoachChat] Auto-ending conversation due to time limit:', {
          timeElapsed: Math.round(timeElapsed / 1000),
          userMessages,
          totalMessages: conversation.length
        })
        handleConversationEnd()
      }
    }
  }, [conversation, conversationComplete])

  const startConversation = async () => {
    try {
      const progressPercentage = getProgressPercentage()
      const completedTasks = todaysTasks?.filter((task: any) => task.isCompleted) || []
      const incompleteTasks = todaysTasks?.filter((task: any) => !task.isCompleted) || []
      
      let openingMessage = `I see you completed ${progressPercentage}% of your tasks today. `
      
      if (progressPercentage >= 80) {
        openingMessage += `That's excellent progress! You completed ${completedTasks.length} out of ${todaysTasks?.length || 0} tasks. I'd love to hear about how your day went and what helped you stay on track.`
      } else {
        openingMessage += `I notice you had ${incompleteTasks.length} tasks that didn't get completed today. `
        if (incompleteTasks.length > 0 && incompleteTasks[0]?.text) {
          openingMessage += `For example, "${incompleteTasks[0].text}" wasn't finished. `
        }
        openingMessage += `That's completely normal - some days are harder than others. I'm here to listen and help you work through whatever got in your way. What happened today that made it challenging?`
      }
      
      const assistantMessage: ConversationMessage = {
        role: 'assistant',
        content: openingMessage
      }
      
      setConversation([assistantMessage])
      
      console.log('🎤 [VoiceCoachChat] Starting conversation with message:', openingMessage)
      console.log('🎤 [VoiceCoachChat] Task context:', { 
        total: todaysTasks?.length || 0, 
        completed: completedTasks.length, 
        incomplete: incompleteTasks.length 
      })
      
      // Speak the opening message with retry logic
      try {
        await speak(openingMessage)
        console.log('🎤 [VoiceCoachChat] Successfully started speaking')
        setVoiceError(null) // Clear any previous errors
        setRetryCount(0)
      } catch (error) {
        console.error('❌ [VoiceCoachChat] Error speaking opening message:', error)
        setVoiceError('Voice synthesis failed. You can still continue with text input.')
      }
      
    } catch (error) {
      console.error('❌ [VoiceCoachChat] Error in startConversation:', error)
    }
  }

  const generateCoachResponse = async (userMessage: string, conversationHistory: ConversationMessage[]): Promise<string> => {
    try {
      const progressPercentage = getProgressPercentage()
      const completedTasks = todaysTasks?.filter((task: any) => task.isCompleted) || []
      const incompleteTasks = todaysTasks?.filter((task: any) => !task.isCompleted) || []
      const userMessageCount = conversationHistory.filter(msg => msg.role === 'user').length
      
      // Build task context for the AI
      const taskContext = todaysTasks?.map((task: any) => 
        `- "${task.text}" (${task.isCompleted ? 'COMPLETED' : 'NOT COMPLETED'})`
      ).join('\n') || 'No tasks available'

      const systemPrompt = `You are an empathetic AI life coach conducting a structured check-in dialogue. Follow this coaching approach:

COACHING FLOW (based on conversation stage):
1. INITIAL RESPONSE (first user message): Acknowledge their feelings and ask about specific blockers
2. BLOCKER EXPLORATION (messages 2-4): Dig deeper into what prevented task completion
3. SOLUTION BUILDING (messages 5-6): Guide them toward actionable solutions
4. INSIGHT DELIVERY (messages 7+): Provide supportive insights and prepare for session completion

CONVERSATION CONTEXT:
- Goal: ${selectedGoal?.text}
- Progress today: ${progressPercentage}% (${completedTasks.length}/${todaysTasks?.length || 0} tasks completed)
- Current conversation stage: ${userMessageCount <= 1 ? 'INITIAL' : userMessageCount <= 4 ? 'EXPLORATION' : userMessageCount <= 6 ? 'SOLUTION BUILDING' : 'INSIGHT DELIVERY'}

TODAY'S TASKS:
${taskContext}

COACHING GUIDELINES:
- Be empathetic and non-judgmental
- Ask specific follow-up questions about incomplete tasks
- Help identify patterns and root causes
- Guide toward practical solutions
- Keep responses 2-3 sentences max
- Reference specific tasks when relevant
- Build toward actionable insights

RESPONSE STYLE:
- Warm and supportive tone
- Ask one focused question per response
- Validate their feelings first
- Connect responses to their specific tasks and goal`

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          ...conversationHistory.map(msg => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content
          })),
          { role: "user", content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 200
      })

      return response.choices[0]?.message?.content || "I'm here to listen. Can you tell me more about what happened today?"
    } catch (error) {
      console.error('Error generating coach response:', error)
      return "I'm having trouble connecting right now, but I want you to know that it's completely normal to have challenging days. What's one small thing that might help you tomorrow?"
    }
  }

  const generateSessionSummary = async (conversationHistory: ConversationMessage[]): Promise<string> => {
    try {
      const systemPrompt = `Summarize this coaching conversation in 2-3 sentences. Focus on:
1. The main blocker or challenge identified
2. Any insights or solutions discussed
3. The user's emotional state/progress

Keep it supportive and solution-focused. This summary will be saved as part of their check-in record.`

      const conversationText = conversationHistory
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n')

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: conversationText }
        ],
        temperature: 0.5,
        max_tokens: 150
      })

      return response.choices[0]?.message?.content || "Had a supportive conversation about today's challenges and identified areas for improvement."
    } catch (error) {
      console.error('Error generating session summary:', error)
      return "Discussed challenges with completing today's tasks and explored potential solutions."
    }
  }

  const handleVoiceTranscript = async (transcript: string, isFinal: boolean) => {
    if (!isFinal) {
      setCurrentInput(transcript)
      return
    }

    await handleUserInput(transcript.trim())
  }

  const handleUserInput = async (input: string) => {
    if (!input.trim() || isProcessing || conversationComplete) return

    console.log('🎤 [VoiceCoachChat] User input received:', input.trim())

    const userMessage: ConversationMessage = {
      role: 'user',
      content: input.trim()
    }

    setConversation(prev => {
      const newConversation = [...prev, userMessage]
      console.log('🎤 [VoiceCoachChat] Conversation updated, total messages:', newConversation.length)
      return newConversation
    })
    setCurrentInput('')
    setIsProcessing(true)

    try {
      // Generate and speak coach response
      const coachResponse = await generateCoachResponse(userMessage.content, [...conversation, userMessage])
      
      const assistantMessage: ConversationMessage = {
        role: 'assistant',
        content: coachResponse
      }

      setConversation(prev => {
        const newConversation = [...prev, assistantMessage]
        console.log('🎤 [VoiceCoachChat] Coach response added, total messages:', newConversation.length)
        return newConversation
      })
      
      // Speak the response
      try {
        console.log('🎤 [VoiceCoachChat] Speaking coach response:', coachResponse)
        await speak(coachResponse)
        setVoiceError(null) // Clear any previous errors
      } catch (error) {
        console.error('❌ [VoiceCoachChat] Error speaking coach response:', error)
        setVoiceError('Voice synthesis failed for the response. You can continue with text input or try again.')
      }
    } catch (error) {
      console.error('❌ [VoiceCoachChat] Error processing user input:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleUserInput(currentInput)
    }
  }

  const generateInsights = async (conversationHistory: ConversationMessage[]): Promise<string> => {
    try {
      const progressPercentage = getProgressPercentage()
      const incompleteTasks = todaysTasks?.filter((task: any) => !task.isCompleted) || []
      
      const systemPrompt = `Based on this coaching conversation, provide 2-3 supportive insights and actionable suggestions for tomorrow. Focus on:

1. Key blockers or challenges identified
2. Practical solutions or adjustments
3. Encouragement and motivation

Context:
- Goal: ${selectedGoal?.text}
- Progress: ${progressPercentage}% completed
- Incomplete tasks: ${incompleteTasks.map((t: any) => t.text).join(', ')}

Keep it concise, supportive, and actionable. This will be spoken to the user.`

      const conversationText = conversationHistory
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n')

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: conversationText }
        ],
        temperature: 0.7,
        max_tokens: 200
      })

      return response.choices[0]?.message?.content || "Thank you for sharing with me. Tomorrow is a fresh start, and I believe in your ability to make progress on your goal."
    } catch (error) {
      console.error('Error generating insights:', error)
      return "Thank you for sharing with me. Tomorrow is a fresh start, and I believe in your ability to make progress on your goal."
    }
  }

  const handleConversationEnd = async () => {
    if (conversationComplete) return

    setConversationComplete(true)
    setIsProcessing(true)

    console.log('🎤 [VoiceCoachChat] Ending conversation and generating insights')

    try {
      // Generate insights based on the conversation
      const insights = await generateInsights(conversation)
      
      // Generate session summary for database
      const summary = await generateSessionSummary(conversation)
      setSessionSummary(summary)
      
      // Update check-in data with blocker information
      const blockerText = conversation
        .filter(msg => msg.role === 'user')
        .map(msg => msg.content)
        .join(' ')
        .substring(0, 500) // Limit blocker text length

      updateCheckInData({ 
        blocker: blockerText,
        summary: summary
      })

      // Speak insights message
      const finalMessage = `${insights} Let's continue with your check-in to capture how you're feeling right now.`
      
      console.log('🎤 [VoiceCoachChat] Speaking final insights:', finalMessage)
      await speak(finalMessage)
      
    } catch (error) {
      console.error('❌ [VoiceCoachChat] Error in conversation end:', error)
    } finally {
      setIsProcessing(false)
    }

    // Auto-advance after speaking
    setTimeout(() => {
      setCurrentStep('mood')
    }, 3000) // Longer delay for insights
  }

  const handleContinue = () => {
    setCurrentStep('mood')
  }

  // Show intro screen first (similar to goal creation flow)
  if (!hasStarted) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <div className="max-w-2xl w-full text-center space-y-8">
          {/* Coach Blob */}
          <CoachBlob size={200} className="mb-8" />

          {/* Content */}
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-foreground">Let's Talk</h2>
            
            <p className="text-lg text-muted-foreground leading-relaxed max-w-lg mx-auto">
              I'm here to listen and help you work through what happened today. We'll have a supportive conversation about your progress.
            </p>
            
            <div className="pt-8">
              <button
                onClick={async () => {
                  console.log('🎤 [VoiceCoachChat] User clicked start button')
                  setIsInitializing(true)
                  markUserInteracted() // This enables voice synthesis
                  
                  // Wait a moment for the interaction to register
                  await new Promise(resolve => setTimeout(resolve, 100))
                  
                  setHasStarted(true)
                  
                  // Add a longer delay to ensure everything is ready
                  setTimeout(async () => {
                    try {
                      console.log('🎤 [VoiceCoachChat] Starting conversation...')
                      await startConversation()
                    } catch (error) {
                      console.error('❌ [VoiceCoachChat] Error starting conversation:', error)
                    } finally {
                      setIsInitializing(false)
                    }
                  }, 1000) // 1 second delay
                }}
                disabled={isInitializing}
                className="bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-primary-foreground px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
              >
                {isInitializing ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Starting...</span>
                  </div>
                ) : (
                  '🎤 Start Voice Conversation'
                )}
              </button>
            </div>
          </div>

          {/* Features */}
          <div className="pt-12 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-muted-foreground">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span>Voice-guided conversation</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>Supportive coaching</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full" />
                <span>Progress insights</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Coach Blob */}
      <div className="flex justify-center mb-6">
        <CoachBlob size={200} />
      </div>

      {/* Real-time Captions underneath the blob */}
      <div className="w-full">
        <RealTimeCaptions 
          stepKey={`chat-${conversation.length}`} 
          className="w-full"
          showScrollable={true}
        />
      </div>

      {/* Voice Status */}
      {(isSpeaking || isPreparingSpeech || (hasStarted && conversation.length === 0)) && (
        <div className="text-center text-sm text-blue-600 dark:text-blue-400">
          {isPreparingSpeech ? "🎤 Preparing to speak..." : 
           isSpeaking ? "🗣️ Speaking..." : 
           "🎤 Initializing conversation..."}
        </div>
      )}

      {/* Voice Error and Retry */}
      {voiceError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="text-center space-y-3">
            <p className="text-sm text-red-700 dark:text-red-300">
              {voiceError}
            </p>
            <button
              onClick={async () => {
                setVoiceError(null)
                setRetryCount(prev => prev + 1)
                console.log(`🎤 [VoiceCoachChat] Retry attempt ${retryCount + 1}`)
                
                // Re-register user interaction and try again
                markUserInteracted()
                await new Promise(resolve => setTimeout(resolve, 200))
                
                try {
                  if (conversation.length > 0) {
                    // Retry speaking the last coach message
                    const lastCoachMessage = conversation.filter(msg => msg.role === 'assistant').pop()
                    if (lastCoachMessage) {
                      await speak(lastCoachMessage.content)
                      setVoiceError(null)
                    }
                  } else {
                    // Retry starting the conversation
                    await startConversation()
                  }
                } catch (error) {
                  console.error('❌ [VoiceCoachChat] Retry failed:', error)
                  setVoiceError('Voice still not working. You can continue with text input.')
                }
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              🔄 Retry Voice (Attempt {retryCount + 1})
            </button>
          </div>
        </div>
      )}

      {/* Voice Input */}
      {!conversationComplete && hasStarted && (
        <div className="space-y-4">
          <FlowInput
            type="text"
            value={currentInput}
            onChange={setCurrentInput}
            onVoiceTranscript={handleVoiceTranscript}
            onKeyDown={handleKeyPress}
            placeholder="Speak or type your response..."
            voicePlaceholder="Share what's on your mind..."
            disabled={isProcessing}
            showVoiceButton={true}
          />
          
          {/* Submit Button */}
          {currentInput.trim() && !isProcessing && (
            <div className="flex justify-center">
              <button
                onClick={() => handleUserInput(currentInput)}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Send Response
              </button>
            </div>
          )}
          
          {/* Manual End Conversation Button (after meaningful conversation) */}
          {conversation.length >= 6 && !isProcessing && !currentInput.trim() && (
            <div className="flex flex-col items-center space-y-2 pt-4">
              <button
                onClick={handleConversationEnd}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Get My Insights & Continue
              </button>
              <p className="text-xs text-muted-foreground">
                I'll provide personalized insights based on our conversation
              </p>
            </div>
          )}
          
          {isProcessing && (
            <div className="text-center text-sm text-muted-foreground">
              <p>Processing your response...</p>
            </div>
          )}
        </div>
      )}

      {/* Conversation Complete */}
      {conversationComplete && (
        <div className="text-center space-y-4">
          <div className="p-4 bg-card/50 rounded-xl border border-border/50">
            <p className="text-sm text-muted-foreground mb-4">
              Thank you for sharing. I've captured our conversation to help track your progress.
            </p>
            <button
              onClick={handleContinue}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Continue Check-In
            </button>
          </div>
        </div>
      )}

      {/* Time indicator */}
      {hasStarted && !conversationComplete && (
        <div className="text-center text-xs text-muted-foreground">
          {(() => {
            const now = new Date()
            const timeElapsed = now.getTime() - chatStartTime.current.getTime()
            const minutesElapsed = Math.floor(timeElapsed / 60000)
            const userMessages = conversation.filter(msg => msg.role === 'user').length
            const conversationStage = userMessages <= 1 ? 'Getting Started' : 
                                   userMessages <= 4 ? 'Exploring Blockers' : 
                                   userMessages <= 6 ? 'Building Solutions' : 'Gaining Insights'
            
            return (
              <div className="space-y-1">
                <p>
                  Time: {minutesElapsed}m • Stage: {conversationStage} • Messages: {userMessages}
                </p>
                {conversation.length >= 6 && (
                  <p className="text-green-600 dark:text-green-400">
                    Ready for insights! Click "Get My Insights" when you're ready to continue
                  </p>
                )}
                {conversation.length < 6 && (
                  <p className="text-blue-600 dark:text-blue-400">
                    Continue sharing - I'm here to help you work through this
                  </p>
                )}
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}

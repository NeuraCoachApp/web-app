'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useCheckInContext } from './CheckInProvider'
import { CoachBlob } from '@/src/components/voice/CoachBlob'
import { FlowInput } from '@/src/components/voice/FlowInput'
import { RealTimeCaptions } from '@/src/components/voice/RealTimeCaptions'
import { useCoach } from '@/src/contexts/CoachContext'
import { useGoals } from '@/src/hooks/useGoals'
import { useAuth } from '@/src/contexts/AuthContext'
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

  const { speak, setPreviewMessage, markUserInteracted, hasUserInteracted, isSpeaking, isPreparingSpeech, previewMessage } = useCoach()
  const { user } = useAuth()
  const { refetch: refetchGoals } = useGoals(user?.id)
  
  const [conversation, setConversation] = useState<ConversationMessage[]>([])
  const [currentInput, setCurrentInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [conversationComplete, setConversationComplete] = useState(false)
  const [isCompletingConversation, setIsCompletingConversation] = useState(false)
  const [sessionSummary, setSessionSummary] = useState('')
  const [hasStarted, setHasStarted] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [showCompletionButton, setShowCompletionButton] = useState(false)
  const [userMessageCount, setUserMessageCount] = useState(0)
  const [autoCompleted, setAutoCompleted] = useState(false)
  const conversationInitialized = useRef<boolean>(false)

  // Clear preview message when component unmounts
  useEffect(() => {
    return () => {
      setPreviewMessage(null)
    }
  }, [setPreviewMessage])

  // Check if completion button should be shown (message limit or OpenAI solution detection)
  useEffect(() => {
    const currentUserMessages = conversation.filter(msg => msg.role === 'user').length
    setUserMessageCount(currentUserMessages)

    // Show completion button if:
    // 1. Message limit reached (50 messages) OR close to limit (40+ messages with meaningful conversation)
    // 2. OR if OpenAI detected a solution (handled separately in handleUserInput)
    if ((currentUserMessages >= 40 && currentUserMessages >= 3) && !conversationComplete) {
      console.log('🎤 [VoiceCoachChat] Message limit approaching - showing completion button:', {
        userMessages: currentUserMessages,
        totalMessages: conversation.length
      })
      setShowCompletionButton(true)
    }
  }, [conversation, conversationComplete])

  const startConversation = useCallback(async () => {
    if (conversationInitialized.current) {
      console.log('🎤 [VoiceCoachChat] startConversation called but already initialized, skipping')
      return
    }
    
    conversationInitialized.current = true
    console.log('🎤 [VoiceCoachChat] Starting conversation (first time)')
    
    try {
      const progressPercentage = getProgressPercentage()
      const completedTasks = todaysTasks?.filter((task: any) => task.isCompleted) || []
      const incompleteTasks = todaysTasks?.filter((task: any) => !task.isCompleted) || []
      
      let openingMessage = `I see you completed ${progressPercentage}% of your tasks today. `
      
      if (progressPercentage >= 80) {
        openingMessage += `That's excellent progress! You completed ${completedTasks.length} out of ${todaysTasks?.length || 0} tasks. I'd love to hear about how your day went and what helped you stay on track.`
      } else {
        openingMessage += `I notice you had ${incompleteTasks.length} tasks that didn't get completed today. `
        openingMessage += `That's completely normal - some days are harder than others. I'm here to listen and help you work through whatever got in your way. What happened today that made it challenging?`
      }
      
      const assistantMessage: ConversationMessage = {
        role: 'assistant',
        content: openingMessage
      }
      
      setConversation([assistantMessage])
      
      // Immediately show preview message
      setPreviewMessage(openingMessage)
      
      console.log('🎤 [VoiceCoachChat] Starting conversation with message:', openingMessage)
      console.log('🎤 [VoiceCoachChat] Task context:', { 
        total: todaysTasks?.length || 0, 
        completed: completedTasks.length, 
        incomplete: incompleteTasks.length 
      })
      
      // Speak the opening message with retry logic
      try {
        console.log('🎤 [VoiceCoachChat] About to call speak() for opening message:', openingMessage.substring(0, 50) + '...')
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
  }, [getProgressPercentage, todaysTasks, speak, setPreviewMessage])

  // Check if the AI's latest response contains questions
  const checkAIResponseHasQuestions = async (aiResponse: string): Promise<boolean> => {
    try {
      const systemPrompt = `Analyze this AI coaching response to determine if it contains any questions or prompts for the user to continue the conversation.

Look for:
1. Direct questions (ending with ?)
2. Implicit questions or prompts for more information
3. Requests for clarification or elaboration
4. Invitations to share more details
5. Open-ended statements that expect a response

The response does NOT contain questions if it:
1. Is a concluding statement or goodbye
2. Provides final insights or encouragement
3. Summarizes what was discussed without asking for more
4. Gives closure to the conversation
5. Is purely supportive without seeking more input

Respond with ONLY "HAS_QUESTIONS" or "NO_QUESTIONS" - no other text.`

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: aiResponse }
        ],
        temperature: 0.1,
        max_tokens: 10
      })

      const result = response.choices[0]?.message?.content?.trim().toUpperCase()
      console.log('🎤 [VoiceCoachChat] AI response question check result:', result)
      return result === 'HAS_QUESTIONS'
    } catch (error) {
      console.error('Error checking AI response for questions:', error)
      // Fallback: assume it has questions to avoid premature ending
      return true
    }
  }

  // Check if the conversation has reached a natural conclusion
  const checkConversationCompletion = async (conversationHistory: ConversationMessage[]): Promise<boolean> => {
    // Only check after minimum meaningful conversation (6+ messages) - increased threshold
    if (conversationHistory.length < 6) return false

    try {
      // First check if the user has reached a solution
      const systemPrompt = `Analyze this coaching conversation to determine if the user has reached a SOLUTION or meaningful insight about their challenges.

The conversation has reached a SOLUTION when:
1. The user has identified specific actionable steps they can take
2. They've expressed understanding of what went wrong and how to fix it
3. They've shown acceptance and readiness to try a different approach
4. They've gained clarity about their blockers and have a plan forward
5. They sound resolved, motivated, or have had an "aha moment"

The conversation has NOT reached a solution when:
1. The user is still confused or stuck without clear next steps
2. They're still venting emotions without actionable insights
3. They're asking more questions or seeking additional guidance
4. They haven't identified what they'll do differently tomorrow
5. The conversation feels incomplete or they seem to need more support

Focus on whether the user has gained ACTIONABLE CLARITY, not just emotional processing.

Respond with ONLY "COMPLETE" or "CONTINUE" - no other text.`

      const conversationText = conversationHistory
        .slice(-8) // Analyze more messages for better context
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n')

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: conversationText }
        ],
        temperature: 0.1, // Even lower temperature for more conservative responses
        max_tokens: 10
      })

      const userHasSolution = response.choices[0]?.message?.content?.trim().toUpperCase() === 'COMPLETE'
      console.log('🎤 [VoiceCoachChat] User solution check result:', userHasSolution)

      // If user has a solution, also check if the AI's latest response contains questions
      if (userHasSolution) {
        const lastAIMessage = conversationHistory.filter(msg => msg.role === 'assistant').pop()
        if (lastAIMessage) {
          const aiHasQuestions = await checkAIResponseHasQuestions(lastAIMessage.content)
          console.log('🎤 [VoiceCoachChat] AI has questions:', aiHasQuestions)
          
          // Only mark as complete if user has solution AND AI didn't ask more questions
          return !aiHasQuestions
        }
      }

      return false
    } catch (error) {
      console.error('Error checking conversation completion:', error)
      // Fallback: never auto-complete due to error
      return false
    }
  }

  const generateCoachResponse = async (userMessage: string, conversationHistory: ConversationMessage[]): Promise<string> => {
    try {
      const progressPercentage = getProgressPercentage()
      const completedTasks = todaysTasks?.filter((task: any) => task.isCompleted) || []
      const incompleteTasks = todaysTasks?.filter((task: any) => !task.isCompleted) || []
      const currentUserMessageCount = conversationHistory.filter(msg => msg.role === 'user').length
      
      // Build task context for the AI
      const taskContext = todaysTasks?.map((task: any) => 
        `- "${task.text}" (${task.isCompleted ? 'COMPLETED' : 'NOT COMPLETED'})`
      ).join('\n') || 'No tasks available'

      // Message limit warnings
      let messageLimitGuidance = ''
      if (currentUserMessageCount >= 45) {
        messageLimitGuidance = `URGENT: You are at ${currentUserMessageCount}/50 messages. Start wrapping up the conversation immediately and guide toward completion.`
      } else if (currentUserMessageCount >= 40) {
        messageLimitGuidance = `IMPORTANT: You are at ${currentUserMessageCount}/50 messages. Begin preparing to wrap up the conversation and guide toward actionable insights.`
      } else if (currentUserMessageCount >= 35) {
        messageLimitGuidance = `NOTE: You are at ${currentUserMessageCount}/50 messages. Start moving toward solutions and prepare for conversation completion.`
      }

      const systemPrompt = `You are an empathetic AI life coach conducting a structured check-in dialogue. Follow this coaching approach:

COACHING FLOW (based on conversation stage):
1. INITIAL RESPONSE (first user message): Acknowledge their feelings and ask about specific blockers
2. BLOCKER EXPLORATION (messages 2-4): Dig deeper into what prevented task completion
3. SOLUTION BUILDING (messages 5-6): Guide them toward actionable solutions
4. INSIGHT DELIVERY (messages 7+): Provide supportive insights and prepare for session completion

CONVERSATION CONTEXT:
- Goal: ${selectedGoal?.text}
- Progress today: ${progressPercentage}% (${completedTasks.length}/${todaysTasks?.length || 0} tasks completed)
- Current conversation stage: ${currentUserMessageCount <= 1 ? 'INITIAL' : currentUserMessageCount <= 4 ? 'EXPLORATION' : currentUserMessageCount <= 6 ? 'SOLUTION BUILDING' : 'INSIGHT DELIVERY'}
- User message count: ${currentUserMessageCount}/50

${messageLimitGuidance}

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
${currentUserMessageCount >= 40 ? '- PRIORITY: Start guiding toward conversation completion' : ''}

RESPONSE STYLE:
- Warm and supportive tone
- Ask one focused question per response (EXCEPT when providing final insights)
- Validate their feelings first
- Connect responses to their specific tasks and goal

IMPORTANT: When the user has gained clarity, actionable insights, or shows they understand what went wrong and how to fix it, provide a CONCLUDING statement WITHOUT questions. Use phrases like:
- "It sounds like you have a clear path forward..."
- "I'm glad we could work through this together..."
- "You've identified some great strategies..."
- "I believe you're well-equipped to tackle tomorrow..."

These concluding statements should NOT contain questions and should signal the natural end of the conversation.`

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
    if (!input.trim() || isProcessing || conversationComplete || isCompletingConversation) return

    // Check message limit before processing
    const currentUserMessages = conversation.filter(msg => msg.role === 'user').length
    if (currentUserMessages >= 50) {
      console.log('🎤 [VoiceCoachChat] Message limit reached, forcing conversation end')
      handleConversationEnd()
      return
    }

    const userMessage: ConversationMessage = {
      role: 'user',
      content: input.trim()
    }

    setConversation(prev => {
      const newConversation = [...prev, userMessage]
      return newConversation
    })
    setCurrentInput('')
    setIsProcessing(true)

    try {
      // Generate coach response
      const coachResponse = await generateCoachResponse(userMessage.content, [...conversation, userMessage])
      
      const assistantMessage: ConversationMessage = {
        role: 'assistant',
        content: coachResponse
      }

      const newConversation = [...conversation, userMessage, assistantMessage]
      setConversation(newConversation)
      
      // Immediately show preview of the response
      setPreviewMessage(coachResponse)
      
      // Wait a moment for the preview to display before starting audio
      await new Promise(resolve => setTimeout(resolve, 500)) // Reduced to 500ms delay
      
      // Then speak the response (this will clear the preview and start real-time sync)
      try {
        await speak(coachResponse)
        setVoiceError(null) // Clear any previous errors
      } catch (error) {
        console.error('❌ [VoiceCoachChat] Error speaking coach response:', error)
        setVoiceError('Voice synthesis failed for the response. You can continue with text input or try again.')
      }

      // Check if conversation has reached a solution and AI gave concluding response
      try {
        const isComplete = await checkConversationCompletion(newConversation)
        if (isComplete && !conversationComplete) {
          console.log('🎤 [VoiceCoachChat] Conversation naturally completed - AI gave concluding statement without questions')
          
          // Mark as auto-completed and wait for the AI's speech to finish before automatically ending
          setAutoCompleted(true)
          setTimeout(() => {
            if (!conversationComplete) {
              console.log('🎤 [VoiceCoachChat] Auto-ending conversation after AI concluded')
              handleConversationEnd()
            }
          }, 2000) // Give 2 seconds for speech to finish
        } else if (!showCompletionButton && userMessageCount >= 6) {
          // Show manual completion button if no auto-completion but conversation is substantial
          setShowCompletionButton(true)
        }
      } catch (error) {
        console.error('❌ [VoiceCoachChat] Error checking conversation completion:', error)
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

  const extractMoodAndMotivation = async (conversationHistory: ConversationMessage[]): Promise<{ mood: number, motivation: number }> => {
    try {
      const systemPrompt = `Analyze this coaching conversation and extract the user's mood and motivation levels based on their responses and emotional state.

Rate on a scale of 1-10 where:
- Mood: 1 = very negative/depressed, 5 = neutral, 10 = very positive/happy
- Motivation: 1 = completely unmotivated/giving up, 5 = neutral, 10 = highly motivated/energized

Consider:
- Emotional language and tone
- Attitude toward challenges
- Willingness to try solutions
- Overall energy level
- Optimism vs pessimism
- Sense of hope or defeat

Respond with ONLY a JSON object in this exact format: {"mood": 5, "motivation": 5}
Use integers only, no decimals.`

      const conversationText = conversationHistory
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n')

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: conversationText }
        ],
        temperature: 0.1,
        max_tokens: 50
      })

      const result = response.choices[0]?.message?.content?.trim()
      if (result) {
        try {
          const parsed = JSON.parse(result)
          if (parsed.mood && parsed.motivation && 
              parsed.mood >= 1 && parsed.mood <= 10 && 
              parsed.motivation >= 1 && parsed.motivation <= 10) {
            return { mood: parsed.mood, motivation: parsed.motivation }
          }
        } catch (parseError) {
          console.error('Error parsing mood/motivation JSON:', parseError)
        }
      }
      
      // Fallback to neutral values
      return { mood: 5, motivation: 5 }
    } catch (error) {
      console.error('Error extracting mood and motivation:', error)
      return { mood: 5, motivation: 5 }
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
    setPreviewMessage(null) // Clear any preview when conversation ends

    try {
      // Start background task refresh immediately - don't wait for it
      console.log('🔄 [VoiceCoachChat] Starting background task refresh...')
      refetchGoals().catch(error => {
        console.warn('⚠️ [VoiceCoachChat] Background task refresh failed:', error)
        // Don't throw - this is background operation
      })

      // Generate insights based on the conversation
      const insights = await generateInsights(conversation)
      
      // Generate session summary for database
      const summary = await generateSessionSummary(conversation)
      setSessionSummary(summary)
      
      // Extract mood and motivation from conversation
      const { mood, motivation } = await extractMoodAndMotivation(conversation)
      
      // Update check-in data with blocker information and extracted mood/motivation
      const blockerText = conversation
        .filter(msg => msg.role === 'user')
        .map(msg => msg.content)
        .join(' ')
        .substring(0, 500) // Limit blocker text length

      updateCheckInData({ 
        blocker: blockerText,
        summary: summary,
        mood: mood,
        motivation: motivation
      })

      console.log('🧠 [VoiceCoachChat] Extracted mood and motivation:', { mood, motivation })

      // Start background AI task adjustments while user listens to insights
      if (selectedGoal && todaysTasks && mood && motivation) {
        console.log('🧠 [VoiceCoachChat] Starting background AI task adjustment...')
        import('@/src/lib/ai-task-adjustment').then(async ({ performIntelligentTaskAdjustment }) => {
          try {
            const adjustmentResult = await performIntelligentTaskAdjustment(
              selectedGoal.text,
              todaysTasks,
              {
                mood: mood,
                motivation: motivation,
                progressPercentage: getProgressPercentage(),
                blocker: blockerText,
                summary: summary
              }
            )
            
            console.log('✅ [VoiceCoachChat] Background AI task adjustment completed:', adjustmentResult)
            
            // Store adjustment results in check-in data for display on completion screen
            updateCheckInData({
              taskAdjustments: adjustmentResult
            })
            
            // Refresh goals if adjustments were made
            if (adjustmentResult.adjustmentsMade) {
              console.log('🔄 [VoiceCoachChat] Refreshing goals due to task adjustments')
              refetchGoals().catch(error => {
                console.warn('⚠️ [VoiceCoachChat] Goal refresh after adjustments failed:', error)
              })
            }
          } catch (error) {
            console.warn('⚠️ [VoiceCoachChat] Background task adjustment failed:', error)
            // Don't throw - this is background operation
          }
        }).catch(error => {
          console.warn('⚠️ [VoiceCoachChat] Failed to load task adjustment module:', error)
        })
      }

      // Speak insights message without the mood/motivation prompt
      await speak(insights)
      
    } catch (error) {
      console.error('❌ [VoiceCoachChat] Error in conversation end:', error)
    } finally {
      setIsProcessing(false)
    }

    // Don't auto-advance - let user click continue button
  }

  const handleContinue = () => {
    setCurrentStep('complete')
  }

  // Auto-start conversation immediately when component mounts (if user already interacted)
  useEffect(() => {
    if (!hasStarted && hasUserInteracted) {
      console.log('🎤 [VoiceCoachChat] useEffect triggering startConversation')
      setHasStarted(true)
      
      // Start conversation immediately
      setTimeout(async () => {
        try {
          console.log('🎤 [VoiceCoachChat] Auto-starting conversation...')
          await startConversation()
        } catch (error) {
          console.error('❌ [VoiceCoachChat] Error auto-starting conversation:', error)
          setVoiceError('Voice synthesis failed to start. Please try again or continue with text input.')
        }
      }, 500) // Short delay to ensure component is ready
    }
  }, [hasUserInteracted, hasStarted, startConversation])

  // If user has already interacted (from previous step), skip intro screen
  if (hasUserInteracted && !hasStarted) {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex justify-center mb-6">
          <CoachBlob size={200} />
        </div>
        <div className="text-center text-sm text-muted-foreground">
          <p>Starting conversation...</p>
        </div>
      </div>
    )
  }

  // Show intro screen only if user hasn't interacted yet
  if (!hasUserInteracted) {
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
                onClick={() => {
                  console.log('🎤 [VoiceCoachChat] User clicked start button')
                  markUserInteracted() // This enables voice synthesis and triggers auto-start
                }}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-200 transform hover:scale-105"
              >
                🎤 Start Voice Conversation
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // No waiting state - jump straight to main interface with preview

  return (
    <div className="max-w-2xl mx-auto space-y-8 w-full">
      {/* Coach Blob */}
      <div className="flex justify-center mb-6">
        <CoachBlob size={200} />
      </div>

      {/* Real-time Captions underneath the blob */}
      <div className="w-full max-w-md mx-auto min-w-[250px]">
        <RealTimeCaptions 
          stepKey={`chat-${conversation.length}`} 
          className=""
          showScrollable={true}
          previewText={previewMessage || undefined}
          previewMode={!!previewMessage && !isSpeaking}
        />
      </div>


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

      {/* Voice Input - hidden when auto-completed or conversation complete */}
      {!conversationComplete && !autoCompleted && hasStarted && (
        <div className="space-y-4">
          <FlowInput
            type="text"
            value={currentInput}
            onChange={setCurrentInput}
            onVoiceTranscript={handleVoiceTranscript}
            onKeyDown={handleKeyPress}
            placeholder={
              isCompletingConversation ? "Completing conversation..." :
              "Speak or type your response..."
            }
            className="min-w-[250px]"
            voicePlaceholder="Share what's on your mind..."
            disabled={isProcessing || isCompletingConversation || isSpeaking || isPreparingSpeech}
            showVoiceButton={!isCompletingConversation && !isSpeaking && !isPreparingSpeech}
          />
          
          {/* Submit Button */}
          {currentInput.trim() && !isProcessing && !isCompletingConversation && !isSpeaking && !isPreparingSpeech && (
            <div className="flex justify-center">
              <button
                onClick={() => handleUserInput(currentInput)}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Send Response
              </button>
            </div>
          )}
          
          {/* Manual conversation end button - only show when criteria are met and not auto-completed */}
          {showCompletionButton && !autoCompleted && !isProcessing && !conversationComplete && !isCompletingConversation && !isSpeaking && !isPreparingSpeech && (
            <div className="text-center pt-6 border-t border-border/30 mt-6">
              <div className="pt-4 space-y-4">
                <p className="text-sm text-muted-foreground">
                  {userMessageCount >= 45 
                    ? `Message limit almost reached (${userMessageCount}/50). Please wrap up the conversation.`
                    : userMessageCount >= 40 
                      ? `You're approaching the message limit (${userMessageCount}/50). Consider wrapping up when ready.`
                      : "It sounds like you've found some clarity. You can continue sharing or wrap up when ready."
                  }
                </p>
                <button
                  onClick={handleConversationEnd}
                  className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium shadow-sm"
                >
                  ✓ Complete Conversation & Continue Check-in
                </button>
              </div>
            </div>
          )}
          
          {(isProcessing || isSpeaking || isPreparingSpeech) && (
            <div className="text-center text-sm text-muted-foreground">
              <p>
                {isSpeaking || isPreparingSpeech 
                  ? "Coach is speaking - please wait..." 
                  : "Processing your response..."
                }
              </p>
            </div>
          )}
        </div>
      )}

      {/* Conversation Complete */}
      {conversationComplete && (
        <div className="text-center space-y-4">
          {/* Show captions while insights are being spoken */}
          {(isSpeaking || isPreparingSpeech) && (
            <div className="p-4 bg-card/50 rounded-xl border border-border/50">
              <p className="text-sm text-muted-foreground mb-2">
                Preparing your personalized insights...
              </p>
            </div>
          )}
          
          {/* Show continue button only after insights are fully spoken */}
          {!isSpeaking && !isPreparingSpeech && (
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
          )}
        </div>
      )}

      {/* Message counter and conversation status */}
      {hasStarted && !conversationComplete && (
        <div className="text-center text-xs text-muted-foreground">
          <div className="space-y-3">
            {/* Visual Progress Bar based on messages */}
            <div className="max-w-md mx-auto">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium">Conversation Progress</span>
                <span className="text-xs font-mono">
                  {userMessageCount}/50 messages
                </span>
              </div>
              <div className="w-full bg-muted/40 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    userMessageCount >= 45 ? 'bg-red-500' : 
                    userMessageCount >= 35 ? 'bg-yellow-500' : 
                    'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min(100, (userMessageCount / 50) * 100)}%` }}
                />
              </div>
            </div>
            
          </div>
        </div>
      )}
    </div>
  )
}

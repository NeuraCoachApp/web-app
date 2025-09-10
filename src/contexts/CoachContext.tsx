'use client'

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import { useVoiceSynthesis } from '@/src/lib/elevenlabs'
import { useSpeechRecognition } from '@/src/lib/speech-recognition'
import { getAudioAnalyzer, AudioAnalysisData } from '@/src/lib/audio-analyzer'

interface CoachState {
  isSpeaking: boolean
  isListening: boolean
  hasVoiceEnabled: boolean
  isPreparingSpeech: boolean
  currentMessage: string | null
  currentWordIndex: number
  spokenMessages: Set<string>
  hasUserInteracted: boolean
  audioAnalysisData: AudioAnalysisData | null
}

interface CoachContextType extends CoachState {
  enableVoice: () => void
  disableVoice: () => void
  speak: (message: string, force?: boolean) => Promise<void>
  startListening: (onInterimResult?: (transcript: string) => void, onFinalResult?: (transcript: string) => void) => Promise<any>
  startListeningForText: (onInterimResult?: (transcript: string) => void, onFinalResult?: (transcript: string) => void) => Promise<string>
  stopListening: () => void
  clearSpokenHistory: () => void
  requestMicPermission: () => Promise<boolean>
  markUserInteracted: () => void
  stopCurrentSpeech: () => void
  prefetchAudio: (text: string) => Promise<void>
}

const CoachContext = createContext<CoachContextType | undefined>(undefined)

export function CoachProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CoachState>({
    isSpeaking: false,
    isListening: false,
    hasVoiceEnabled: true, // Auto-enable voice for better UX
    isPreparingSpeech: false,
    currentMessage: null,
    currentWordIndex: 0,
    spokenMessages: new Set<string>(),
    hasUserInteracted: false,
    audioAnalysisData: null
  })

  const { playText, playTextWithProgress, prefetchAudio } = useVoiceSynthesis()
  const { isSupported: speechSupported, listenForName, startListeningWithCallback, stopListening: stopSpeechRecognition, requestPermission } = useSpeechRecognition()
  const currentSpeechRef = useRef<HTMLAudioElement | null>(null)
  const audioAnalyzer = getAudioAnalyzer()
  const analysisCleanupRef = useRef<(() => void) | null>(null)

  // Cleanup effect
  useEffect(() => {
    return () => {
      // Clean up audio analysis on unmount
      if (analysisCleanupRef.current) {
        analysisCleanupRef.current()
      }
      audioAnalyzer.cleanup()
    }
  }, [])

  const enableVoice = useCallback(() => {
    setState(prev => ({ ...prev, hasVoiceEnabled: true }))
  }, [])

  const disableVoice = useCallback(() => {
    setState(prev => ({ ...prev, hasVoiceEnabled: false }))
    // Stop any current speech
    if (currentSpeechRef.current) {
      currentSpeechRef.current.pause()
      // Clean up blob URL to prevent memory leaks
      if (currentSpeechRef.current.src) {
        URL.revokeObjectURL(currentSpeechRef.current.src)
      }
      currentSpeechRef.current = null
    }
    setState(prev => ({ ...prev, isSpeaking: false }))
  }, [])

  const speak = useCallback(async (message: string, force: boolean = false) => {
    // Don't speak if voice is disabled
    if (!state.hasVoiceEnabled) return
    
    // Don't speak if user hasn't interacted yet (required by browser)
    if (!state.hasUserInteracted) {
      console.warn('Cannot play audio: User interaction required first')
      return
    }
    
    // Don't speak if already speaking or preparing (unless forced)
    if ((state.isSpeaking || state.isPreparingSpeech) && !force) return
    
    // Don't speak if we've already spoken this message (unless forced)
    if (state.spokenMessages.has(message) && !force) return

    try {
      // Stop any current speech first (critical for single voice instance)
      if (currentSpeechRef.current) {
        currentSpeechRef.current.pause()
        currentSpeechRef.current.currentTime = 0
        // Clean up blob URL to prevent memory leaks
        if (currentSpeechRef.current.src) {
          URL.revokeObjectURL(currentSpeechRef.current.src)
        }
        currentSpeechRef.current = null
      }

      // Use enhanced playTextWithProgress for better feedback
      const audioElement = await playTextWithProgress(message, {
        onPreparing: () => {
          setState(prev => ({
            ...prev,
            isPreparingSpeech: true,
            currentMessage: message
          }))
        },
        onStart: (audio) => {
          // Store reference to current audio for single instance management
          currentSpeechRef.current = audio
          
          // Connect audio analyzer for real-time analysis
          audioAnalyzer.connectToAudio(audio)
          
          // Set up audio analysis callback
          analysisCleanupRef.current = audioAnalyzer.onAnalysisData((analysisData) => {
            setState(prev => ({ ...prev, audioAnalysisData: analysisData }))
          })
          
          setState(prev => {
            const newSpokenMessages = new Set(prev.spokenMessages)
            newSpokenMessages.add(message)
            return {
              ...prev,
              isPreparingSpeech: false,
              isSpeaking: true,
              spokenMessages: newSpokenMessages
            }
          })
        },
        onProgress: (currentTime, duration, text, currentWordIndex) => {
          // Update the current word being spoken
          setState(prev => ({ 
            ...prev, 
            isSpeaking: true, 
            currentWordIndex: currentWordIndex || 0 
          }))
        },
        onEnd: () => {
          // Clean up audio analysis
          if (analysisCleanupRef.current) {
            analysisCleanupRef.current()
            analysisCleanupRef.current = null
          }
          audioAnalyzer.disconnect()
          
          setState(prev => ({ 
            ...prev, 
            isSpeaking: false, 
            isPreparingSpeech: false,
            currentMessage: null,
            currentWordIndex: 0,
            audioAnalysisData: null
          }))
          currentSpeechRef.current = null
        },
        onError: (error) => {
          console.warn('Voice synthesis failed:', error)
          
          // Clean up audio analysis
          if (analysisCleanupRef.current) {
            analysisCleanupRef.current()
            analysisCleanupRef.current = null
          }
          audioAnalyzer.disconnect()
          
          setState(prev => ({ 
            ...prev, 
            isSpeaking: false, 
            isPreparingSpeech: false,
            currentMessage: null,
            currentWordIndex: 0,
            audioAnalysisData: null
          }))
          currentSpeechRef.current = null
        }
      })
    } catch (error) {
      console.warn('Voice synthesis failed:', error)
      
      // Clean up audio analysis
      if (analysisCleanupRef.current) {
        analysisCleanupRef.current()
        analysisCleanupRef.current = null
      }
      audioAnalyzer.disconnect()
      
      setState(prev => ({ 
        ...prev, 
        isSpeaking: false, 
        isPreparingSpeech: false,
        currentMessage: null,
        currentWordIndex: 0,
        audioAnalysisData: null
      }))
      currentSpeechRef.current = null
    }
  }, [state.hasVoiceEnabled, state.hasUserInteracted, state.isSpeaking, state.isPreparingSpeech, playTextWithProgress])

  const startListening = useCallback(async (
    onInterimResult?: (transcript: string) => void,
    onFinalResult?: (transcript: string) => void
  ) => {
    if (!speechSupported) {
      throw new Error('Speech recognition is not supported in this browser')
    }

    setState(prev => ({ ...prev, isListening: true }))

    try {
      const result = await listenForName(onInterimResult, onFinalResult)
      return result
    } catch (error) {
      throw error
    } finally {
      setState(prev => ({ ...prev, isListening: false }))
    }
  }, [speechSupported, listenForName])

  const startListeningForText = useCallback(async (
    onInterimResult?: (transcript: string) => void,
    onFinalResult?: (transcript: string) => void
  ) => {
    if (!speechSupported) {
      throw new Error('Speech recognition is not supported in this browser')
    }

    setState(prev => ({ ...prev, isListening: true }))

    try {
      const result = await startListeningWithCallback(onInterimResult, onFinalResult)
      return result
    } catch (error) {
      throw error
    } finally {
      setState(prev => ({ ...prev, isListening: false }))
    }
  }, [speechSupported, startListeningWithCallback])

  const stopListening = useCallback(() => {
    stopSpeechRecognition()
    setState(prev => ({ ...prev, isListening: false }))
  }, [stopSpeechRecognition])

  const clearSpokenHistory = useCallback(() => {
    setState(prev => ({ ...prev, spokenMessages: new Set() }))
  }, [])

  const requestMicPermission = useCallback(async (): Promise<boolean> => {
    return await requestPermission()
  }, [requestPermission])

  const markUserInteracted = useCallback(() => {
    setState(prev => ({ ...prev, hasUserInteracted: true }))
  }, [])

  const stopCurrentSpeech = useCallback(() => {
    if (currentSpeechRef.current) {
      currentSpeechRef.current.pause()
      currentSpeechRef.current.currentTime = 0
      // Clean up blob URL to prevent memory leaks
      if (currentSpeechRef.current.src) {
        URL.revokeObjectURL(currentSpeechRef.current.src)
      }
      currentSpeechRef.current = null
    }
    
    // Clean up audio analysis
    if (analysisCleanupRef.current) {
      analysisCleanupRef.current()
      analysisCleanupRef.current = null
    }
    audioAnalyzer.disconnect()
    
    setState(prev => ({ 
      ...prev, 
      isSpeaking: false, 
      isPreparingSpeech: false,
      currentMessage: null,
      currentWordIndex: 0,
      audioAnalysisData: null
    }))
  }, [])

  const value: CoachContextType = {
    ...state,
    enableVoice,
    disableVoice,
    speak,
    startListening,
    startListeningForText,
    stopListening,
    clearSpokenHistory,
    requestMicPermission,
    markUserInteracted,
    stopCurrentSpeech,
    prefetchAudio
  }

  return <CoachContext.Provider value={value}>{children}</CoachContext.Provider>
}

export function useCoach() {
  const context = useContext(CoachContext)
  if (context === undefined) {
    throw new Error('useCoach must be used within a CoachProvider')
  }
  return context
}

'use client'

import React, { createContext, useContext, useState, useCallback, useRef } from 'react'
import { useVoiceSynthesis } from '@/src/lib/elevenlabs'
import { useSpeechRecognition } from '@/src/lib/speech-recognition'

interface CoachState {
  isSpeaking: boolean
  isListening: boolean
  hasVoiceEnabled: boolean
  currentMessage: string | null
  spokenMessages: Set<string>
}

interface CoachContextType extends CoachState {
  enableVoice: () => void
  disableVoice: () => void
  speak: (message: string, force?: boolean) => Promise<void>
  startListening: () => Promise<any>
  stopListening: () => void
  clearSpokenHistory: () => void
  requestMicPermission: () => Promise<boolean>
}

const CoachContext = createContext<CoachContextType | undefined>(undefined)

export function CoachProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CoachState>({
    isSpeaking: false,
    isListening: false,
    hasVoiceEnabled: false,
    currentMessage: null,
    spokenMessages: new Set<string>()
  })

  const { playText } = useVoiceSynthesis()
  const { isSupported: speechSupported, listenForName, stopListening: stopSpeechRecognition, requestPermission } = useSpeechRecognition()
  const currentSpeechRef = useRef<HTMLAudioElement | null>(null)

  const enableVoice = useCallback(() => {
    setState(prev => ({ ...prev, hasVoiceEnabled: true }))
  }, [])

  const disableVoice = useCallback(() => {
    setState(prev => ({ ...prev, hasVoiceEnabled: false }))
    // Stop any current speech
    if (currentSpeechRef.current) {
      currentSpeechRef.current.pause()
      currentSpeechRef.current = null
    }
    setState(prev => ({ ...prev, isSpeaking: false }))
  }, [])

  const speak = useCallback(async (message: string, force: boolean = false) => {
    // Don't speak if voice is disabled
    if (!state.hasVoiceEnabled) return
    
    // Don't speak if already speaking (unless forced)
    if (state.isSpeaking && !force) return
    
    // Don't speak if we've already spoken this message (unless forced)
    if (state.spokenMessages.has(message) && !force) return

    try {
      // Stop any current speech
      if (currentSpeechRef.current) {
        currentSpeechRef.current.pause()
        currentSpeechRef.current = null
      }

      setState(prev => ({ 
        ...prev, 
        isSpeaking: true, 
        currentMessage: message,
        spokenMessages: new Set([...prev.spokenMessages, message])
      }))

      await playText(
        message,
        () => {
          setState(prev => ({ ...prev, isSpeaking: true }))
        },
        () => {
          setState(prev => ({ ...prev, isSpeaking: false, currentMessage: null }))
          currentSpeechRef.current = null
        }
      )
    } catch (error) {
      console.warn('Voice synthesis failed:', error)
      setState(prev => ({ ...prev, isSpeaking: false, currentMessage: null }))
    }
  }, [state.hasVoiceEnabled, state.isSpeaking, state.spokenMessages, playText])

  const startListening = useCallback(async () => {
    if (!speechSupported) {
      throw new Error('Speech recognition is not supported in this browser')
    }

    setState(prev => ({ ...prev, isListening: true }))

    try {
      const result = await listenForName()
      return result
    } catch (error) {
      throw error
    } finally {
      setState(prev => ({ ...prev, isListening: false }))
    }
  }, [speechSupported, listenForName])

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

  const value: CoachContextType = {
    ...state,
    enableVoice,
    disableVoice,
    speak,
    startListening,
    stopListening,
    clearSpokenHistory,
    requestMicPermission
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

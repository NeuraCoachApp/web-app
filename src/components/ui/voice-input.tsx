'use client'

import { useState } from 'react'
import { useCoach } from '@/src/contexts/CoachContext'
import { Mic, MicOff, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface VoiceInputProps {
  onTranscript: (transcript: string, isFinal: boolean) => void
  onError?: (error: string) => void
  className?: string
  disabled?: boolean
  placeholder?: string
}

export default function VoiceInput({ 
  onTranscript, 
  onError, 
  className = "",
  disabled = false,
  placeholder = "Click to speak..."
}: VoiceInputProps) {
  const { 
    isListening, 
    hasVoiceEnabled, 
    enableVoice, 
    startListeningForText, 
    stopListening,
    requestMicPermission 
  } = useCoach()
  
  const [transcript, setTranscript] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const handleVoiceInput = async () => {
    if (isListening) {
      stopListening()
      return
    }

    if (!hasVoiceEnabled) {
      enableVoice()
    }

    try {
      setIsProcessing(true)
      
      // Request microphone permission first
      const hasPermission = await requestMicPermission()
      if (!hasPermission) {
        onError?.('Microphone permission is required for voice input')
        return
      }

      // Clear previous transcript
      setTranscript('')

      await startListeningForText(
        // Interim results (real-time transcription)
        (interimText: string) => {
          setTranscript(interimText)
          onTranscript(interimText, false)
        },
        // Final result
        (finalText: string) => {
          setTranscript(finalText)
          onTranscript(finalText, true)
        }
      )
    } catch (error) {
      console.error('Voice input error:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (errorMessage.includes('permission')) {
        onError?.('Microphone permission denied. Please allow microphone access and try again.')
      } else {
        onError?.('Failed to recognize speech. Please try again.')
      }
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={handleVoiceInput}
        disabled={disabled || isProcessing}
        className={`
          flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200
          ${isListening 
            ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg' 
            : 'bg-gray-600 hover:bg-gray-500 text-gray-300 hover:text-white'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${isProcessing ? 'animate-pulse' : ''}
        `}
        title={isListening ? 'Click to stop recording' : 'Click to start voice input'}
      >
        {isProcessing ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isListening ? (
          <MicOff className="w-4 h-4" />
        ) : (
          <Mic className="w-4 h-4" />
        )}
      </button>

    </div>
  )
}

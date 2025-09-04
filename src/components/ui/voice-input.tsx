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

      {/* Real-time transcription display */}
      <AnimatePresence>
        {(isListening || transcript) && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full mt-2 left-0 right-0 bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg z-10"
          >
            <div className="text-xs text-gray-400 mb-1">
              {isListening ? 'Listening...' : 'Transcribed:'}
            </div>
            <div className="text-sm text-white min-h-[20px]">
              {transcript || (isListening ? placeholder : '')}
              {isListening && (
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="ml-1 text-blue-400"
                >
                  ●
                </motion.span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

'use client'

import React from 'react'
import VoiceInput from '@/src/components/ui/voice-input'
import { useCoach } from '@/src/contexts/CoachContext'

interface FlowInputProps {
  type?: 'text' | 'textarea'
  value: string
  onChange: (value: string) => void
  onVoiceTranscript?: (transcript: string, isFinal: boolean) => Promise<void>
  onKeyDown?: (e: React.KeyboardEvent) => void
  placeholder?: string
  voicePlaceholder?: string
  disabled?: boolean
  autoFocus?: boolean
  rows?: number
  speechError?: string
  onError?: (error: string) => void
  className?: string
  showVoiceButton?: boolean
  capturedInfo?: string
}

export function FlowInput({
  type = 'text',
  value,
  onChange,
  onVoiceTranscript,
  onKeyDown,
  placeholder = "Enter your response or use voice input",
  voicePlaceholder = "Say your response...",
  disabled = false,
  autoFocus = false,
  rows = 4,
  speechError,
  onError,
  className = "",
  showVoiceButton = true,
  capturedInfo
}: FlowInputProps) {
  const { hasVoiceEnabled } = useCoach()

  const baseInputClasses = "w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  const textareaClasses = `${baseInputClasses} resize-none ${showVoiceButton && hasVoiceEnabled && onVoiceTranscript ? 'pr-12' : ''}`
  const textInputClasses = `${baseInputClasses} ${showVoiceButton && hasVoiceEnabled && onVoiceTranscript ? 'pr-12' : ''}`

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="relative w-full max-w-md mx-auto min-w-[250px]" >
        {type === 'textarea' ? (
          <textarea
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            rows={rows}
            disabled={disabled}
            autoFocus={autoFocus}
            className={textareaClasses}
          />
        ) : (
          <input
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={disabled}
            autoFocus={autoFocus}
            className={textInputClasses}
          />
        )}
        
        {/* Voice Input Button */}
        {showVoiceButton && hasVoiceEnabled && onVoiceTranscript && (
          <div className={`absolute right-2 ${type === 'textarea' ? 'top-3' : 'top-1/2 transform -translate-y-1/2'}`}>
            <VoiceInput
              onTranscript={onVoiceTranscript}
              onError={onError}
              placeholder={voicePlaceholder}
            />
          </div>
        )}
      </div>
      
      {/* Speech Error */}
      {speechError && (
        <div className="text-red-400 text-sm text-center max-w-md mx-auto">
          {speechError}
        </div>
      )}
      
      {/* Captured Information */}
      {capturedInfo && (
        <div className="text-center text-sm text-green-400">
          {capturedInfo}
        </div>
      )}
    </div>
  )
}

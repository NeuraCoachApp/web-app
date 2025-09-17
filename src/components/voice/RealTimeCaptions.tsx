'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCoach } from '@/src/contexts/CoachContext'
import { LoadingDots } from '@/src/components/ui/loading-dots'

interface RealTimeCaptionsProps {
  currentText?: string
  subtext?: string
  className?: string
  showOnSpeaking?: boolean
  showProgress?: boolean
  stepKey?: string | number
  showScrollable?: boolean
  previewText?: string // Text to show immediately with reduced opacity
  previewMode?: boolean // Whether to show preview before audio starts
}

export function RealTimeCaptions({ 
  currentText, 
  subtext, 
  className = '',
  showOnSpeaking = true,
  showProgress = true,
  stepKey,
  showScrollable = false,
  previewText,
  previewMode = false
}: RealTimeCaptionsProps) {
  const { isSpeaking, isPreparingSpeech, currentMessage, audioAnalysisData, currentAudio } = useCoach()
  const [allParts, setAllParts] = useState<Array<{ text: string; isWord: boolean; isBold?: boolean; isItalic?: boolean; isLineBreak?: boolean }>>([])
  const [previewParts, setPreviewParts] = useState<Array<{ text: string; isWord: boolean; isBold?: boolean; isItalic?: boolean; isLineBreak?: boolean }>>([])
  const [visibleWordCount, setVisibleWordCount] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [isPreviewVisible, setIsPreviewVisible] = useState(false)
  const [hasCompletedSpeech, setHasCompletedSpeech] = useState(false)
  const [lastStepKey, setLastStepKey] = useState<string | number | undefined>(stepKey)
  const [currentAudioWordIndex, setCurrentAudioWordIndex] = useState(0)
  const [hasAnimatedOnce, setHasAnimatedOnce] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number | null>(null)

  // Utility function to parse markdown and create formatted text elements
  // Handles OpenAI's common formatting: **bold**, *italic*, and newlines
  const parseMarkdown = (text: string): Array<{ text: string; isWord: boolean; isBold?: boolean; isItalic?: boolean; isLineBreak?: boolean }> => {
    if (!text) return []
    
    const parts: Array<{ text: string; isWord: boolean; isBold?: boolean; isItalic?: boolean; isLineBreak?: boolean }> = []
    
    // First, split by double newlines to preserve paragraph breaks
    const paragraphs = text.split(/\n\n+/)
    
    paragraphs.forEach((paragraph, paragraphIndex) => {
      if (paragraphIndex > 0) {
        // Add paragraph break (double line break for paragraph separation)
        parts.push({ text: '', isWord: false, isLineBreak: true })
        parts.push({ text: '', isWord: false, isLineBreak: true })
      }
      
      // Handle single newlines within paragraphs - convert to line breaks for display
      const lines = paragraph.split(/\n/)
      
      lines.forEach((line, lineIndex) => {
        if (lineIndex > 0) {
          // Add line break
          parts.push({ text: '', isWord: false, isLineBreak: true })
        }
        
        // Process the line for markdown formatting
        if (!line.trim()) return // Skip empty lines
        
        // Split by markdown formatting while preserving the delimiters
        // This regex captures: **bold**, *italic*, and regular text
        const segments = line.trim().split(/(\*\*[^*]+\*\*|\*[^*]+\*)/)
        
        segments.forEach((segment: string) => {
          if (!segment) return
          
          // Check if this segment is formatted with asterisks
          const boldMatch = segment.match(/^\*\*(.+)\*\*$/)
          const italicMatch = segment.match(/^\*([^*]+)\*$/)
          
          if (boldMatch) {
            // Bold text - split into words and spaces
            const content = boldMatch[1]
            const wordParts = content.split(/(\s+)/).filter((part: string) => part.length > 0)
            wordParts.forEach((part: string) => {
              parts.push({
                text: part,
                isWord: part.trim().length > 0,
                isBold: true
              })
            })
          } else if (italicMatch) {
            // Italic text - split into words and spaces
            const content = italicMatch[1]
            const wordParts = content.split(/(\s+)/).filter((part: string) => part.length > 0)
            wordParts.forEach((part: string) => {
              parts.push({
                text: part,
                isWord: part.trim().length > 0,
                isItalic: true
              })
            })
          } else {
            // Regular text - split into words and spaces
            const wordParts = segment.split(/(\s+)/).filter((part: string) => part.length > 0)
            wordParts.forEach((part: string) => {
              parts.push({
                text: part,
                isWord: part.trim().length > 0
              })
            })
          }
        })
      })
    })
    
    return parts
  }

  // Use real-time audio analysis for word timing - same as coach blob
  const getCurrentWordIndexFromAudio = (wordCount: number): number => {
    if (!audioAnalysisData?.isPlaying || !currentAudio || wordCount === 0) return 0
    
    // Use actual audio currentTime and duration for precise synchronization
    const currentTime = currentAudio.currentTime
    const duration = currentAudio.duration
    
    if (duration === 0) return 0
    
    // Calculate progress through the audio (same as coach blob timing)
    const progress = currentTime / duration
    const wordIndex = Math.floor(progress * wordCount)
    
    return Math.min(Math.max(0, wordIndex), wordCount - 1)
  }

  // Clear captions when step changes
  useEffect(() => {
    if (stepKey !== lastStepKey && lastStepKey !== undefined) {
      // Step has changed - clear previous captions
      setAllParts([])
      setVisibleWordCount(0)
      setIsVisible(false)
      setLastStepKey(stepKey)
      setHasAnimatedOnce(false) // Reset animation flag for new step
      
    } else if (lastStepKey === undefined) {
      // Initialize step key
      setLastStepKey(stepKey)
    }
  }, [stepKey, lastStepKey])

  // Handle preview text display (immediate display with opacity)
  useEffect(() => {
    if (previewMode && previewText && !isSpeaking) {
      const parts = parseMarkdown(previewText)
      setPreviewParts(parts)
      setIsPreviewVisible(true)
      if (!hasAnimatedOnce) {
        setHasAnimatedOnce(true) // Mark that we've animated once
      }
    } else if (!previewText) {
      // Only clear preview if previewText is null/undefined, not when switching to speaking
      setPreviewParts([])
      setIsPreviewVisible(false)
    }
  }, [previewMode, previewText, isSpeaking])

  // Real audio-synchronized word timing using the same approach as coach blob
  useEffect(() => {
    if (isSpeaking && audioAnalysisData?.isPlaying && currentAudio && allParts.length > 0) {
      const updateWordTiming = () => {
        if (!currentAudio || currentAudio.paused || currentAudio.ended || !currentAudio.duration) return
        
        // Use EXACT same logic as coach blob - real audio timing with analysis data
        const actualWords = allParts.filter(part => part.isWord)
        const wordCount = actualWords.length
        const currentWordIndex = getCurrentWordIndexFromAudio(wordCount)
        
        // Calculate how many parts (including spaces) to show based on word index
        let partsToShow = 0
        let actualWordCount = 0
        
        for (let i = 0; i < allParts.length; i++) {
          const part = allParts[i]
          
          if (part.isWord) {
            if (actualWordCount <= currentWordIndex) {
              partsToShow++
              actualWordCount++
            } else {
              break
            }
          } else {
            // Include spaces between visible words
            if (actualWordCount > 0 && actualWordCount <= currentWordIndex + 1) {
              partsToShow++
            }
          }
        }
        
        if (partsToShow !== visibleWordCount) {
          setVisibleWordCount(partsToShow)
          
          // Smart scroll to follow the currently highlighted word
          if (showScrollable && scrollContainerRef.current) {
            setTimeout(() => {
              if (scrollContainerRef.current) {
                const container = scrollContainerRef.current
                const isOverflowing = container.scrollHeight > container.clientHeight
                
                if (isOverflowing) {
                  // Find the currently highlighted word element
                  const highlightedWords = container.querySelectorAll('.text-foreground.brightness-110')
                  if (highlightedWords.length > 0) {
                    const lastHighlightedWord = highlightedWords[highlightedWords.length - 1] as HTMLElement
                    
                    // Calculate if the highlighted word is visible
                    const containerRect = container.getBoundingClientRect()
                    const wordRect = lastHighlightedWord.getBoundingClientRect()
                    
                    // Only scroll if word is completely below the visible area (new line needed)
                    if (wordRect.top > containerRect.bottom - 40) {
                      // Scroll just enough to bring the next line into view
                      const lineHeight = parseInt(getComputedStyle(lastHighlightedWord).lineHeight) || 24
                      const currentScrollTop = container.scrollTop
                      const newScrollTop = currentScrollTop + lineHeight
                      container.scrollTop = Math.min(newScrollTop, container.scrollHeight - container.clientHeight)
                    }
                  }
                }
              }
            }, 50) // Small delay to ensure DOM update
          }
          
        }
        
        // Continue the animation loop using requestAnimationFrame for smooth updates
        animationFrameRef.current = requestAnimationFrame(updateWordTiming)
      }
      
      // Start the animation loop
      animationFrameRef.current = requestAnimationFrame(updateWordTiming)
      
      // Cleanup function
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
          animationFrameRef.current = null
        }
      }
    } else {
      // Stop animation frame when not actively playing audio
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
    }
  }, [isSpeaking, audioAnalysisData?.isPlaying, currentAudio, allParts, visibleWordCount])


  // Initialize words when message starts or changes
  useEffect(() => {
    if (isSpeaking && currentMessage) {
      const parts = parseMarkdown(currentMessage)
      
      // If we have preview parts for the same message, use them instead of reinitializing
      if (isPreviewVisible && previewParts.length > 0) {
        const previewTextContent = previewParts.map(p => p.text).join('')
        const currentTextContent = parts.map(p => p.text).join('')
        
        if (previewTextContent === currentTextContent) {
          // Use preview parts as the base for highlighting - NO re-animation
          setAllParts(previewParts)
          // Don't reset visibleWordCount to 0 - keep current state to avoid re-animation
          // setVisibleWordCount(0) // REMOVED to prevent re-animation
          setIsVisible(true)
          setIsPreviewVisible(false) // Switch from preview to real-time mode
          
          return
        }
      }
      
      // Only reinitialize if it's a different message
      const currentPartsText = allParts.map(p => p.text).join('')
      const newPartsText = parts.map(p => p.text).join('')
      
      if (allParts.length === 0 || currentPartsText !== newPartsText) {
        setAllParts(parts)
        setVisibleWordCount(0)
        setIsVisible(true)
        
        // For scrollable mode: scroll to top when new message starts, then auto-scroll as words appear
        if (showScrollable && scrollContainerRef.current) {
          // First scroll to top to show the beginning of the new message
          scrollContainerRef.current.scrollTop = 0
        }
        
      }
    }
    // Keep captions visible on the same step even when not actively speaking
  }, [isSpeaking, currentMessage, allParts, showScrollable, isPreviewVisible, previewParts])


  // Track when speech completes to keep text bright - avoid unnecessary re-renders
  useEffect(() => {
    if (!isSpeaking && currentMessage && allParts.length > 0 && !hasCompletedSpeech) {
      // Only set to true if it's not already true to prevent unnecessary re-renders
      setHasCompletedSpeech(true)
    } else if (isSpeaking && hasCompletedSpeech) {
      // Only set to false if it's not already false
      setHasCompletedSpeech(false)
    }
  }, [isSpeaking, currentMessage, allParts.length, hasCompletedSpeech])

  // Function to render words with highlighting as audio plays
  const renderWords = () => {
    // Use preview parts if available, otherwise use regular parts
    const partsToRender = isPreviewVisible && previewParts.length > 0 ? previewParts : allParts
    
    if (partsToRender.length === 0) return null
    
    return partsToRender.map((part, index) => {
      // Determine highlighting state based on audio progress and completion
      let highlightState: 'preview' | 'speaking' | 'completed' = 'preview'
      
      if (hasCompletedSpeech || (!isSpeaking && allParts.length > 0)) {
        // Speech completed - keep all words bright
        highlightState = 'completed'
      } else if (isSpeaking && audioAnalysisData?.isPlaying && index < visibleWordCount) {
        // Currently being spoken - use real audio timing
        highlightState = 'speaking'
      } else {
        // Not yet spoken or preview mode
        highlightState = 'preview'
      }
      
      // Handle line breaks
      if (part.isLineBreak) {
        return (
          <motion.br
            key={`${stepKey}-linebreak-${index}`}
            initial={{ opacity: hasAnimatedOnce ? 1 : 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.1 }}
          />
        )
      }
      
      // Build className based on formatting
      let className = part.isWord ? "inline-block" : "inline"
      if (part.isBold) className += " font-bold"
      if (part.isItalic) className += " italic"
      
      // Apply highlighting based on state
      switch (highlightState) {
        case 'speaking':
          className += " text-foreground brightness-110" // Bright when being spoken
          break
        case 'completed':
          className += " text-foreground" // Full color when speech is complete
          break
        case 'preview':
        default:
          className += " text-foreground/40" // Dim for preview/not yet spoken
          break
      }
      
      return (
        <motion.span
          key={`${stepKey}-word-${index}-${part.text.slice(0, 10)}`} // Stable key that persists across preview/voice states
          initial={{ opacity: hasAnimatedOnce ? 1 : 0 }} // Don't re-animate if already animated
          animate={{ 
            opacity: 1,
            // Smooth transition when word is being highlighted
            scale: highlightState === 'speaking' ? 1.02 : 1
          }}
            transition={{ 
              duration: highlightState === 'speaking' ? 0.1 : 0.2,
              delay: (!hasAnimatedOnce && !isSpeaking && !hasCompletedSpeech && !isPreviewVisible) ? index * 0.01 : 0 // Only stagger on first ever render
            }}
          className={className}
        >
          {part.text}
        </motion.span>
      )
    })
  }

  if (showScrollable) {
    return (
      <div className={`w-full ${className}`}>
        <div 
          ref={scrollContainerRef}
          className="h-48 overflow-y-auto bg-card/50 rounded-lg p-4 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
          style={{ 
            overflowAnchor: 'none', // Prevent scroll anchoring issues
            minHeight: '12rem', // Ensure consistent height (h-48 = 12rem)
            maxHeight: '12rem'
          }}
        >
          {(isVisible && allParts.length > 0) || (isPreviewVisible && previewParts.length > 0) ? (
            <div className="text-foreground text-base leading-relaxed text-center">
              {renderWords()}
              {/* Invisible element to ensure scroll to bottom works */}
              <div className="h-2" />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <LoadingDots size="md" color="text-muted-foreground" />
            </div>
          )}
        </div>
      </div>
    )
  }

  // Original overlay mode for other components
  return (
    <div className="w-[70%] h-full flex items-center justify-center">
      <div className="max-w-lg mx-auto px-4 py-3 text-center min-h-[60px] flex items-center justify-center">
        {(isVisible || isPreviewVisible) && (
          <div className={`text-gray-200 text-lg md:text-xl leading-relaxed italic text-center ${className}`}>
            {renderWords()}
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import React, { useState, useEffect } from 'react'

interface RetryBannerProps {
  isVisible: boolean
  attempt: number
  totalAttempts: number
  delayMs: number
  onCancel?: () => void
}

export function RetryBanner({ isVisible, attempt, totalAttempts, delayMs, onCancel }: RetryBannerProps) {
  const [countdown, setCountdown] = useState(Math.ceil(delayMs / 1000))

  useEffect(() => {
    if (!isVisible) return

    setCountdown(Math.ceil(delayMs / 1000))
    
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isVisible, delayMs])

  if (!isVisible) return null

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-slide-down">
      <div className="bg-orange-500 text-white px-6 py-3 rounded-lg shadow-lg border border-orange-600 max-w-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="animate-spin">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div>
              <div className="font-medium text-sm">
                Voice service busy - retrying in {countdown}s
              </div>
              <div className="text-xs text-orange-100">
                Attempt {attempt} of {totalAttempts}
              </div>
            </div>
          </div>
          {onCancel && (
            <button
              onClick={onCancel}
              className="ml-4 text-orange-100 hover:text-white transition-colors"
              aria-label="Cancel retry"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        
        {/* Progress bar */}
        <div className="mt-2 w-full bg-orange-400 rounded-full h-1">
          <div 
            className="bg-white h-1 rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${((Math.ceil(delayMs / 1000) - countdown) / Math.ceil(delayMs / 1000)) * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}

// Add the slide-down animation to your global CSS or Tailwind config
// @keyframes slide-down {
//   from {
//     opacity: 0;
//     transform: translateY(-100%) translateX(-50%);
//   }
//   to {
//     opacity: 1;
//     transform: translateY(0) translateX(-50%);
//   }
// }

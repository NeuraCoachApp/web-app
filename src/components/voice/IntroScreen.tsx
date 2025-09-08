'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { CoachBlob } from './CoachBlob'

interface IntroScreenProps {
  title: string
  description: string
  onStart: () => void
  isLoading?: boolean
}

export function IntroScreen({ 
  title, 
  description, 
  onStart, 
  isLoading = false 
}: IntroScreenProps) {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Coach Blob */}
        <CoachBlob size={200} className="mb-8" />

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <h1 className="text-4xl font-bold text-white mb-4">
            {title}
          </h1>
          
          <p className="text-xl text-gray-300 leading-relaxed max-w-lg mx-auto">
            {description}
          </p>
          
          <div className="pt-8">
            <motion.button
              onClick={onStart}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:scale-100"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Starting...</span>
                </div>
              ) : (
                'Start Your Journey'
              )}
            </motion.button>
          </div>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="pt-12 space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-400">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <span>Voice-guided experience</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>Personalized coaching</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full" />
              <span>Daily progress tracking</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

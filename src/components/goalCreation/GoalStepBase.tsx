'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface GoalStepBaseProps {
  children: React.ReactNode
  className?: string
}

export function GoalStepBase({ children, className = '' }: GoalStepBaseProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className={`space-y-4 ${className}`}
    >
      {children}
    </motion.div>
  )
}

interface GoalStepTextProps {
  title: string
  subtitle?: string
}

export function GoalStepText({ title, subtitle }: GoalStepTextProps) {
  return (
    <>
      <h1 className="text-2xl md:text-3xl font-medium text-center leading-relaxed">
        {title}
      </h1>
      
      {subtitle && (
        <p className="text-lg text-gray-300 text-center">
          {subtitle}
        </p>
      )}
    </>
  )
}

interface GoalStepButtonProps {
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'gradient'
  className?: string
}

export function GoalStepButton({ 
  onClick, 
  disabled = false, 
  children, 
  variant = 'primary',
  className = ''
}: GoalStepButtonProps) {
  const baseClasses = "px-8 py-3 rounded-lg transition-colors font-medium"
  
  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed",
    secondary: "bg-gray-600 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed",
    gradient: "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 transition-all duration-300 text-lg"
  }
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface LoadingDotsProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  color?: string
}

export function LoadingDots({ 
  className = '', 
  size = 'md',
  color = 'text-muted-foreground'
}: LoadingDotsProps) {
  const sizeClasses = {
    sm: 'w-1 h-1',
    md: 'w-2 h-2', 
    lg: 'w-3 h-3'
  }
  
  const containerClasses = {
    sm: 'space-x-1',
    md: 'space-x-2',
    lg: 'space-x-3'
  }

  const dotVariants = {
    initial: { y: 0 },
    animate: { y: -8 }
  }

  const transition = {
    duration: 0.6,
    repeat: Infinity,
    repeatType: "reverse" as const,
    ease: "easeInOut"
  }

  return (
    <div className={`flex items-center justify-center ${containerClasses[size]} ${className}`}>
      <motion.div
        className={`${sizeClasses[size]} ${color} bg-current rounded-full`}
        variants={dotVariants}
        initial="initial"
        animate="animate"
        transition={{ ...transition, delay: 0 }}
      />
      <motion.div
        className={`${sizeClasses[size]} ${color} bg-current rounded-full`}
        variants={dotVariants}
        initial="initial"
        animate="animate"
        transition={{ ...transition, delay: 0.2 }}
      />
      <motion.div
        className={`${sizeClasses[size]} ${color} bg-current rounded-full`}
        variants={dotVariants}
        initial="initial"
        animate="animate"
        transition={{ ...transition, delay: 0.4 }}
      />
    </div>
  )
}

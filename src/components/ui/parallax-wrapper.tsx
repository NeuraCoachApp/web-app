'use client'

import { useEffect, useState } from 'react'

interface ParallaxWrapperProps {
  children: React.ReactNode
  speed?: number
  className?: string
}

export default function ParallaxWrapper({ children, speed = 0.1, className = '' }: ParallaxWrapperProps) {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }

    // Add scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true })
    
    // Cleanup
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div 
      className={className}
      style={{ 
        transform: `translateY(${scrollY * -speed}px)`,
        transition: 'transform 0.1s ease-out'
      }}
    >
      {children}
    </div>
  )
}

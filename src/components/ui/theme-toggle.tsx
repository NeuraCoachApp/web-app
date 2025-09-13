'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/src/contexts/ThemeContext'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="relative flex items-center justify-center w-9 h-9 rounded-lg border border-border bg-background hover:bg-accent transition-colors duration-200"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <div className="relative w-4 h-4">
        {/* Sun icon for light mode */}
        <Sun 
          className={`absolute inset-0 w-4 h-4 text-foreground transition-all duration-300 ${
            theme === 'light' 
              ? 'opacity-100 rotate-0 scale-100' 
              : 'opacity-0 rotate-90 scale-75'
          }`}
        />
        {/* Moon icon for dark mode */}
        <Moon 
          className={`absolute inset-0 w-4 h-4 text-foreground transition-all duration-300 ${
            theme === 'dark' 
              ? 'opacity-100 rotate-0 scale-100' 
              : 'opacity-0 -rotate-90 scale-75'
          }`}
        />
      </div>
    </button>
  )
}

'use client'

import { AlertTriangle, ExternalLink } from 'lucide-react'

interface SetupRequiredProps {
  title?: string
  message?: string
  children?: React.ReactNode
}

export default function SetupRequired({ 
  title = "Setup Required", 
  message = "This feature requires additional configuration.",
  children 
}: SetupRequiredProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          <p className="text-muted-foreground">{message}</p>
        </div>

        {children}

        <div className="bg-muted rounded-lg p-4 text-left">
          <h3 className="font-medium text-foreground mb-2">Required Environment Variables:</h3>
          <div className="space-y-1 text-sm text-muted-foreground font-mono">
            <div>NEXT_PUBLIC_SUPABASE_URL</div>
            <div>NEXT_PUBLIC_SUPABASE_ANON_KEY</div>
          </div>
        </div>

        <div className="space-y-3">
          <a
            href="https://supabase.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Get Supabase Credentials
            <ExternalLink className="w-4 h-4" />
          </a>
          
          <p className="text-xs text-muted-foreground">
            Add the environment variables to your <code className="bg-muted px-1 rounded">.env.local</code> file and restart the development server.
          </p>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/src/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Globe, Mail, Lock } from 'lucide-react'
import Link from 'next/link'
import Button from '@/src/components/ui/button'

export default function SignUpForm() {
  const { signUp, user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isSigningUp, setIsSigningUp] = useState(false)

  // Redirect to pricing if already logged in (but not during signup process)
  useEffect(() => {
    if (!authLoading && user && !isSigningUp) {
      router.push('/pricing')
    }
  }, [user, authLoading, router, isSigningUp])

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setIsSigningUp(true)
    setMessage('')

    try {
      const result = await signUp(email, password)
      
      if (result.error) throw result.error
      
      // Check if user was automatically signed in (already existed)
      if ((result as any).wasSignedIn) {
        setMessage('Welcome back! Signing you in...')
        // Redirect to pricing since they need to set up subscription
        setTimeout(() => {
          router.push('/pricing')
        }, 1000)
      } else {
        // Redirect to pricing immediately for new users
        router.push('/pricing')
      }
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
      setIsSigningUp(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-8 h-8 bg-foreground rounded-full flex items-center justify-center">
              <Globe className="w-4 h-4 text-background" />
            </div>
            <div className="text-foreground text-sm font-dm-mono font-medium uppercase tracking-wider-2">
              AI Coach
            </div>
          </div>
          <h2 className="text-3xl font-inter font-bold text-foreground">
            Create your account
          </h2>
          <p className="mt-2 text-muted-foreground">
            Get started with AI coaching
          </p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSignUp}>
          <div className="space-y-4">
            
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none relative block w-full px-3 py-3 pl-10 border border-border placeholder-muted-foreground text-foreground bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="appearance-none relative block w-full px-3 py-3 pl-10 border border-border placeholder-muted-foreground text-foreground bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          {message && (
            <div className={`text-sm text-center p-3 rounded-lg border ${
              message.includes('successful') || message.includes('Welcome back') 
                ? 'bg-success/10 text-success border-success/20' 
                : 'bg-error/10 text-error border-error/20'
            }`}>
              {message}
            </div>
          )}

          <div>
            <Button
              type="submit"
              loading={loading}
              className="w-full"
            >
              {loading ? 'Creating account...' : 'Sign up'}
            </Button>
          </div>

          <div className="text-center">
            <Link
              href="/auth/signin"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Already have an account? Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

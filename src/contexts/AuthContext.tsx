'use client'

import React, { createContext, useContext, useEffect, useRef, useState, useMemo } from 'react'
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/src/lib/supabase'
import { Profile } from '@/src/hooks/useProfile'
import { profileKeys } from '@/src/hooks/useProfile'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string) => Promise<{ error: any; wasSignedIn?: boolean }>
  resetPassword: (email: string) => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [sessionLoaded, setSessionLoaded] = useState(false)
  const queryClient = useQueryClient()

  const loading = useMemo(() => {
    return !sessionLoaded
  }, [sessionLoaded])

  const invalidateUserData = (userId: string) => {
    // Invalidate all user-related queries when auth changes
    queryClient.invalidateQueries({ queryKey: profileKeys.user(userId) })
    queryClient.invalidateQueries({ queryKey: ['goals', 'user', userId] })
    queryClient.invalidateQueries({ queryKey: ['onboarding', 'status', userId] })
  }

  /**
   * To prevent updating duplicate sessions
   */
  function onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    let currentSession: Session | null = null
    const { data: authListener } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      if (session?.user?.id === currentSession?.user?.id) return
      currentSession = session
      callback(event, session)
    })

    return authListener
  }

  useEffect(() => {
    const requestSession = async () => {
      try {
        // Check if Supabase is properly configured
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
          console.warn('Supabase not configured - auth will not work')
          setSessionLoaded(true)
          return
        }

        const { data: { session }, error } = await supabase.auth.getSession()
        setSessionLoaded(true)
        
        if (error) {
          console.error('Error getting session:', error)
          return
        }

        if (session) {
          setSession(session)
          setUser(session.user)
          // Invalidate user data to trigger fresh fetches
          invalidateUserData(session.user.id)
        }
      } catch (error) {
        console.error('Error getting session:', error)
        setSessionLoaded(true)
      }
    }

    const handleAuthChange = async (event: AuthChangeEvent, newSession: Session | null) => {
      try {
        setSessionLoaded(true)
        
        if (newSession?.user?.id !== session?.user?.id) {
          setSession(newSession)
          setUser(newSession?.user || null)
          
          if (newSession?.user) {
            // Invalidate user data for the new user
            invalidateUserData(newSession.user.id)
          } else {
            // Clear all user data from cache on sign out
            queryClient.clear()
          }
        }
      } catch (error) {
        console.error('Error in auth state change:', error)
      }
    }

    const { subscription: listener } = onAuthStateChange(handleAuthChange)
    requestSession()

    return () => {
      listener?.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setUser(null)
    // Clear all cached data on sign out
    queryClient.clear()
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    // If there's an error about email not confirmed, we'll still try to set the user
    if (error && error.message && error.message.includes('Email not confirmed')) {
      // The user exists but email isn't confirmed - we'll allow them in anyway
      if (data.user) {
        setUser(data.user)
        setSession(data.session)
        return { error: null } // Override the error
      }
    }
    
    return { error }
  }

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: undefined, // Disable email confirmation
      },
    })
    
    // If user already exists, try to sign them in instead
    if (error) {
      const isUserExists = error.code === 'user_already_exists' || 
                          (error.message && error.message.toLowerCase().includes('user already registered'))
      
      if (isUserExists) {
        const signInResult = await signIn(email, password)
        if (!signInResult.error) {
          return { error: null, wasSignedIn: true }
        }
        // If sign-in also fails, return original signup error
        return { error }
      }
    }
    
    return { error }
  }

  const resetPassword = async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email)
    return { error }
  }

  const value = {
    user,
    session,
    loading,
    signOut,
    signIn,
    signUp,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
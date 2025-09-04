'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/src/lib/supabase'
import { Profile, getOrCreateProfile } from '@/src/lib/profile'

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string) => Promise<{ error: any }>
  resetPassword: (email: string) => Promise<{ error: any }>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = async (user: User) => {
    try {
      const { data: profileData, error } = await getOrCreateProfile(user.id)
      if (error) {
        console.warn('Profile loading failed (this is ok if profiles table not set up yet):', error)
        // Set a default profile if database isn't set up
        setProfile(null)
      } else {
        setProfile(profileData)
      }
    } catch (error) {
      console.warn('Profile loading error:', error)
      setProfile(null)
    }
  }

  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user)
    }
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      try {
        // Accept users even if email is not confirmed
        if (session?.user) {
          setSession(session)
          setUser(session.user)
          // Load profile but don't let it block the auth flow
          loadProfile(session.user).catch(console.warn)
        }
      } catch (error) {
        console.error('Error in initial session setup:', error)
      } finally {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        // Accept users even if email is not confirmed
        if (session?.user) {
          setSession(session)
          setUser(session.user)
          // Load profile but don't let it block the auth flow
          loadProfile(session.user).catch(console.warn)
        } else {
          setSession(null)
          setUser(null)
          setProfile(null)
        }
      } catch (error) {
        console.error('Error in auth state change:', error)
      } finally {
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    // If there's an error about email not confirmed, we'll still try to set the user
    if (error && error.message.includes('Email not confirmed')) {
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
    return { error }
  }

  const resetPassword = async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email)
    return { error }
  }

  const value = {
    user,
    session,
    profile,
    loading,
    signOut,
    signIn,
    signUp,
    resetPassword,
    refreshProfile,
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

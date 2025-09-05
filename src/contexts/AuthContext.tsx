'use client'

import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js'
import { supabase } from '@/src/lib/supabase'
import { Profile, getOrCreateProfile } from '@/src/lib/profile'

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string) => Promise<{ error: any; wasSignedIn?: boolean }>
  resetPassword: (email: string) => Promise<{ error: any }>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const loadStack = {
    sessionLoaded: useRef(false),
    profileLoaded: useRef(false),
  }

  const checkLoadedState = () => {
    const allLoaded = Object.values(loadStack).every(ref => ref.current)
    setLoading(!allLoaded)
  }

  const loadProfile = async (user: User) => {
    try {
      const { data: profileData, error } = await getOrCreateProfile(user.id)
      if (error) {
        console.warn('Profile loading failed (this is ok if profiles table not set up yet):', error)
        setProfile(null)
      } else {
        setProfile(profileData)
      }
    } catch (error) {
      console.warn('Profile loading error:', error)
      setProfile(null)
    } finally {
      loadStack.profileLoaded.current = true
      checkLoadedState()
    }
  }

  const refreshProfile = async () => {
    if (user) {
      loadStack.profileLoaded.current = false
      await loadProfile(user)
    }
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
          loadStack.sessionLoaded.current = true
          loadStack.profileLoaded.current = true
          checkLoadedState()
          return
        }

        const { data: { session }, error } = await supabase.auth.getSession()
        loadStack.sessionLoaded.current = true
        
        if (error) {
          console.error('Error getting session:', error)
          checkLoadedState()
          return
        }

        if (session) {
          setSession(session)
          setUser(session.user)
          // Load profile but don't let it block the auth flow
          loadProfile(session.user)
        } else {
          loadStack.profileLoaded.current = true
          checkLoadedState()
        }
      } catch (error) {
        console.error('Error getting session:', error)
        loadStack.sessionLoaded.current = true
        loadStack.profileLoaded.current = true
        checkLoadedState()
      }
    }

    const handleAuthChange = async (event: AuthChangeEvent, newSession: Session | null) => {
      try {
        loadStack.sessionLoaded.current = true
        
        if (newSession?.user?.id !== session?.user?.id) {
          setSession(newSession)
          setUser(newSession?.user || null)
          
          if (newSession?.user) {
            loadProfile(newSession.user)
          } else {
            setProfile(null)
            loadStack.profileLoaded.current = true
            checkLoadedState()
          }
        }
      } catch (error) {
        console.error('Error in auth state change:', error)
        loadStack.profileLoaded.current = true
        checkLoadedState()
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
    setProfile(null)
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
'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from '@/src/contexts/AuthContext'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/src/lib/supabase'

export interface SubscriptionStatus {
  subscriptionStatus: '0' | '1' | '2' // 0: none, 1: AI Coach, 2: AI + Human Coach
  planId: string | null
  planName: string | null
  status: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean | null
}

export interface SubscriptionPlan {
  id: string
  name: string
  description: string
  priceCents: number
  currency: string
  intervalType: string
  stripePriceId: string
  features: string[]
}

interface SubscriptionContextType {
  subscriptionStatus: SubscriptionStatus | null
  subscriptionPlans: SubscriptionPlan[]
  isLoading: boolean
  isLoadingPlans: boolean
  hasActiveSubscription: boolean
  canAccessDashboard: boolean
  refreshSubscriptionStatus: () => Promise<void>
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined)

export function useSubscription() {
  const context = useContext(SubscriptionContext)
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider')
  }
  return context
}

interface SubscriptionProviderProps {
  children: React.ReactNode
}

export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [isLoading, setIsLoading] = useState(false)

  // Query for subscription status
  const { 
    data: subscriptionStatus = null, 
    isLoading: isLoadingStatus,
    refetch: refetchStatus 
  } = useQuery({
    queryKey: ['subscription', 'status', user?.id],
    queryFn: async (): Promise<SubscriptionStatus | null> => {
      if (!user) return null
      
      const { data, error } = await supabase.rpc('get_user_subscription_status', {
        p_user_uuid: user.id
      })

      if (error) {
        console.error('Error fetching subscription status:', error)
        return null
      }

      // The function returns an array, take the first item
      const result = data?.[0]
      if (!result) return null

      return {
        subscriptionStatus: result.subscription_status as '0' | '1' | '2',
        planId: result.plan_id,
        planName: result.plan_name,
        status: result.status,
        currentPeriodEnd: result.current_period_end,
        cancelAtPeriodEnd: result.cancel_at_period_end
      }
    },
    enabled: !!user,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  })

  // Query for subscription plans
  const { 
    data: subscriptionPlans = [], 
    isLoading: isLoadingPlans 
  } = useQuery({
    queryKey: ['subscription', 'plans'],
    queryFn: async (): Promise<SubscriptionPlan[]> => {
      const { data, error } = await supabase.rpc('get_subscription_plans')

      if (error) {
        console.error('Error fetching subscription plans:', error)
        return []
      }

      return data?.map((plan: any) => ({
        id: plan.id,
        name: plan.name,
        description: plan.description,
        priceCents: plan.price_cents,
        currency: plan.currency,
        intervalType: plan.interval_type,
        stripePriceId: plan.stripe_price_id,
        features: plan.features || []
      })) || []
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })

  const refreshSubscriptionStatus = async () => {
    await refetchStatus()
  }

  // Computed values
  const hasActiveSubscription = subscriptionStatus?.subscriptionStatus !== '0'
  const canAccessDashboard = hasActiveSubscription

  const contextValue: SubscriptionContextType = {
    subscriptionStatus,
    subscriptionPlans,
    isLoading: isLoading || isLoadingStatus,
    isLoadingPlans,
    hasActiveSubscription,
    canAccessDashboard,
    refreshSubscriptionStatus,
  }

  return (
    <SubscriptionContext.Provider value={contextValue}>
      {children}
    </SubscriptionContext.Provider>
  )
}

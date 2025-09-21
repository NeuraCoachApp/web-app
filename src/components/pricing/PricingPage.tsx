'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/src/contexts/AuthContext'
import { Check, Sparkles, Users, Zap, ArrowRight } from 'lucide-react'
import { useSubscription } from '@/src/contexts/SubscriptionContext'

interface PricingPlan {
  id: string
  name: string
  price: number
  interval: string
  description: string
  features: string[]
  popular?: boolean
  stripeCheckoutUrl: string
}

export const plans: PricingPlan[] = [
  {
    id: 'ai_coach',
    name: 'AI Coach',
    price: 20,
    interval: 'month',
    description: 'Perfect for individuals ready to transform their goals into reality with AI-powered coaching.',
    stripeCheckoutUrl: 'https://buy.stripe.com/test_bJe4gAaVwckl6VX4KBgrS01', // Your actual Stripe checkout URL
    features: [
      'AI-powered goal setting and planning',
      'Daily personalized check-ins',
      'Progress tracking and insights',
      'Mood and motivation monitoring',
      'Adaptive task management',
      'Achievement analytics'
    ]
  },
  {
    id: 'ai_human_coach',
    name: 'AI Coach + Human Coach',
    price: 280,
    interval: 'month',
    description: 'The ultimate coaching experience combining AI efficiency with human expertise and empathy.',
    stripeCheckoutUrl: 'https://buy.stripe.com/test_8x28wQgfQest3JL6SJgrS00', // Your actual Stripe checkout URL
    popular: true,
    features: [
      'Everything in AI Coach',
      'Weekly 1-on-1 human coaching sessions',
      'Personalized strategy development',
      'Priority support and guidance',
      'Custom goal frameworks',
      'Accountability partnership',
      'Expert intervention when needed'
    ]
  }
]

export default function PricingPage() {
  const { user, loading: authLoading } = useAuth()
  const { canAccessDashboard } = useSubscription()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth')
    }
  }, [user, authLoading, router])

  // Redirect to dashboard if user already has an active subscription
  useEffect(() => {
    if (!authLoading && user && canAccessDashboard) {
      router.push('/dashboard')
    }
  }, [user, authLoading, canAccessDashboard, router])

  // Handle successful checkout session
  useEffect(() => {
    const sessionId = searchParams.get('session_id')
    if (sessionId) {
      setShowSuccessMessage(true)
      // Show success message and redirect to onboarding
      setTimeout(() => {
        router.push('/onboarding')
      }, 3000)
    }
  }, [searchParams, router])

  const getCheckoutUrl = (plan: PricingPlan) => {
    if (!user?.email) return plan.stripeCheckoutUrl
    return `${plan.stripeCheckoutUrl}?prefilled_email=${encodeURIComponent(user.email)}`
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (showSuccessMessage) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Welcome to NeuraCoach!
          </h1>
          <p className="text-muted-foreground mb-6">
            Your subscription is now active. Let's get you started with your personalized coaching journey.
          </p>
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-4">
            Redirecting to onboarding...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary/5 to-transparent">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Choose Your Coaching Journey
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Start transforming your goals into achievements with the power of AI coaching, 
              or supercharge your progress with human expertise.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Check className="w-4 h-4 text-green-500" />
              <span>30-day money-back guarantee</span>
              <span className="mx-2">•</span>
              <Check className="w-4 h-4 text-green-500" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl border-2 p-8 transition-all duration-300 hover:shadow-lg bg-card ${
                plan.popular
                  ? 'border-primary shadow-lg scale-105 ring-2 ring-primary/20'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Most Popular
                  </div>
                </div>
              )}

              <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-2 mb-4">
                  {plan.id === 'ai_coach' ? (
                    <Zap className="w-6 h-6 text-primary" />
                  ) : (
                    <Users className="w-6 h-6 text-primary" />
                  )}
                  <h3 className="text-2xl font-bold text-foreground">{plan.name}</h3>
                </div>
                
                <div className="mb-4">
                  <span className="text-4xl font-bold text-foreground">${plan.price}</span>
                  <span className="text-muted-foreground">/{plan.interval}</span>
                </div>
                
                <p className="text-muted-foreground">{plan.description}</p>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <a 
                href={getCheckoutUrl(plan)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center px-4 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-colors"
              >
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </a>
            </div>
          ))}
        </div>

        {/* FAQ Section 
        <div className="max-w-3xl mx-auto mt-20">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                What's the difference between AI Coach and AI + Human Coach?
              </h3>
              <p className="text-muted-foreground">
                AI Coach provides automated, intelligent coaching through daily check-ins, progress tracking, 
                and personalized insights. AI + Human Coach adds weekly 1-on-1 sessions with professional 
                coaches who provide strategic guidance, accountability, and human connection to accelerate your progress.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Can I upgrade or downgrade my plan?
              </h3>
              <p className="text-muted-foreground">
                Yes! You can change your plan at any time. Upgrades take effect immediately, while downgrades 
                will take effect at the end of your current billing period.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Is there a free trial?
              </h3>
              <p className="text-muted-foreground">
                We offer a 30-day money-back guarantee instead of a free trial. This ensures you get the full 
                experience and can see real results before committing long-term.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                How do the human coaching sessions work?
              </h3>
              <p className="text-muted-foreground">
                Human coaches are certified professionals who meet with you weekly via video call. They review 
                your AI-generated insights, help you overcome obstacles, and provide strategic guidance tailored 
                to your unique situation and goals.
              </p>
            </div>
          </div>
        </div>*/}
      </div>
    </div>
  )
}
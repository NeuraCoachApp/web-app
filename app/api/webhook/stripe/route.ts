import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { supabase } from '@/src/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: NextRequest) {
  console.log('🔔 Webhook endpoint hit - POST method')
  
  const body = await req.text()
  const signature = headers().get('stripe-signature')!
  
  console.log('Webhook signature present:', !!signature)

  let data: any
  let eventType: string
  let event: Stripe.Event

  // Verify Stripe event is legit
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error(`Webhook signature verification failed. ${err.message}`)
    return NextResponse.json({ error: err.message }, { status: 400 })
  }

  data = event.data
  eventType = event.type

  console.log(`📨 Processing webhook event: ${eventType}`)

  try {
    switch (eventType) {
      case 'checkout.session.completed': {
        console.log('🛒 Processing checkout.session.completed event')
        
        // First payment is successful and a subscription is created
        const session = await stripe.checkout.sessions.retrieve(
          data.object.id,
          {
            expand: ['line_items', 'subscription']
          }
        )

        console.log('📋 Session data:', {
          id: session.id,
          mode: session.mode,
          customer: !!session.customer,
          subscription: !!session.subscription,
          lineItems: session.line_items?.data?.length || 0,
          priceId: session.line_items?.data?.[0]?.price?.id
        })

        // Check if this is a subscription checkout
        if (session.mode !== 'subscription') {
          console.log(`ℹ️ Skipping non-subscription checkout (mode: ${session.mode})`)
          break
        }

        if (!session.customer || !session.subscription || !session.line_items?.data?.[0]?.price?.id) {
          console.error('❌ Missing required session data:', {
            customer: !!session.customer,
            subscription: !!session.subscription,
            priceId: !!session.line_items?.data?.[0]?.price?.id,
            mode: session.mode
          })
          break
        }

        const customerId = session.customer as string
        const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer
        const priceId = session.line_items.data[0].price.id
        const subscription = session.subscription as Stripe.Subscription

        if (!customer.email) {
          console.error('Missing customer email for customer:', customerId)
          break
        }

        console.log('Processing checkout for customer email:', customer.email)

        // Get user profile using our new RPC function
        const { data: profileData, error: profileError } = await supabase.rpc('get_profile_from_email', {
          p_email: customer.email
        })

        if (profileError || !profileData || profileData.length === 0) {
          console.error('No user found with email:', customer.email, 'Error:', profileError)
          console.log('Profile lookup result:', { profileData, profileError })
          break
        }

        const userId = profileData[0].uuid

        // Determine plan ID from price ID
        let planId = 'ai_coach' // default
        console.log('Processing price ID:', priceId)
        
        // Map price IDs to plan IDs - check both production and test price IDs
        if (priceId === 'prod_T5xHTC6jEc5Er1' || priceId === 'price_ai_human_coach_monthly') {
          planId = 'ai_human_coach' // $280/mo AI + Human Coach
        } else if (priceId === 'prod_T5xGeTSEElsM3B' || priceId === 'price_ai_coach_monthly') {
          planId = 'ai_coach' // $20/mo AI Coach
        } else {
          console.warn('Unknown price ID:', priceId, 'defaulting to ai_coach plan')
        }

        // Create subscription record using our RPC function
        const { error } = await supabase.rpc('upsert_subscription', {
          p_user_uuid: userId,
          p_stripe_customer_id: customerId,
          p_stripe_subscription_id: subscription.id,
          p_plan_id: planId,
          p_status: subscription.status,
          p_current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
          p_current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
          p_cancel_at_period_end: (subscription as any).cancel_at_period_end || false,
          p_canceled_at: (subscription as any).canceled_at ? new Date((subscription as any).canceled_at * 1000).toISOString() : undefined,
          p_trial_start: (subscription as any).trial_start ? new Date((subscription as any).trial_start * 1000).toISOString() : undefined,
          p_trial_end: (subscription as any).trial_end ? new Date((subscription as any).trial_end * 1000).toISOString() : undefined,
        })

        if (error) {
          console.error('❌ Error creating subscription:', error)
          console.log('📊 Subscription data attempted:', {
            userId,
            customerId,
            subscriptionId: subscription.id,
            planId,
            status: subscription.status
          })
          break
        }

        console.log(`✅ Subscription created successfully!`)
        console.log(`👤 User: ${userId}`)
        console.log(`📦 Plan: ${planId}`)
        console.log(`🔄 Status: ${subscription.status}`)
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        console.log(`🔄 Processing subscription event: ${eventType}`)
        
        // Subscription created or updated
        const subscription = data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer

        if (!customer.email) {
          console.error('No customer email found')
          break
        }

        // Get user profile using our RPC function
        const { data: profileData, error: profileError } = await supabase.rpc('get_profile_from_email', {
          p_email: customer.email
        })

        if (profileError || !profileData || profileData.length === 0) {
          console.error('No user found with email:', customer.email)
          break
        }

        const userId = profileData[0].uuid
        const priceId = subscription.items.data[0]?.price.id

        // Determine plan ID from price ID
        let planId = 'ai_coach' // default
        console.log('Processing price ID for subscription update:', priceId)
        
        // Map price IDs to plan IDs - check both production and test price IDs
        if (priceId === 'prod_T5xHTC6jEc5Er1' || priceId === 'price_ai_human_coach_monthly') {
          planId = 'ai_human_coach'
        } else if (priceId === 'prod_T5xGeTSEElsM3B' || priceId === 'price_ai_coach_monthly') {
          planId = 'ai_coach'
        } else {
          console.warn('Unknown price ID in subscription update:', priceId, 'defaulting to ai_coach plan')
        }

        // Update subscription using our RPC function
        const { error } = await supabase.rpc('upsert_subscription', {
          p_user_uuid: userId,
          p_stripe_customer_id: customerId,
          p_stripe_subscription_id: subscription.id,
          p_plan_id: planId,
          p_status: subscription.status,
          p_current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
          p_current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
          p_cancel_at_period_end: (subscription as any).cancel_at_period_end || false,
          p_canceled_at: (subscription as any).canceled_at ? new Date((subscription as any).canceled_at * 1000).toISOString() : undefined,
          p_trial_start: (subscription as any).trial_start ? new Date((subscription as any).trial_start * 1000).toISOString() : undefined,
          p_trial_end: (subscription as any).trial_end ? new Date((subscription as any).trial_end * 1000).toISOString() : undefined,
        })

        if (error) {
          console.error('Error updating subscription:', error)
          break
        }

        console.log(`🔄 Subscription updated for user ${userId}, status: ${subscription.status}`)
        break
      }

      case 'customer.subscription.deleted': {
        // ❌ Revoke access to the product
        const subscription = data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer

        if (!customer.email) {
          console.error('No customer email found')
          break
        }

        // Get user profile using our RPC function
        const { data: profileData, error: profileError } = await supabase.rpc('get_profile_from_email', {
          p_email: customer.email
        })

        if (profileError || !profileData || profileData.length === 0) {
          console.error('No user found with email:', customer.email)
          break
        }

        const userId = profileData[0].uuid

        // Update subscription status to canceled and revoke access
        const { error: subscriptionError } = await supabase
          .from('subscriptions')
          .update({ 
            status: 'canceled',
            canceled_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscription.id)

        if (subscriptionError) {
          console.error('Error updating subscription status:', subscriptionError)
        }

        // Update profile subscription_status to '0' (no access)
        const { error: profileError2 } = await supabase
          .from('profile')
          .update({ 
            subscription_status: '0',
            updated_at: new Date().toISOString()
          })
          .eq('uuid', userId)

        if (profileError2) {
          console.error('Error updating profile subscription status:', profileError2)
        }

        console.log(`❌ Subscription canceled for user ${userId}`)
        break
      }

      case 'customer.created': {
        // Customer created - just acknowledge it
        const customer = data.object as Stripe.Customer
        console.log(`👤 Customer created: ${customer.email}`)
        break
      }

      default:
        console.log(`⚠️ Unhandled event type: ${eventType}`)
        console.log(`📋 Available handlers: checkout.session.completed, customer.subscription.created, customer.subscription.updated, customer.subscription.deleted, customer.created`)
    }
  } catch (e: any) {
    console.error('Stripe error: ' + e.message + ' | EVENT TYPE: ' + eventType)
  }

  return NextResponse.json({ received: true })
}

// Add GET method for testing endpoint accessibility
export async function GET() {
  return NextResponse.json({ 
    message: 'Stripe webhook endpoint is accessible',
    timestamp: new Date().toISOString()
  })
}
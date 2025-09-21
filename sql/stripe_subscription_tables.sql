-- Stripe Subscription Management Tables for NeuraCoach
-- These functions should be executed in your Supabase SQL editor

-- Create subscription plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  interval_type TEXT NOT NULL CHECK (interval_type IN ('month', 'year')),
  stripe_price_id TEXT UNIQUE NOT NULL,
  features JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_uuid UUID NOT NULL REFERENCES profile(uuid) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  plan_id TEXT NOT NULL REFERENCES subscription_plans(id),
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'trialing', 'unpaid')),
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  canceled_at TIMESTAMP WITH TIME ZONE,
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payment transactions table for tracking payments
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_uuid UUID NOT NULL REFERENCES profile(uuid) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  stripe_payment_intent_id TEXT UNIQUE NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL CHECK (status IN ('succeeded', 'pending', 'failed', 'canceled')),
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default subscription plans
INSERT INTO subscription_plans (id, name, description, price_cents, interval_type, stripe_price_id, features) VALUES
('ai_coach', 'AI Coach', 'Get personalized AI coaching to achieve your goals', 2000, 'month', 'price_ai_coach_monthly', '["AI-powered goal setting", "Daily check-ins", "Progress tracking", "Personalized insights"]'::jsonb),
('ai_human_coach', 'AI Coach + Human Coach', 'Complete coaching experience with AI and human support', 28000, 'month', 'price_ai_human_coach_monthly', '["Everything in AI Coach", "1-on-1 human coaching sessions", "Priority support", "Custom goal strategies"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Function to get user subscription status
CREATE OR REPLACE FUNCTION get_user_subscription_status(p_user_uuid UUID)
RETURNS TABLE(
  subscription_status TEXT,
  plan_id TEXT,
  plan_name TEXT,
  status TEXT,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN s.status = 'active' AND sp.id = 'ai_coach' THEN '1'
      WHEN s.status = 'active' AND sp.id = 'ai_human_coach' THEN '2'
      ELSE '0'
    END as subscription_status,
    s.plan_id,
    sp.name as plan_name,
    s.status,
    s.current_period_end,
    s.cancel_at_period_end
  FROM subscriptions s
  JOIN subscription_plans sp ON s.plan_id = sp.id
  WHERE s.user_uuid = p_user_uuid
  AND s.status IN ('active', 'trialing')
  ORDER BY s.created_at DESC
  LIMIT 1;
  
  -- If no active subscription found, return default values
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT '0'::TEXT as subscription_status, 
           NULL::TEXT as plan_id,
           NULL::TEXT as plan_name,
           NULL::TEXT as status,
           NULL::TIMESTAMP WITH TIME ZONE as current_period_end,
           NULL::BOOLEAN as cancel_at_period_end;
  END IF;
END;
$$;

-- Function to create or update subscription
CREATE OR REPLACE FUNCTION upsert_subscription(
  p_user_uuid UUID,
  p_stripe_customer_id TEXT,
  p_stripe_subscription_id TEXT,
  p_plan_id TEXT,
  p_status TEXT,
  p_current_period_start TIMESTAMP WITH TIME ZONE,
  p_current_period_end TIMESTAMP WITH TIME ZONE,
  p_cancel_at_period_end BOOLEAN DEFAULT false,
  p_canceled_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_trial_start TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_trial_end TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  subscription_uuid UUID;
  new_subscription_status TEXT;
BEGIN
  -- Determine subscription status based on plan and status
  new_subscription_status := CASE 
    WHEN p_status IN ('active', 'trialing') AND p_plan_id = 'ai_coach' THEN '1'
    WHEN p_status IN ('active', 'trialing') AND p_plan_id = 'ai_human_coach' THEN '2'
    ELSE '0'
  END;

  -- Insert or update subscription
  INSERT INTO subscriptions (
    user_uuid, stripe_customer_id, stripe_subscription_id, plan_id, 
    status, current_period_start, current_period_end, cancel_at_period_end,
    canceled_at, trial_start, trial_end, updated_at
  )
  VALUES (
    p_user_uuid, p_stripe_customer_id, p_stripe_subscription_id, p_plan_id,
    p_status, p_current_period_start, p_current_period_end, p_cancel_at_period_end,
    p_canceled_at, p_trial_start, p_trial_end, NOW()
  )
  ON CONFLICT (stripe_subscription_id)
  DO UPDATE SET
    status = EXCLUDED.status,
    current_period_start = EXCLUDED.current_period_start,
    current_period_end = EXCLUDED.current_period_end,
    cancel_at_period_end = EXCLUDED.cancel_at_period_end,
    canceled_at = EXCLUDED.canceled_at,
    trial_start = EXCLUDED.trial_start,
    trial_end = EXCLUDED.trial_end,
    updated_at = NOW()
  RETURNING id INTO subscription_uuid;

  -- Update profile subscription_status
  UPDATE profile 
  SET subscription_status = new_subscription_status,
      updated_at = NOW()
  WHERE uuid = p_user_uuid;

  RETURN subscription_uuid;
END;
$$;

-- Function to record payment transaction
CREATE OR REPLACE FUNCTION record_payment_transaction(
  p_user_uuid UUID,
  p_subscription_id UUID,
  p_stripe_payment_intent_id TEXT,
  p_amount_cents INTEGER,
  p_currency TEXT,
  p_status TEXT,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  transaction_uuid UUID;
BEGIN
  INSERT INTO payment_transactions (
    user_uuid, subscription_id, stripe_payment_intent_id, 
    amount_cents, currency, status, description, metadata
  )
  VALUES (
    p_user_uuid, p_subscription_id, p_stripe_payment_intent_id,
    p_amount_cents, p_currency, p_status, p_description, p_metadata
  )
  ON CONFLICT (stripe_payment_intent_id)
  DO UPDATE SET
    status = EXCLUDED.status,
    updated_at = NOW()
  RETURNING id INTO transaction_uuid;

  RETURN transaction_uuid;
END;
$$;

-- Function to get subscription plans
CREATE OR REPLACE FUNCTION get_subscription_plans()
RETURNS TABLE(
  id TEXT,
  name TEXT,
  description TEXT,
  price_cents INTEGER,
  currency TEXT,
  interval_type TEXT,
  stripe_price_id TEXT,
  features JSONB
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  RETURN QUERY
  SELECT sp.id, sp.name, sp.description, sp.price_cents, sp.currency, 
         sp.interval_type, sp.stripe_price_id, sp.features
  FROM subscription_plans sp
  WHERE sp.is_active = true
  ORDER BY sp.price_cents ASC;
END;
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_uuid ON subscriptions(user_uuid);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_uuid ON payment_transactions(user_uuid);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_subscription_id ON payment_transactions(subscription_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON subscription_plans TO authenticated;
GRANT SELECT, INSERT, UPDATE ON subscriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON payment_transactions TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_subscription_status(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_subscription(UUID, TEXT, TEXT, TEXT, TEXT, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, BOOLEAN, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) TO authenticated;
GRANT EXECUTE ON FUNCTION record_payment_transaction(UUID, UUID, TEXT, INTEGER, TEXT, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION get_subscription_plans() TO authenticated;

-- Enable RLS (Row Level Security)
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view subscription plans" ON subscription_plans
  FOR SELECT USING (true);

CREATE POLICY "Users can view their own subscriptions" ON subscriptions
  FOR ALL USING (auth.uid()::text = user_uuid::text);

CREATE POLICY "Users can view their own payment transactions" ON payment_transactions
  FOR ALL USING (auth.uid()::text = user_uuid::text);

import AuthForm from '@/src/components/auth/AuthForm'
import SetupRequired from '@/src/components/ui/setup-required'
import { isSupabaseConfigured } from '@/src/lib/supabase'

export default function AuthPage() {
  if (!isSupabaseConfigured) {
    return (
      <SetupRequired 
        title="Authentication Setup Required"
        message="Supabase configuration is required for authentication features."
      />
    )
  }

  return <AuthForm />
}

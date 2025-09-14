'use client'

import React from 'react'
import { CheckInProvider } from '@/src/components/check_in/CheckInProvider'
import { CheckInFlow } from '@/src/components/check_in/CheckInFlow'
import { CoachProvider } from '@/src/contexts/CoachContext'

export default function CheckInPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-background/80">
      <CoachProvider>
        <CheckInProvider>
          <CheckInFlow />
        </CheckInProvider>
      </CoachProvider>
    </main>
  )
}

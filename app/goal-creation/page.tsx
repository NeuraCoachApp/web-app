'use client'

import { GoalCreationProvider, GoalCreationFlow } from '@/src/components/goalCreation'

export default function GoalCreation() {
  return (
    <GoalCreationProvider>
      <GoalCreationFlow />
    </GoalCreationProvider>
  )
}

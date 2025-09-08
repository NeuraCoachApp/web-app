'use client'

import { GoalCreationProvider, GoalCreationFlow } from '@/src/components/goal_creation'

export default function GoalCreation() {
  return (
    <GoalCreationProvider>
      <GoalCreationFlow />
    </GoalCreationProvider>
  )
}

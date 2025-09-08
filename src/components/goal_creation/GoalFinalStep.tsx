'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { GoalStepBase, GoalStepText, GoalStepButton } from './GoalStepBase'
import { useGoalCreationContext } from './GoalCreationProvider'

export function GoalFinalStep() {
  const router = useRouter()
  const { getCurrentText, currentStepData } = useGoalCreationContext()

  const handleFinish = async () => {
    // Wait a moment to ensure all mutations have completed and caches are invalidated
    await new Promise(resolve => setTimeout(resolve, 200))
    router.push('/dashboard')
  }

  return (
    <GoalStepBase>
      <GoalStepText 
        title={getCurrentText()}
        subtitle={currentStepData?.subtext}
      />

      <div className="mt-8">
        <GoalStepButton
          onClick={handleFinish}
          variant="gradient"
          className="px-12 py-4"
        >
          Let's Get Started!
        </GoalStepButton>
      </div>
    </GoalStepBase>
  )
}

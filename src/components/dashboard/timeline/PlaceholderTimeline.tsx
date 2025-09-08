import React from 'react'
import { Target, Circle } from 'lucide-react'

export default function PlaceholderTimeline() {
  const placeholderSteps = Array.from({ length: 10 }, (_, i) => ({
    id: i,
    text: `Step ${i + 1}`,
    isPlaceholder: true
  }))

  return (
    <div className="w-full">
      <div className="mb-8">
        {/* Horizontal Timeline Container */}
        <div className="relative overflow-x-auto py-32">
          <div className="flex items-center min-w-max px-8">
            
            {/* Goal Creation Block - Glowing */}
            <div className="relative flex flex-col items-center mr-20">
              <div 
                onClick={() => window.location.href = '/goal-creation'}
                className="w-32 h-32 bg-primary rounded-lg cursor-pointer 
                         transition-all duration-200 hover:shadow-lg hover:scale-105
                         flex flex-col items-center justify-center p-4
                         animate-pulse shadow-lg shadow-primary/50 ring-2 ring-primary/30"
              >
                <Target className="w-8 h-8 text-primary-foreground mb-2" />
                <p className="text-xs font-medium text-primary-foreground text-center leading-tight">
                  Create Your Goal
                </p>
              </div>
              <div className="mt-2 text-center">
                <p className="text-xs text-muted-foreground">Start Here</p>
              </div>
              
              {/* Timeline line starting from goal creation */}
              <div className="absolute left-full top-1/2 transform -translate-y-1/2 w-20 h-0.5 bg-muted opacity-50" />
            </div>

            {/* Placeholder Steps with alternating up/down pattern */}
            <div className="relative flex items-center">
              {/* Main horizontal timeline line */}
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-muted opacity-50 transform -translate-y-1/2" />
              
              {placeholderSteps.map((step, stepIndex) => {
                const isEven = stepIndex % 2 === 0
                
                return (
                  <div key={step.id} className="relative flex-shrink-0 mr-32">
                    {/* Timeline dot at center intersection */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-muted opacity-50 rounded-full z-20" />
                    
                    {/* Connecting line extending from center to step */}
                    <div className={`absolute left-1/2 transform -translate-x-1/2 w-0.5 bg-muted opacity-50 z-0 ${
                      isEven 
                        ? 'top-1/2 h-20' // Line extending down from center
                        : 'top-1/2 -translate-y-full h-20' // Line extending up from center
                    }`} />
                    
                    {/* Step positioned at end of connecting line */}
                    <div className={`absolute left-1/2 transform -translate-x-1/2 ${
                      isEven 
                        ? 'top-1/2 mt-20' // Position at bottom of down line
                        : 'top-1/2 -translate-y-full -mt-20' // Position at top of up line
                    }`}>
                      {/* Placeholder Step Square */}
                      <div className="w-28 h-28 bg-muted/30 rounded-lg 
                                    flex flex-col items-center justify-center p-3 
                                    opacity-40">
                        {/* Status Icon */}
                        <div className="absolute top-2 right-2">
                          <Circle className="w-4 h-4 text-muted-foreground/50" />
                        </div>
                        
                        {/* Step content */}
                        <div className="flex-1 flex flex-col items-center justify-center text-center">
                          <p className="text-xs font-medium text-muted-foreground/70 leading-tight">
                            {step.text}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            
            {/* Goal Completion Placeholder */}
            <div className="relative flex flex-col items-center ml-16">
              <div className="w-28 h-28 bg-muted/30 rounded-lg opacity-40
                           flex flex-col items-center justify-center p-3">
                <Target className="w-7 h-7 text-muted-foreground/50 mb-1" />
                <p className="text-xs font-medium text-muted-foreground/70 text-center">
                  Complete
                </p>
              </div>
              <div className="mt-3 text-center">
                <p className="text-xs text-muted-foreground/70">Finish</p>
              </div>
              
              {/* Timeline line ending at completion */}
              <div className="absolute right-full top-1/2 transform -translate-y-1/2 w-16 h-0.5 bg-muted opacity-50" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

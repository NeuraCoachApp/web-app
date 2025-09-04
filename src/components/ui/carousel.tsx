'use client'

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

type CarouselApi = {
  scrollNext: () => void
  scrollPrev: () => void
  selectedScrollSnap: () => number
  on: (event: string, callback: () => void) => void
}

interface CarouselProps {
  children: React.ReactNode
  className?: string
  setApi?: (api: CarouselApi) => void
  opts?: {
    align?: string
    loop?: boolean
  }
}

interface CarouselContextProps {
  api: CarouselApi | null
  scrollNext: () => void
  scrollPrev: () => void
}

const CarouselContext = React.createContext<CarouselContextProps | null>(null)

export function Carousel({ children, className = "", setApi, opts }: CarouselProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0)
  const [itemsCount, setItemsCount] = React.useState(0)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const scrollNext = React.useCallback(() => {
    if (opts?.loop) {
      setCurrentIndex(prev => (prev + 1) % itemsCount)
    } else {
      setCurrentIndex(prev => Math.min(prev + 1, itemsCount - 1))
    }
  }, [itemsCount, opts?.loop])

  const scrollPrev = React.useCallback(() => {
    if (opts?.loop) {
      setCurrentIndex(prev => (prev - 1 + itemsCount) % itemsCount)
    } else {
      setCurrentIndex(prev => Math.max(prev - 1, 0))
    }
  }, [itemsCount, opts?.loop])

  const api: CarouselApi = React.useMemo(() => ({
    scrollNext,
    scrollPrev,
    selectedScrollSnap: () => currentIndex,
    on: (event: string, callback: () => void) => {
      if (event === 'select') {
        callback()
      }
    }
  }), [scrollNext, scrollPrev, currentIndex])

  React.useEffect(() => {
    if (setApi) {
      setApi(api)
    }
  }, [api, setApi])

  React.useEffect(() => {
    const container = containerRef.current
    if (container) {
      const items = container.querySelectorAll('[data-carousel-item]')
      setItemsCount(items.length)
    }
  }, [children])

  return (
    <CarouselContext.Provider value={{ api, scrollNext, scrollPrev }}>
      <div className={`relative ${className}`}>
        <div className="overflow-hidden" ref={containerRef}>
          <div 
            className="flex transition-transform duration-300 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {children}
          </div>
        </div>
      </div>
    </CarouselContext.Provider>
  )
}

export function CarouselContent({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

export function CarouselItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-w-0 shrink-0 grow-0 basis-full" data-carousel-item>
      {children}
    </div>
  )
}

export function CarouselPrevious({ className = "" }: { className?: string }) {
  const context = React.useContext(CarouselContext)
  
  return (
    <button
      onClick={context?.scrollPrev}
      className={`absolute top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-gray-50 ${className}`}
    >
      <ChevronLeft className="h-4 w-4" />
    </button>
  )
}

export function CarouselNext({ className = "" }: { className?: string }) {
  const context = React.useContext(CarouselContext)
  
  return (
    <button
      onClick={context?.scrollNext}
      className={`absolute top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-gray-50 ${className}`}
    >
      <ChevronRight className="h-4 w-4" />
    </button>
  )
}

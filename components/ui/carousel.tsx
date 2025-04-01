"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

type CarouselApi = {
  scrollPrev: () => void
  scrollNext: () => void
  canScrollPrev: () => boolean
  canScrollNext: () => boolean
  scrollTo: (index: number, instant?: boolean) => void
  selectedScrollSnap: () => number
  scrollSnapList: () => number[]
  on: (eventName: string, callback: () => void) => void
}

const CarouselContext = React.createContext<CarouselApi | null>(null)

function useCarousel() {
  const context = React.useContext(CarouselContext)
  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />")
  }
  return context
}

const Carousel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    setApi?: (api: CarouselApi) => void
  }
>(({ setApi, className, children, ...props }, ref) => {
  const [carouselRef, setCarouselRef] = React.useState<HTMLDivElement | null>(null)
  const [api, setInternalApi] = React.useState<CarouselApi | null>(null)

  // Mock API for simple carousel
  React.useEffect(() => {
    if (!carouselRef) return
    
    // Simple carousel implementation
    const scrollSnapList = () => [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    let currentIndex = 0
    
    const mockApi: CarouselApi = {
      scrollPrev: () => {
        if (currentIndex > 0) {
          currentIndex -= 1
          carouselRef.scrollTo({ left: currentIndex * carouselRef.clientWidth, behavior: 'smooth' })
        }
      },
      scrollNext: () => {
        const childCount = carouselRef.children.length
        if (currentIndex < childCount - 1) {
          currentIndex += 1
          carouselRef.scrollTo({ left: currentIndex * carouselRef.clientWidth, behavior: 'smooth' })
        }
      },
      canScrollPrev: () => currentIndex > 0,
      canScrollNext: () => {
        const childCount = carouselRef.children.length
        return currentIndex < childCount - 1
      },
      scrollTo: (index, instant = false) => {
        currentIndex = index
        carouselRef.scrollTo({ 
          left: index * carouselRef.clientWidth, 
          behavior: instant ? 'auto' : 'smooth' 
        })
      },
      selectedScrollSnap: () => currentIndex,
      scrollSnapList,
      on: (eventName, callback) => {
        if (eventName === 'select') {
          carouselRef.addEventListener('scroll', () => {
            const newIndex = Math.round(carouselRef.scrollLeft / carouselRef.clientWidth)
            if (newIndex !== currentIndex) {
              currentIndex = newIndex
              callback()
            }
          })
        }
      }
    }
    
    setInternalApi(mockApi)
    if (setApi) {
      setApi(mockApi)
    }
  }, [carouselRef, setApi])

  return (
    <CarouselContext.Provider value={api}>
      <div
        ref={(el) => {
          setCarouselRef(el)
          if (typeof ref === 'function') {
            ref(el)
          } else if (ref) {
            ref.current = el
          }
        }}
        className={cn("relative", className)}
        {...props}
      >
        {children}
      </div>
    </CarouselContext.Provider>
  )
})
Carousel.displayName = "Carousel"

const CarouselContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex overflow-x-auto snap-x snap-mandatory scroll-smooth",
      className
    )}
    {...props}
  />
))
CarouselContent.displayName = "CarouselContent"

const CarouselItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex-none snap-start min-w-0 w-full",
      className
    )}
    {...props}
  />
))
CarouselItem.displayName = "CarouselItem"

const CarouselPrevious = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => {
  const { scrollPrev, canScrollPrev } = useCarousel()

  return (
    <button
      ref={ref}
      className={cn(
        "absolute left-2 top-1/2 -translate-y-1/2 flex items-center justify-center size-8 rounded-full bg-white/70 dark:bg-zinc-800/70 hover:bg-white dark:hover:bg-zinc-700",
        className
      )}
      disabled={!canScrollPrev()}
      onClick={(e) => {
        e.stopPropagation()
        scrollPrev()
      }}
      {...props}
    >
      <ChevronLeftIcon className="size-5" />
    </button>
  )
})
CarouselPrevious.displayName = "CarouselPrevious"

const CarouselNext = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => {
  const { scrollNext, canScrollNext } = useCarousel()

  return (
    <button
      ref={ref}
      className={cn(
        "absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center size-8 rounded-full bg-white/70 dark:bg-zinc-800/70 hover:bg-white dark:hover:bg-zinc-700",
        className
      )}
      disabled={!canScrollNext()}
      onClick={(e) => {
        e.stopPropagation()
        scrollNext()
      }}
      {...props}
    >
      <ChevronRightIcon className="size-5" />
    </button>
  )
})
CarouselNext.displayName = "CarouselNext"

export {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} 
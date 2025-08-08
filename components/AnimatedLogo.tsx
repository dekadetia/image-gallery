'use client'

import { useRef, useEffect, useState } from 'react'
import Lottie from 'lottie-react'
import logoAnim from './logo.json' // adjust path as needed

export default function AnimatedLogo() {
  const lottieRef = useRef<any>(null)
  const [isAlt, setIsAlt] = useState(false)

  // On first load, restore from sessionStorage
  useEffect(() => {
    const savedState = sessionStorage.getItem('logoState') || 'base'
    const alt = savedState === 'alt'
    setIsAlt(alt)

    // Jump to correct frame immediately
    const targetFrame = alt ? 60 : 0
    lottieRef.current?.goToAndStop(targetFrame, true)
  }, [])

  const toggleState = () => {
    const newAlt = !isAlt
    setIsAlt(newAlt)
    sessionStorage.setItem('logoState', newAlt ? 'alt' : 'base')

    const segment = newAlt ? [0, 60] : [60, 0]
    lottieRef.current?.playSegments(segment, true)
  }

  // Longtap support for mobile
  useEffect(() => {
    const element = lottieRef.current?.container
    if (!element) return

    let longTapTimer: ReturnType<typeof setTimeout> | null = null

    const handleTouchStart = () => {
      longTapTimer = setTimeout(toggleState, 500)
    }

    const handleTouchEnd = () => {
      if (longTapTimer) clearTimeout(longTapTimer)
    }

    element.addEventListener('touchstart', handleTouchStart)
    element.addEventListener('touchend', handleTouchEnd)

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isAlt])

  return (
    <div
      onMouseEnter={toggleState}
      className="cursor-pointer w-[300px] h-[300px]" // optional styling
    >
      <Lottie
        lottieRef={lottieRef}
        animationData={logoAnim}
        autoplay={false}
        loop={false}
      />
    </div>
  )
}

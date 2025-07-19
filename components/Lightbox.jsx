'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

export default function Lightbox({ open, slides, index, onClose, setIndex }) {
  const [currentIndex, setCurrentIndex] = useState(index)
  const containerRef = useRef(null)
  const metadataRef = useRef(null)
  const touchStartX = useRef(null)
  const [metadataHeight, setMetadataHeight] = useState(150) // fallback height

  useEffect(() => {
    if (open) setCurrentIndex(index)
  }, [index, open])

  // Key navigation
  useEffect(() => {
    if (!open) return

    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') nextSlide()
      if (e.key === 'ArrowLeft') prevSlide()
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, currentIndex])

  // Update metadata height for layout
  useEffect(() => {
    if (metadataRef.current) {
      setMetadataHeight(metadataRef.current.offsetHeight)
    }
  }, [currentIndex, slides])

  // Swipe detection
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return
    const touchEndX = e.changedTouches[0].clientX
    const deltaX = touchEndX - touchStartX.current
    const swipeThreshold = 50 // minimum px to trigger swipe

    if (deltaX > swipeThreshold) prevSlide()
    else if (deltaX < -swipeThreshold) nextSlide()

    touchStartX.current = null
  }

  const nextSlide = () => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setIndex(currentIndex + 1)
    }
  }

  const prevSlide = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setIndex(currentIndex - 1)
    }
  }

  const handleClickOutside = (e) => {
    if (e.target === containerRef.current) onClose()
  }

  const safeIndex = Math.max(0, Math.min(currentIndex, slides.length - 1))
  const currentSlide = slides[safeIndex]

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={containerRef}
          onClick={handleClickOutside}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="yarl__container fixed inset-0 z-50 bg-black/90 overflow-hidden flex items-center justify-center"
        >
          <div
            className="yarl__slide relative max-w-[96vw] mx-auto flex flex-col items-center justify-center min-h-screen"
            style={{
              paddingBottom: '11px', // Push metadata down by 11px
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={safeIndex}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center"
              >
                {currentSlide ? (
                  currentSlide.src.endsWith('.webm') ? (
                    <video
                      src={currentSlide.src}
                      controls
                      autoPlay
                      className="object-contain max-w-full"
                      style={{
                        maxHeight: 'calc(-140px + 100vh)',
                      }}
                    />
                  ) : (
                    <img
                      src={currentSlide.src}
                      alt={currentSlide.title || ''}
                      className="object-contain max-w-full"
                      style={{
                        maxHeight: 'calc(-140px + 100vh)',
                      }}
                    />
                  )
                ) : (
                  <div className="text-white">Loading...</div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Metadata */}
            {currentSlide && (
              <div
                ref={metadataRef}
                className="lg:!w-[96%] text-left text-sm space-y-1 text-white px-0 lg:pt-[.25rem] lg:mb-[.25rem] yarl-slide-content"
                style={{
                  marginLeft: '-85px', // metadata shifted left
                  marginTop: '-8px',   // metadata nudged up
                }}
              >
                {currentSlide.title && (
                  <div className="yarl__slide_title text-lg" style={{ fontWeight: 'normal' }}>
                    {currentSlide.title}
                  </div>
                )}
                <div className="!space-y-0">
                  {currentSlide.director && (
                    <div className="yarl__slide_description !text-[#99AABB]">
                      {currentSlide.director}
                    </div>
                  )}
                  {currentSlide.description && (
                    <div className="yarl__slide_description">
                      {currentSlide.description}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

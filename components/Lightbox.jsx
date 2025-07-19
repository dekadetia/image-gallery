'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

export default function Lightbox({ open, slides, index, onClose, setIndex }) {
  const [currentIndex, setCurrentIndex] = useState(index)
  const [shouldScaleUp, setShouldScaleUp] = useState(false)
  const [isUltraWide, setIsUltraWide] = useState(false)
  const containerRef = useRef(null)
  const metadataRef = useRef(null)
  const mediaRef = useRef(null)
  const touchStartX = useRef(null)
  const [metadataHeight, setMetadataHeight] = useState(150)

  const containerWidth = typeof window !== 'undefined' ? window.innerWidth * 0.96 : 1200 // 96vw fallback
  const containerHeight = typeof window !== 'undefined' ? window.innerHeight - 140 : 800 // fallback for SSR
  const containerAspectRatio = containerWidth / containerHeight

  useEffect(() => {
    if (open) setCurrentIndex(index)
  }, [index, open])

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

  useEffect(() => {
    if (metadataRef.current) {
      setMetadataHeight(metadataRef.current.offsetHeight)
    }
  }, [currentIndex, slides])

  const handleMediaLoad = () => {
    if (mediaRef.current) {
      const naturalWidth = mediaRef.current.naturalWidth || mediaRef.current.videoWidth || 0
      const naturalHeight = mediaRef.current.naturalHeight || mediaRef.current.videoHeight || 0
      const aspectRatio = naturalWidth / naturalHeight

      setShouldScaleUp(naturalHeight < containerHeight)
      setIsUltraWide(aspectRatio > containerAspectRatio)
    }
  }

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return
    const touchEndX = e.changedTouches[0].clientX
    const deltaX = touchEndX - touchStartX.current
    const swipeThreshold = 50

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

  const commonStyles = shouldScaleUp
    ? {
        height: '100%',
        width: 'auto',
        maxWidth: '100%',
        marginBottom: '11px',
        objectFit: 'contain',
      }
    : {
        maxHeight: 'calc(-140px + 100vh)',
        width: 'auto',
        marginBottom: '11px',
        objectFit: 'contain',
      }

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
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={safeIndex}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center"
                style={{
                  height: 'calc(-140px + 100vh)',
                }}
              >
                {currentSlide ? (
                  currentSlide.src.endsWith('.webm') ? (
                    <video
                      ref={mediaRef}
                      src={currentSlide.src}
                      controls
                      autoPlay
                      onLoadedMetadata={handleMediaLoad}
                      className="object-contain max-w-full"
                      style={commonStyles}
                    />
                  ) : (
                    <img
                      ref={mediaRef}
                      src={currentSlide.src}
                      alt={currentSlide.title || ''}
                      onLoad={handleMediaLoad}
                      className="object-contain max-w-full"
                      style={commonStyles}
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
                  marginLeft: '-85px',
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

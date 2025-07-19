'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

export default function Lightbox({ open, slides, index, onClose, setIndex }) {
  const [currentIndex, setCurrentIndex] = useState(index)
  const containerRef = useRef(null)
  const touchStartX = useRef(null)
  const velocityThreshold = 500 // px/sec
  const swipeConfidenceThreshold = 0.3 // fraction of screen width

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

  const handleDragEnd = (event, info) => {
    const offset = info.offset.x
    const velocity = info.velocity.x
    const width = window.innerWidth

    if (offset < -width * swipeConfidenceThreshold || velocity < -velocityThreshold) {
      nextSlide()
    } else if (offset > width * swipeConfidenceThreshold || velocity > velocityThreshold) {
      prevSlide()
    }
  }

  const safeIndex = Math.max(0, Math.min(currentIndex, slides.length - 1))

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/90 overflow-hidden flex justify-center items-center"
        >
          <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleDragEnd}
            animate={{ x: -currentIndex * window.innerWidth }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="flex w-full h-full"
            style={{ touchAction: 'pan-y' }}
          >
            {slides.map((slide, i) => (
              <div
                key={i}
                className="w-screen h-full flex flex-col justify-center items-center flex-shrink-0"
              >
                {slide.src.endsWith('.webm') ? (
                  <video
                    src={slide.src}
                    controls
                    autoPlay
                    className="object-contain max-w-full max-h-full"
                  />
                ) : (
                  <img
                    src={slide.src}
                    alt={slide.title || ''}
                    className="object-contain max-w-full max-h-full"
                  />
                )}
                <div
                  className="lg:!w-[96%] text-left text-sm space-y-1 text-white px-0 lg:pt-[.25rem] lg:mb-[.25rem] yarl-slide-content"
                  style={{ marginLeft: '-85px' }}
                >
                  {slide.title && (
                    <div className="yarl__slide_title text-lg" style={{ fontWeight: 'normal' }}>
                      {slide.title}
                    </div>
                  )}
                  <div className="!space-y-0">
                    {slide.director && (
                      <div className="yarl__slide_description !text-[#99AABB]">
                        {slide.director}
                      </div>
                    )}
                    {slide.description && (
                      <div className="yarl__slide_description">
                        {slide.description}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

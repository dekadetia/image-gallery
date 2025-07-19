'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

export default function Lightbox({ open, slides, index, onClose, setIndex }) {
  const [currentIndex, setCurrentIndex] = useState(index)
  const containerRef = useRef(null)
  const metadataHeight = 150 // Estimated height for metadata + padding

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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="yarl__container fixed inset-0 z-50 flex justify-center items-center bg-black/90"
        >
          <div className="yarl__slide relative max-w-[96vw] max-h-[96vh] flex flex-col justify-center items-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={safeIndex}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col justify-center items-center"
              >
                {currentSlide ? (
                  currentSlide.src.endsWith('.webm') ? (
                    <video
                      src={currentSlide.src}
                      controls
                      autoPlay
                      className="max-h-[calc(100vh-150px)] max-w-full object-contain"
                    />
                  ) : (
                    <img
                      src={currentSlide.src}
                      alt={currentSlide.title || ''}
                      className="max-h-[calc(100vh-150px)] max-w-full object-contain"
                    />
                  )
                ) : (
                  <div className="text-white">Loading...</div>
                )}

                {/* Metadata */}
                {currentSlide && (
                  <div className="lg:!w-[96%] text-left text-sm space-y-1 lg:pt-[.5rem] lg:mb-[.75rem] pb-[1rem] text-white px-0 pt-0 lg:pl-0 lg:ml-[-35px] lg:pr-[3rem] yarl-slide-content">
                    {currentSlide.title && (
                      <div className="yarl__slide_title">{currentSlide.title}</div>
                    )}
                    <div className="!space-y-0">
                      {currentSlide.director && (
                        <div className="yarl__slide_description !text-[#99AABB]">
                          <span className="font-medium">{currentSlide.director}</span>
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
              </motion.div>
            </AnimatePresence>

            {/* Navigation Arrows */}
            {safeIndex > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); prevSlide() }}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white text-3xl"
              >
                ‹
              </button>
            )}
            {safeIndex < slides.length - 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); nextSlide() }}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white text-3xl"
              >
                ›
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

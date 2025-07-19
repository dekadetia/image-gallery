'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

export default function Lightbox({ open, slides, index, onClose, setIndex }) {
  const [currentIndex, setCurrentIndex] = useState(index)
  const [direction, setDirection] = useState(0) // -1 for left, 1 for right
  const containerRef = useRef(null)
  const metadataRef = useRef(null)
  const mediaRef = useRef(null)

  useEffect(() => {
    if (open) setCurrentIndex(index)
  }, [index, open])

  useEffect(() => {
    if (!open) return

    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') changeSlide(1)
      if (e.key === 'ArrowLeft') changeSlide(-1)
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, currentIndex])

  const changeSlide = (dir) => {
    setDirection(dir)
    const newIndex = (currentIndex + dir + slides.length) % slides.length
    setCurrentIndex(newIndex)
    setIndex(newIndex)
  }

  const handleClickOutside = (e) => {
    if (e.target === containerRef.current) onClose()
  }

  const safeIndex = Math.max(0, Math.min(currentIndex, slides.length - 1))
  const currentSlide = slides[safeIndex]

  const variants = {
    enter: (dir) => ({
      x: dir > 0 ? '100%' : '-100%',
      opacity: 0,
      position: 'absolute',
    }),
    center: {
      x: 0,
      opacity: 1,
      position: 'relative',
    },
    exit: (dir) => ({
      x: dir < 0 ? '100%' : '-100%',
      opacity: 0,
      position: 'absolute',
    }),
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={containerRef}
          onClick={handleClickOutside}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="yarl__container fixed inset-0 z-50 bg-black/90 overflow-hidden flex items-center justify-center"
        >
          <div className="yarl__slide relative max-w-[96vw] mx-auto flex flex-col items-center justify-center min-h-screen">
            <AnimatePresence custom={direction} mode="wait">
              <motion.div
                key={safeIndex}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: 'spring', stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 }
                }}
                drag="x"
                dragElastic={0.2}
                onDragEnd={(e, info) => {
                  if (info.offset.x < -100 || info.velocity.x < -500) {
                    changeSlide(1)
                  } else if (info.offset.x > 100 || info.velocity.x > 500) {
                    changeSlide(-1)
                  }
                }}
                className="flex flex-col items-center w-full max-w-full"
                style={{
                  height: 'calc(-140px + 100vh)',
                  maxWidth: '96vw',
                  objectFit: 'contain',
                  margin: '0 auto',
                }}
              >
                {currentSlide.src.endsWith('.webm') ? (
                  <video
                    ref={mediaRef}
                    src={currentSlide.src}
                    controls
                    autoPlay
                    className="object-contain max-w-full"
                  />
                ) : (
                  <img
                    ref={mediaRef}
                    src={currentSlide.src}
                    alt={currentSlide.title || ''}
                    className="object-contain max-w-full"
                  />
                )}
              </motion.div>
            </AnimatePresence>

            {/* Metadata crossfade */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`meta-${safeIndex}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                ref={metadataRef}
                className="lg:!w-[96%] text-left text-sm space-y-1 text-white px-0 lg:pt-[.25rem] lg:mb-[.25rem]"
                style={{
                  marginLeft: '-85px',
                }}
              >
                {currentSlide.title && (
                  <div className="text-lg" style={{ fontWeight: 'normal' }}>
                    {currentSlide.title}
                  </div>
                )}
                {currentSlide.director && (
                  <div className="!text-[#99AABB]">{currentSlide.director}</div>
                )}
                {currentSlide.description && (
                  <div>{currentSlide.description}</div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

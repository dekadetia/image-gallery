'use client'

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { RxCross1 } from 'react-icons/rx'

export default function Lightbox({ open, slides, index, onClose, setIndex }) {
  const [direction, setDirection] = useState(0)
  const [mediaSize, setMediaSize] = useState({ width: 'auto', height: 'auto' })
  const metadataRef = useRef(null)
  const [metaHeight, setMetaHeight] = useState(0)
  const containerRef = useRef(null)
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)

  const slide = slides[index]

  useEffect(() => {
    if (metadataRef.current) {
      setMetaHeight(metadataRef.current.offsetHeight)
    }
  }, [index])

  useEffect(() => {
    if (!open) return
    const handleKey = e => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') setDirection(1) || setIndex((index + 1) % slides.length)
      if (e.key === 'ArrowLeft') setDirection(-1) || setIndex((index - 1 + slides.length) % slides.length)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, index, slides.length, setIndex, onClose])

  const handleTouchStart = (e) => {
    touchStartX.current = e.changedTouches[0].screenX
  }

  const handleTouchEnd = (e) => {
    touchEndX.current = e.changedTouches[0].screenX
    const dx = touchEndX.current - touchStartX.current
    if (dx > 50) setDirection(-1) || setIndex((index - 1 + slides.length) % slides.length)
    if (dx < -50) setDirection(1) || setIndex((index + 1) % slides.length)
  }

  const computeDisplaySize = (naturalWidth, naturalHeight) => {
    const margin = 60
    const maxWidth = window.innerWidth * 0.96
    const maxHeight = window.innerHeight - metaHeight - margin
    const aspect = naturalWidth / naturalHeight
    const containerAspect = maxWidth / maxHeight

    if (aspect > containerAspect) {
      return {
        width: `${maxWidth}px`,
        height: 'auto'
      }
    } else {
      return {
        height: `${maxHeight}px`,
        width: 'auto'
      }
    }
  }

  const handleImageLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.target
    setMediaSize(computeDisplaySize(naturalWidth, naturalHeight))
  }

  const handleVideoLoad = (e) => {
    const { videoWidth, videoHeight } = e.target
    setMediaSize(computeDisplaySize(videoWidth, videoHeight))
  }

  if (!open || !slide) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 yarl__container flex flex-col justify-between z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div ref={containerRef} className="flex justify-center items-center flex-1" onClick={e => e.stopPropagation()}>
          {slide.src.match(/\.(webm|mp4)$/i) ? (
            <video
              src={slide.src}
              controls
              autoPlay
              muted
              loop
              onLoadedMetadata={handleVideoLoad}
              style={{ ...mediaSize, objectFit: 'contain' }}
              className="yarl__slide_image"
            />
          ) : (
            <img
              src={slide.src}
              alt=""
              onLoad={handleImageLoad}
              style={{ ...mediaSize, objectFit: 'contain' }}
              className="yarl__slide_image"
            />
          )}
        </div>

        <div
          ref={metadataRef}
          className="yarl-slide-content pb-4"
          onClick={e => e.stopPropagation()}
        >
          {slide.title && <div className="yarl__slide_title">{slide.title}</div>}
          {slide.director && <div className="yarl__slide_description">{slide.director}</div>}
          {slide.description && <div className="yarl__slide_description">{slide.description}</div>}
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-3xl text-white"
        >
          <RxCross1 />
        </button>
      </motion.div>
    </AnimatePresence>
  )
}

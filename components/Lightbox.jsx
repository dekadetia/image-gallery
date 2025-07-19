if (typeof window !== 'undefined') {
  alert("🔥 components/Lightbox.jsx is being used!")
}
'use client'

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { RxCross1 } from 'react-icons/rx'

export default function Lightbox({ open, slides, index, onClose, setIndex }) {
  const [direction, setDirection] = useState(0)
  const metadataRef = useRef(null)
  const [metaHeight, setMetaHeight] = useState(0)
  const [viewport, setViewport] = useState({ width: 0, height: 0 })
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)
  const [mediaDims, setMediaDims] = useState({ width: 'auto', height: 'auto' })

  const slide = slides[index]

  const updateViewport = () => {
    setViewport({
      width: window.innerWidth,
      height: window.innerHeight
    })
  }

  useEffect(() => {
    if (!open) return
    updateViewport()
    window.addEventListener('resize', updateViewport)
    return () => window.removeEventListener('resize', updateViewport)
  }, [open])

  useEffect(() => {
    if (metadataRef.current) {
      setMetaHeight(metadataRef.current.offsetHeight)
    }
  }, [index])

  const computeDims = (naturalWidth, naturalHeight) => {
    const margin = 40
    const maxW = viewport.width * 0.96
    const maxH = viewport.height - metaHeight - margin
    const ratio = naturalWidth / naturalHeight
    const containerRatio = maxW / maxH

    if (ratio > containerRatio) {
      return { width: maxW, height: maxW / ratio }
    } else {
      return { height: maxH, width: maxH * ratio }
    }
  }

  const onImageLoad = e => {
    const { naturalWidth, naturalHeight } = e.target
    setMediaDims(computeDims(naturalWidth, naturalHeight))
  }

  const onVideoLoad = e => {
    const { videoWidth, videoHeight } = e.target
    setMediaDims(computeDims(videoWidth, videoHeight))
  }

  const paginate = dir => {
    setDirection(dir)
    setIndex((index + dir + slides.length) % slides.length)
  }

  const handleKeyDown = e => {
    if (e.key === 'Escape') onClose()
    if (e.key === 'ArrowRight') paginate(1)
    if (e.key === 'ArrowLeft') paginate(-1)
  }

  useEffect(() => {
    if (!open) return
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, index])

  const handleTouchStart = e => {
    touchStartX.current = e.changedTouches[0].screenX
  }

  const handleTouchEnd = e => {
    touchEndX.current = e.changedTouches[0].screenX
    if (touchStartX.current - touchEndX.current > 50) paginate(1)
    if (touchEndX.current - touchStartX.current > 50) paginate(-1)
  }

  if (!open || !slide) return null

  const variants = {
    enter: dir => ({ x: dir > 0 ? 100 : -100, opacity: 0, scale: 0.95 }),
    center: { x: 0, opacity: 1, scale: 1 },
    exit: dir => ({ x: dir < 0 ? 100 : -100, opacity: 0, scale: 0.95 })
  }

  return (
    <AnimatePresence initial={false} custom={direction}>
      <motion.div
        className="fixed inset-0 yarl__container flex flex-col justify-between z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex justify-center items-center flex-1" onClick={e => e.stopPropagation()}>
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={slide.src}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
            >
              {slide.src.match(/\.(webm|mp4)$/i) ? (
                <video
                  src={slide.src}
                  controls
                  autoPlay
                  muted
                  loop
                  onLoadedMetadata={onVideoLoad}
                  style={{
                    width: mediaDims.width,
                    height: mediaDims.height,
                    objectFit: 'contain'
                  }}
                  className="yarl__slide_image"
                />
              ) : (
                <img
                  src={slide.src}
                  alt=""
                  onLoad={onImageLoad}
                  style={{
                    width: mediaDims.width,
                    height: mediaDims.height,
                    objectFit: 'contain'
                  }}
                  className="yarl__slide_image"
                />
              )}
            </motion.div>
          </AnimatePresence>
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

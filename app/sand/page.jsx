'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { RxCross1 } from 'react-icons/rx'
import { BsSortAlphaDown } from 'react-icons/bs'
import { TbClockDown, TbClockUp } from 'react-icons/tb'
import { FaMagnifyingGlass } from 'react-icons/fa6'
import Footer from '../../components/Footer'
import Fuse from 'fuse.js'
import MoreImageLoader from '../../components/MoreImageLoader'
import RootLayout from '../layout'
import InfiniteScroll from 'react-infinite-scroll-component'
import Loader from '../../components/loader/loader'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { AnimatePresence, motion } from 'framer-motion'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// 🆕 Inline Lightbox component
function InlineLightbox({ open, slides, index, onClose, setIndex }) {
  const [direction, setDirection] = useState(0)
  const metadataRef = useRef(null)
  const [metaHeight, setMetaHeight] = useState(0)
  const [viewport, setViewport] = useState({ width: 0, height: 0 })
  const [mediaDims, setMediaDims] = useState({ width: 'auto', height: 'auto' })
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)

  useEffect(() => {
    if (!open) return
    const updateViewport = () => {
      setViewport({
        width: window.innerWidth || 0,
        height: window.innerHeight || 0
      })
    }
    updateViewport()
    window.addEventListener('resize', updateViewport)
    return () => window.removeEventListener('resize', updateViewport)
  }, [open])

  useEffect(() => {
    if (metadataRef.current) {
      setMetaHeight(metadataRef.current.offsetHeight || 0)
    }
  }, [index])

  const computeDims = (naturalWidth, naturalHeight) => {
    if (!naturalWidth || !naturalHeight || viewport.width === 0 || viewport.height === 0) {
      return { width: 'auto', height: 'auto' }
    }

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
    console.log("🖼 Image loaded:", { naturalWidth, naturalHeight })
    setMediaDims(computeDims(naturalWidth, naturalHeight))
  }

  const onVideoLoad = e => {
    const { videoWidth, videoHeight } = e.target
    console.log("🎥 Video loaded:", { videoWidth, videoHeight })
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
    const dx = touchEndX.current - touchStartX.current
    if (dx > 50) paginate(-1)
    if (dx < -50) paginate(1)
  }

  if (!open || !slides[index]) return null

  const slide = slides[index]
  const variants = {
    enter: dir => ({ x: dir > 0 ? 100 : -100, opacity: 0, scale: 0.95 }),
    center: { x: 0, opacity: 1, scale: 1 },
    exit: dir => ({ x: dir < 0 ? 100 : -100, opacity: 0, scale: 0.95 })
  }

  console.log("📐 Viewport:", viewport, "Meta Height:", metaHeight, "Media Dims:", mediaDims)

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
              key={slide.src || index}
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
                  style={{ ...mediaDims, objectFit: 'contain' }}
                  className="yarl__slide_image"
                />
              ) : (
                <img
                  src={slide.src}
                  alt=""
                  onLoad={onImageLoad}
                  style={{ ...mediaDims, objectFit: 'contain' }}
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

export default function Order() {
  const searchInputRef = useRef(null)
  const [isSorted, setSorted] = useState(false)
  const [index, setIndex] = useState(-1)
  const [slides, setSlides] = useState([])
  const [Images, setImages] = useState([])
  const [FullImages, setFullImages] = useState([])
  const wasCalled = useRef(false)
  const [nextPageToken, setNextPageToken] = useState(null)
  const [hasMore, setHasMore] = useState(true)
  const [loader, __loader] = useState(true)
  const [sort_loader, __sort_loader] = useState(true)

  const [order_key, __order_key] = useState(null)
  const [order_value, __order_value] = useState(null)
  const [order_key_2, __order_key_2] = useState(null)
  const [order_value_2, __order_value_2] = useState(null)

  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const debounceRef = useRef(null)

  // 📝 ...Your existing getImages, sortImages, fetchBackendSearch, useEffects...

  return (
    <RootLayout>
      {/* Navigation */}
      {/* ...Your existing navigation JSX here... */}

      {!loader ? (
        <div className="px-4 lg:px-16 pb-10 relative top-[.5px]">
          <InfiniteScroll
            className='mt-[-2px]'
            dataLength={Images.length}
            next={() => {} /* Placeholder */}
            hasMore={hasMore}
            loader={
              !searchQuery.trim() && hasMore ? <MoreImageLoader /> : null
            }
          >
            <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[10px] place-items-center">
              {Images.map((photo, i) => (
                <div key={i}>
                  <img
                    alt={photo.name}
                    src={photo.src}
                    onClick={() => setIndex(i)}
                    className="aspect-[16/9] object-cover cursor-zoom-in"
                  />
                </div>
              ))}
            </div>
          </InfiniteScroll>

          <InlineLightbox
            open={index >= 0}
            slides={slides}
            index={index}
            onClose={() => setIndex(-1)}
            setIndex={setIndex}
          />
        </div>
      ) : (
        <Loader />
      )}

      {!loader && <Footer />}
    </RootLayout>
  )
}

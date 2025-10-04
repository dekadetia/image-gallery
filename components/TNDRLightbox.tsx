'use client'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import YARL from 'yet-another-react-lightbox'
import Video from 'yet-another-react-lightbox/plugins/video'

export default function TNDRLightbox({
  slides,
  index: parentIndex,
  setIndex: parentSetIndex,
  render,
}: {
  slides: any[]
  index: number
  setIndex: (n: number) => void
  render?: any
}) {
  const pathname = usePathname()
  const [internalIndex, setInternalIndex] = useState(parentIndex)

  // 🔄 Keep internal index synced with parent
  useEffect(() => {
    setInternalIndex(parentIndex)
  }, [parentIndex])

  // 🎯 Auto-open if the current URL is /film/<slug>
  useEffect(() => {
    const match = pathname.match(/^\/film\/([^/]+)$/)
    if (match && slides?.length > 0 && internalIndex < 0) {
      const slug = match[1]
      const found = slides.findIndex((s) => {
        const base = (s.title || '')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '.')
          .replace(/\.$/, '')
        const id = s.src.match(/\/(\d+)\./)?.[1] || ''
        return `${id}.${base}` === slug
      })
      if (found !== -1) {
        setInternalIndex(found)
        parentSetIndex?.(found)
      }
    }
  }, [pathname, slides])

  // 🧭 When opening, update URL silently (no navigation)
  useEffect(() => {
    if (internalIndex >= 0 && slides?.[internalIndex]) {
      const slide = slides[internalIndex]
      const base = (slide.title || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '.')
        .replace(/\.$/, '')
      const id = slide.src.match(/\/(\d+)\./)?.[1] || ''
      const slug = id ? `${id}.${base}` : base
      const newURL = `/film/${slug}`

      if (!window.location.pathname.startsWith(newURL)) {
        window.history.pushState({}, '', newURL)
      }
    }
  }, [internalIndex])

  // 🚪 Close handler — revert URL + clear state
  const handleClose = () => {
    setInternalIndex(-1)
    parentSetIndex?.(-1)
    setTimeout(() => {
      if (window.location.pathname.startsWith('/film/')) {
        window.history.pushState({}, '', '/')
      }
    }, 100)
  }

  // 🔙 Handle Back button (popstate)
  useEffect(() => {
    const onPopState = () => {
      if (window.location.pathname.startsWith('/film/')) {
        // If user hits back, close the lightbox
        setInternalIndex(-1)
        parentSetIndex?.(-1)
        window.history.pushState({}, '', '/')
      }
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  // 🧹 Cleanup (safety net)
  useEffect(() => {
    return () => {
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
      document.body.classList.remove('yarl__no_scroll')
    }
  }, [])

  // ⛔ Don’t render unless open
  if (internalIndex < 0) return null

  return (
    <YARL
      index={internalIndex}
      slides={slides}
      open
      close={handleClose}
      plugins={[Video]}
      render={render}
    />
  )
}

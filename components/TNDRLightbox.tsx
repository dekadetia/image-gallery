'use client'
import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
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
  const router = useRouter()
  const pathname = usePathname()
  const [internalIndex, setInternalIndex] = useState(parentIndex)

  // 🔄 Keep internal index synced with parent
  useEffect(() => {
    setInternalIndex(parentIndex)
  }, [parentIndex])

  // 🎯 Auto-open when direct permalink like /film/50039.the.last.of.sheila is hit
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

  // 🧭 When opening, push /film/<id>.<slug> to the URL
  useEffect(() => {
    if (internalIndex >= 0 && slides?.[internalIndex]) {
      const slide = slides[internalIndex]
      const base = (slide.title || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '.')
        .replace(/\.$/, '')
      const id = slide.src.match(/\/(\d+)\./)?.[1] || ''
      const slug = id ? `${id}.${base}` : base
      if (!pathname.startsWith(`/film/${slug}`)) {
        router.push(`/film/${slug}`, { scroll: false })
      }
    }
  }, [internalIndex])

  // 🚪 Handle close
  const handleClose = () => {
    setInternalIndex(-1)
    parentSetIndex?.(-1)
    setTimeout(() => {
      if (pathname.startsWith('/film/')) {
        router.push('/', { scroll: false })
      } else {
        router.back()
      }
    }, 150)
  }

  // 🧹 Cleanup on unmount (safety net)
  useEffect(() => {
    return () => {
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
      document.body.classList.remove('yarl__no_scroll')
    }
  }, [])

  // ⛔ Don’t render if closed
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

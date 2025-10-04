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

  // 🔄 keep local index in sync with parent
  useEffect(() => {
    setInternalIndex(parentIndex)
  }, [parentIndex])

  // 🎯 auto-open when a permalink like /images/foo.bar.1989 is hit directly
  useEffect(() => {
    const match = pathname.match(/^\/images\/([^/]+)$/)
    if (match && slides?.length > 0 && internalIndex < 0) {
      const slug = match[1]
      const found = slides.findIndex((s) => {
        const t = (s.title || '')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '.')
          .replace(/\.$/, '')
        return t === slug
      })
      if (found !== -1) {
        setInternalIndex(found)
        parentSetIndex?.(found)
      }
    }
  }, [pathname, slides])

  // 🧭 when opening, update URL to /images/<slug>
  useEffect(() => {
    if (internalIndex >= 0 && slides?.[internalIndex]) {
      const slide = slides[internalIndex]
      const slug = (slide.title || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '.')
        .replace(/\.$/, '')
      if (!pathname.startsWith(`/images/${slug}`)) {
        router.push(`/images/${slug}`, { scroll: false })
      }
    }
  }, [internalIndex])

  // 🚪 close behavior
  const handleClose = () => {
    setInternalIndex(-1)
    parentSetIndex?.(-1)
    setTimeout(() => {
      if (pathname.startsWith('/images/')) {
        router.push('/', { scroll: false })
      } else {
        router.back()
      }
    }, 150)
  }

  // 🧹 cleanup if ever unmounted
  useEffect(() => {
    return () => {
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
      document.body.classList.remove('yarl__no_scroll')
    }
  }, [])

  // render only when open
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

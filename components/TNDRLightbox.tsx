'use client'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import YARL from 'yet-another-react-lightbox'
import Video from 'yet-another-react-lightbox/plugins/video'

export default function TNDRLightbox({ slides, index, setIndex, render }) {
  const router = useRouter()
  const pathname = usePathname()
  const wasOpen = useRef(false)

  // 🧹 Clean up scroll locks safely
  const unlockBody = () => {
    const body = document.body
    body.style.overflow = ''
    body.style.touchAction = ''
    body.classList.remove('yarl__no_scroll')
  }

  // Run cleanup every time Lightbox closes
  useEffect(() => {
    const isOpen = index >= 0
    if (wasOpen.current && !isOpen) {
      // Lightbox just closed → cleanup
      requestAnimationFrame(unlockBody)
      setTimeout(unlockBody, 200)
    }
    wasOpen.current = isOpen
  }, [index])

  // Close behavior
  const handleClose = () => {
    setIndex(-1)
    // wait a little to ensure cleanup runs
    setTimeout(() => {
      unlockBody()
      if (pathname.startsWith('/images/')) {
        router.push('/', { scroll: false })
      } else {
        router.back()
      }
    }, 150)
  }

  // Auto-open when direct permalink
  useEffect(() => {
    const match = pathname.match(/^\/images\/([^/]+)$/)
    if (match && slides?.length > 0 && index === -1) {
      const slug = match[1]
      const found = slides.findIndex((s) => {
        const t = (s.title || '')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '.')
          .replace(/\.$/, '')
        return t === slug
      })
      if (found !== -1) setIndex(found)
    }
  }, [pathname, slides])

  // Failsafe cleanup if component ever unmounts
  useEffect(() => () => unlockBody(), [])

  return (
    <YARL
      index={index}
      slides={slides}
      open={index >= 0}
      close={handleClose}
      plugins={[Video]}
      render={render}
    />
  )
}

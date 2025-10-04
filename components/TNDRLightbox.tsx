'use client'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import YARL from 'yet-another-react-lightbox'
import Video from 'yet-another-react-lightbox/plugins/video'

export default function TNDRLightbox({ slides, index, setIndex, render }) {
  const router = useRouter()
  const pathname = usePathname()

  // 🧹 remove any leftover YARL body locks
  const unlockBody = () => {
    document.body.style.overflow = ''
    document.body.style.touchAction = ''
    document.body.classList.remove('yarl__no_scroll')
  }

  const handleClose = () => {
    setIndex(-1)

    // give YARL a frame to unmount, then force-clear body lock
    requestAnimationFrame(() => {
      unlockBody()
      setTimeout(unlockBody, 100) // safety double-tap

      if (pathname.startsWith('/images/')) {
        router.push('/', { scroll: false })
      } else {
        router.back()
      }
    })
  }

  // auto-open when permalink hit directly
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

  // extra safety: clear any stale lock if component ever unmounts
  useEffect(() => {
    return () => unlockBody()
  }, [])

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

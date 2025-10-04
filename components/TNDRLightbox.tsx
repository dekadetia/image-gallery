'use client'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import YARL from 'yet-another-react-lightbox'
import Video from 'yet-another-react-lightbox/plugins/video'

/**
 * TNDRLightbox
 * Wraps yet-another-react-lightbox with:
 * - permalink-aware open/close
 * - automatic return to previous page without reload
 * - safe defaults matching your existing setup
 */

export default function TNDRLightbox({
  slides,
  index,
  setIndex,
  render,
}: {
  slides: any[]
  index: number
  setIndex: (n: number) => void
  render?: any
}) {
  const router = useRouter()
  const pathname = usePathname()

  // Close behavior
  const handleClose = () => {
    setIndex(-1)
    if (pathname.startsWith('/images/')) {
      router.push('/', { scroll: false })
    } else {
      router.back()
    }
  }

  // When a permalink is loaded directly (e.g. /images/foo)
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

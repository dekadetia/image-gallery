'use client'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import YARL from 'yet-another-react-lightbox'
import Video from 'yet-another-react-lightbox/plugins/video'

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

  // 🎯 Automatically open if user visits a permalink like /images/foo.bar.1989
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

  // 🚪 Handle close + navigation
  const handleClose = () => {
    setIndex(-1)
    // Small delay ensures YARL can unmount gracefully before routing
    setTimeout(() => {
      if (pathname.startsWith('/images/')) {
        router.push('/', { scroll: false })
      } else {
        router.back()
      }
    }, 150)
  }

  // 🧼 Clean up when this component ever unmounts
  useEffect(() => {
    return () => {
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
      document.body.classList.remove('yarl__no_scroll')
    }
  }, [])

  // 🚫 Do not render unless lightbox is open
  if (index < 0) return null

  return (
    <YARL
      index={index}
      slides={slides}
      open
      close={handleClose}
      plugins={[Video]}
      render={render}
    />
  )
}

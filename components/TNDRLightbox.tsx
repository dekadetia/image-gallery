'use client'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import YARL from 'yet-another-react-lightbox'
import Video from 'yet-another-react-lightbox/plugins/video'

export default function TNDRLightbox({ slides, index, setIndex, render }) {
  const router = useRouter()
  const pathname = usePathname()
  const currentPath = useRef(pathname)

  // 🚨 Detect navigation — unmount YARL when route changes
  useEffect(() => {
    if (pathname !== currentPath.current) {
      setIndex(-1) // force close
      const portals = document.querySelectorAll('.yarl__portal, .yarl__portal_root')
      portals.forEach((el) => el.remove()) // kill leftover containers
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
      document.body.classList.remove('yarl__no_scroll')
      currentPath.current = pathname
    }
  }, [pathname])

  // 🧹 Failsafe cleanup for stuck portals
  const cleanup = () => {
    const portals = document.querySelectorAll('.yarl__portal, .yarl__portal_root')
    portals.forEach((el) => el.remove())
    document.body.style.overflow = ''
    document.body.style.touchAction = ''
    document.body.classList.remove('yarl__no_scroll')
  }

  // ✅ Normal close logic
  const handleClose = () => {
    setIndex(-1)
    setTimeout(() => {
      cleanup()
      if (pathname.startsWith('/images/')) {
        router.push('/', { scroll: false })
      } else {
        router.back()
      }
    }, 150)
  }

  // 🎯 Auto-open when permalink is loaded directly
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

  useEffect(() => () => cleanup(), [])

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

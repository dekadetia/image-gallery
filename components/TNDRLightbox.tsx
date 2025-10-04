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
}) {
  const router = useRouter()
  const pathname = usePathname()

  // ✅ close logic – allow cleanup before navigation
  const handleClose = () => {
    // trigger YARL internal cleanup first
    setIndex(-1)

    // wait a short moment so body overflow resets
    setTimeout(() => {
      if (pathname.startsWith('/images/')) {
        router.push('/', { scroll: false })
      } else {
        router.back()
      }
    }, 150) // 150–200 ms is plenty
  }

  // ✅ open when hitting permalink directly
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

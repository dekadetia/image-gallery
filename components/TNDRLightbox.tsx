'use client'
import { useEffect } from 'react'
import YARL from 'yet-another-react-lightbox'
import Video from 'yet-another-react-lightbox/plugins/video'

export default function TNDRLightbox({ slides, index, setIndex, render }) {
  // simple local close
  const handleClose = () => setIndex(-1)

  // cleanup guard
  useEffect(() => {
    return () => {
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
      document.body.classList.remove('yarl__no_scroll')
    }
  }, [])

  // only render when open
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

'use client'
import { useState, useEffect } from 'react'
import YARL from 'yet-another-react-lightbox'
import Video from 'yet-another-react-lightbox/plugins/video'

export default function TNDRLightbox({
  slides,
  index: parentIndex,
  setIndex: parentSetIndex,
  render,
}) {
  const [internalIndex, setInternalIndex] = useState(parentIndex)

  // keep internal state in sync with parent
  useEffect(() => {
    setInternalIndex(parentIndex)
  }, [parentIndex])

  const handleClose = () => {
    setInternalIndex(-1)
    parentSetIndex?.(-1) // let parent know it's closed
  }

  // cleanup if ever unmounted
  useEffect(() => {
    return () => {
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
      document.body.classList.remove('yarl__no_scroll')
    }
  }, [])

  // render nothing unless actually open
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

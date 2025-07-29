'use client'

import { useEffect } from 'react'

export default function DynamicTitle() {
  useEffect(() => {
    const titles = {
      base: '𝐓 | 𝐍 | 𝐃 | 𝐑 | 𝐁 | 𝐓 | 𝐍 | 𝐒',
      alt:  '𝐁 | 𝐋 | 𝐍 | 𝐃 | 𝐆 | 𝐋 | 𝐒 | 𝐒',
    }

    const setTitleFromLogoState = () => {
      const logoState = sessionStorage.getItem('logoState') === 'alt' ? 'alt' : 'base'
      document.title = titles[logoState]
    }

    setTitleFromLogoState()

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        setTitleFromLogoState()
      }
    })

    return () => {
      document.removeEventListener('visibilitychange', setTitleFromLogoState)
    }
  }, [])

  return null
}

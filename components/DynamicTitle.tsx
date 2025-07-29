'use client'

import { useEffect } from 'react'

export default function DynamicTitle() {
  useEffect(() => {
    const titles = {
      base: '𝐓 | 𝐍 | 𝐃 | 𝐑 | 𝐁 | 𝐓 | 𝐍 | 𝐒',
      alt:  '𝐁 | 𝐋 | 𝐍 | 𝐃 | 𝐆 | 𝐋 | 𝐒 | 𝐒',
    }

    const setTitleFromLogoState = (state: 'base' | 'alt') => {
      document.title = titles[state]
    }

    const initial = sessionStorage.getItem('logoState') === 'alt' ? 'alt' : 'base'
    setTitleFromLogoState(initial)

    const handler = (e: Event) => {
      const custom = e as CustomEvent
      const state = custom.detail?.state === 'alt' ? 'alt' : 'base'
      setTitleFromLogoState(state)
    }

    window.addEventListener('logoStateChange', handler)

    return () => {
      window.removeEventListener('logoStateChange', handler)
    }
  }, [])

  return null
}

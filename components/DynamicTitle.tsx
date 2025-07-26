'use client'

import { useEffect } from 'react'

export default function DynamicTitle() {
  useEffect(() => {
    const titles = [
      '𝐓 | 𝐍 | 𝐃 | 𝐑 | 𝐁 | 𝐓 | 𝐍 | 𝐒',
      '𝐁 | 𝐋 | 𝐍 | 𝐃 | 𝐆 | 𝐋 | 𝐒 | 𝐒',
    ]
    document.title = titles[Math.floor(Math.random() * titles.length)]
  }, [])

  return null
}

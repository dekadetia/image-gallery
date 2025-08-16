'use client'

import { useEffect } from 'react'

export default function DynamicTitle() {
  useEffect(() => {
    const titles = [
      '𝗧 | 𝗡 | 𝗗 | 𝗥 | 𝗕 | 𝗧 | 𝗡 | 𝗦',
      '𝗕 | 𝗟 | 𝗡 | 𝗗 | 𝗚 | 𝗟 | 𝗦 | 𝗦',
    ]
    document.title = titles[Math.floor(Math.random() * titles.length)]
  }, [])

  return null
}

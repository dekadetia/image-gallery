'use client'

import { useEffect } from 'react'

export default function DynamicTitle() {
  useEffect(() => {
    const titles = [
      'TNDR/BTNS/BLND/GLSS',
      'TNDR/BTNS/BLND/GLSS',
    ]
    document.title = titles[Math.floor(Math.random() * titles.length)]
  }, [])

  return null
}

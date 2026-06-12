'use client'

import { useEffect } from 'react'

export default function DynamicTitle() {
  useEffect(() => {
    const titles = [
      'TNDRBTNS/BLNDGLSS',
      'TNDRBTNS/BLNDGLSS',
    ]
    document.title = titles[Math.floor(Math.random() * titles.length)]
  }, [])

  return null
}

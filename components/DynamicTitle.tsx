'use client'

import { useEffect } from 'react'

export default function DynamicTitle() {
  useEffect(() => {
    const titles = [
      'T | N | D | R | B | T | N | S',
      'B | L | N | D | G | L | S | S',
    ]
    document.title = titles[Math.floor(Math.random() * titles.length)]
  }, [])

  return null
}

'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { RxCross1 } from 'react-icons/rx'
import { BsSortAlphaDown } from 'react-icons/bs'
import { TbClockDown, TbClockUp } from 'react-icons/tb'
import { FaMagnifyingGlass } from 'react-icons/fa6'
import Lightbox from 'yet-another-react-lightbox'
import Footer from '../../components/Footer'
import Fuse from 'fuse.js'
import MoreImageLoader from '../../components/MoreImageLoader'
import RootLayout from '../layout'
import InfiniteScroll from 'react-infinite-scroll-component'
import Loader from '../../components/loader/loader'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export default function Order() {
  const searchInputRef = useRef(null)
  const [isSorted, setSorted] = useState(false)
  const [index, setIndex] = useState(-1)
  const [slides, setSlides] = useState([])
  const [Images, setImages] = useState([])
  const wasCalled = useRef(false)
  const [nextPageToken, setNextPageToken] = useState(null)
  const [hasMore, setHasMore] = useState(true)
  const [loader, __loader] = useState(true)
  const [sort_loader, __sort_loader] = useState(true)

  const [order_key, __order_key] = useState(null)
  const [order_value, __order_value] = useState(null)
  const [order_key_2, __order_key_2] = useState(null)
  const [order_value_2, __order_value_2] = useState(null)

  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const debounceRef = useRef(null)

  const getImages = async (token) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/firebase/get-ordered-images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_by_key: 'alphaname',
          order_by_value: 'asc',
          size_limit: 99,
          lastVisibleDocId: token
        })
      })

      if (response.ok) {
        const data = await response.json()
        const images = data.images

        if (images.length === 0) {
          setHasMore(false)
          return
        }

        setNextPageToken(data.nextPageToken)

        setImages(prev => {
          const existingIds = new Set(prev.map(img => img.id))
          const unique = images.filter(img => !existingIds.has(img.id))
          return [...prev, ...unique]
        })

        const newSlides = images.map(photo => ({
          src: photo.src,
          width: 1080 * 4,
          height: 1620 * 4,
          title: photo.caption,
          description: photo.dimensions,
          director: photo.director || null,
          year: photo.year
        }))

        setSlides(prev => {
          const existingSrcs = new Set(prev.map(slide => slide.src))
          const unique = newSlides.filter(slide => !existingSrcs.has(slide.src))
          return [...prev, ...unique]
        })
      }
    } catch (error) {
      console.error('Error fetching files:', error)
    }
    __loader(false)
  }

  const clearValues = () =>
    new Promise(resolve => {
      setImages([])
      setSlides([])
      setNextPageToken(null)
      setHasMore(true)
      resolve()
    })

  const loadMoreByCondition = () => {
    if (searchQuery.trim()) return
    getImages(nextPageToken)
  }

  useEffect(() => {
    if (wasCalled.current) return
    wasCalled.current = true
    __loader(true)
    getImages(nextPageToken)
    setSorted(true)
  }, [])

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current.focus()
      }, 0)
    }
  }, [searchOpen])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      const query = searchQuery.trim().toLowerCase()
      if (!query) {
        clearValues().then(() => getImages(null))
        return
      }

      // 🔥 Local Fuse search
      const fuse = new Fuse(Images, {
        keys: ['caption', 'director', 'year'],
        threshold: 0.3,
        distance: 200,
        includeScore: true
      })
      const local = fuse.search(query).map(r => r.item)

      if (local.length > 0) {
        setImages(local)
        setSlides(local.map(photo => ({
          src: photo.src,
          width: 1080 * 4,
          height: 1620 * 4,
          title: photo.caption,
          description: photo.dimensions,
          director: photo.director || null,
          year: photo.year || null
        })))
        return
      }

      // 🔥 Backend fallback
      try {
        __loader(true)
        const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/firebase/search-ordered-images`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ queryText: query })
        })
        const data = await res.json()
        setImages(data.results)
        setSlides(data.results.map(photo => ({
          src: photo.src,
          width: 1080 * 4,
          height: 1620 * 4,
          title: photo.caption,
          description: photo.dimensions,
          director: photo.director || null,
          year: photo.year || null
        })))
      } catch (err) {
        console.error('Remote search failed:', err)
      } finally {
        __loader(false)
      }
    }, 300)
  }, [searchQuery])

  return (
    <RootLayout>
      {/* ✅ Render block stays unchanged */}
    </RootLayout>
  )
}

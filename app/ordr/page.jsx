'use client'

import Link from 'next/link'
import { useState, useEffect, useRef, useMemo } from 'react'
import { RxCross1 } from 'react-icons/rx'
import { BsSortAlphaDown } from 'react-icons/bs'
import { TbClockDown, TbClockUp } from 'react-icons/tb'
import { FaMagnifyingGlass } from 'react-icons/fa6'
import Lightbox from 'yet-another-react-lightbox'
import Video from 'yet-another-react-lightbox/plugins/video'
import Footer from '../../components/Footer'
import Fuse from 'fuse.js'
import MoreImageLoader from '../../components/MoreImageLoader'
import RootLayout from '../layout'
import AnimatedLogo from '../../components/AnimatedLogo'
import InfiniteScroll from 'react-infinite-scroll-component'
import Loader from '../../components/loader/loader'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function dedupeById(items) {
  const seen = new Set()
  return items.filter(item => {
    const key = item.id || item.src
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export default function Order() {
  const searchInputRef = useRef(null)
  const abortRef = useRef(null)
  const wasCalled = useRef(false)
  const debounceRef = useRef(null)

  const [Images, setImages] = useState([])
  const [FullImages, setFullImages] = useState([])
  const [nextPageToken, setNextPageToken] = useState(null)
  const [hasMore, setHasMore] = useState(true)
  const [index, setIndex] = useState(-1)
  const [loader, setLoader] = useState(true)
  const [isSorted, setSorted] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const [order_key, __order_key] = useState('alphaname')
  const [order_value, __order_value] = useState('asc')
  const [order_key_2, __order_key_2] = useState(null)
  const [order_value_2, __order_value_2] = useState(null)

  // 🧠 Fuse instance memoized once per preload
  const fuse = useMemo(() => {
    return new Fuse(FullImages, {
      keys: [
        { name: 'caption', weight: 0.7 },
        { name: 'alphaname', weight: 0.2 },
        { name: 'director', weight: 0.1 }
      ],
      threshold: 0.3,
      distance: 100,
      includeScore: true
    })
  }, [FullImages])

  // 🧩 Memoized slides for Lightbox
  const slides = useMemo(
    () =>
      Images.map(photo => ({
        type: photo.src.endsWith('.webm') ? 'video' : 'image',
        src: photo.src,
        width: 4320,
        height: 6480,
        title: photo.caption,
        description: photo.dimensions,
        director: photo.director,
        sources: photo.src.endsWith('.webm')
          ? [{ src: photo.src, type: 'video/webm' }]
          : undefined,
        poster: '/assets/transparent.png',
        autoPlay: true,
        muted: true,
        loop: true,
        controls: false
      })),
    [Images]
  )

  const getImages = async (token) => {
    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/firebase/get-ordered-images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          order_by_key: order_key,
          order_by_value: order_value,
          order_by_key_2,
          order_by_value_2,
          size_limit: 99,
          lastVisibleDocId: token
        })
      })
      if (!res.ok) return
      const data = await res.json()
      if (!data.images.length) {
        setHasMore(false)
        return
      }
      setNextPageToken(data.nextPageToken)
      setImages(prev => dedupeById([...prev, ...data.images]))
    } catch (err) {
      if (err.name !== 'AbortError') console.error(err)
    } finally {
      setLoader(false)
    }
  }

  const getAllImagesNoLimit = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/firebase/get-all-images-no-limit`)
      const data = await res.json()
      if (data.success) setFullImages(dedupeById(data.images))
    } catch (err) {
      console.error('Error preloading all images:', err)
    }
  }

  const clearValues = () =>
    new Promise(resolve => {
      setImages([])
      setNextPageToken(null)
      setHasMore(true)
      resolve()
    })

  const loadMoreByCondition = () => {
    if (searchQuery.trim()) return
    getImages(nextPageToken)
  }

  // Initial load
  useEffect(() => {
    if (wasCalled.current) return
    wasCalled.current = true
    getAllImagesNoLimit()
    getImages(null)
  }, [])

  // Auto-focus search
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current.focus(), 0)
    }
  }, [searchOpen])

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      const raw = searchQuery.trim().toLowerCase()
      if (!raw) {
        clearValues().then(() => getImages(null))
        return
      }

      const fuseResults = fuse.search(raw, { limit: 200 }).map(r => r.item)
      if (fuseResults.length > 0) {
        setImages(dedupeById(fuseResults))
        return
      }

      // fallback: backend search
      if (abortRef.current) abortRef.current.abort()
      const controller = new AbortController()
      abortRef.current = controller
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/firebase/search-ordered-images`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({ queryText: raw })
        })
        const data = await res.json()
        setImages(dedupeById(data.results))
      } catch (err) {
        if (err.name !== 'AbortError') console.error(err)
      }
    }, 300)
  }, [searchQuery, fuse])

  return (
    <RootLayout>
      {/* Navigation */}
      <div className="w-full flex justify-center items-center pt-9 pb-[1.69rem]">
        <div className="w-full grid place-items-center space-y-6">
          <Link href="/">
            <div id="logo" className="w-40 h-auto cursor-pointer">
              <AnimatedLogo />
            </div>
          </Link>
          <div className="h-12 overflow-hidden w-full grid place-items-center mt-[1rem] mb-0">
            {searchOpen ? (
              <div className="w-full lg:w-[32.1%] flex justify-center mt-2 mb-6 px-4">
                <div className="relative w-full">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setSearchOpen(false)
                        setSearchQuery('')
                      }
                    }}
                    className="w-full pl-1.5 pr-10 pt-[.45rem] pb-[.5rem] border-b border-b-white focus:outline-none text-sm bg-transparent"
                  />
                  <div onClick={() => setSearchOpen(false)} className="cursor-pointer">
                    <RxCross1 className="absolute right-3 top-2.5 text-white" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex gap-[2.3rem] items-center -mt-[2px]">
                <BsSortAlphaDown
                  className="cursor-pointer hover:scale-105 text-2xl"
                  onClick={() => {
                    clearValues().then(() => {
                      __order_key('alphaname')
                      __order_value('asc')
                      __order_key_2(null)
                      __order_value_2(null)
                      setSorted(true)
                      getImages(null)
                    })
                  }}
                />
                <div onClick={() => setSearchOpen(true)}>
                  <FaMagnifyingGlass className="cursor-pointer hover:scale-105 text-xl" />
                </div>
                {!isSorted ? (
                  <TbClockDown
                    className="cursor-pointer hover:scale-105 text-2xl"
                    onClick={() => {
                      clearValues().then(() => {
                        __order_key('year')
                        __order_value('desc')
                        __order_key_2('alphaname')
                        __order_value_2('asc')
                        setSorted(true)
                        getImages(null)
                      })
                    }}
                  />
                ) : (
                  <TbClockUp
                    className="cursor-pointer hover:scale-105 text-2xl"
                    onClick={() => {
                      clearValues().then(() => {
                        __order_key('year')
                        __order_value('asc')
                        __order_key_2('alphaname')
                        __order_value_2('asc')
                        setSorted(false)
                        getImages(null)
                      })
                    }}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {!loader ? (
        <div className="px-4 lg:px-16 pb-10 relative top-[.5px]">
          <InfiniteScroll
            className="mt-[-2px]"
            dataLength={Images.length}
            next={loadMoreByCondition}
            hasMore={hasMore}
            loader={!searchQuery.trim() && hasMore ? <MoreImageLoader /> : null}
          >
            <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[10px] place-items-center">
              {Images.map((photo, i) => (
                <div
                  key={photo.id || photo.src}
                  className="w-full aspect-[16/9] relative overflow-hidden cursor-zoom-in"
                  onClick={() => setIndex(i)}
                >
                  {photo.src.endsWith('.webm') ? (
                    <video
                      src={photo.src}
                      muted
                      autoPlay
                      loop
                      playsInline
                      preload="metadata"
                      poster="/assets/transparent.png"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      alt={photo.name}
                      src={photo.src}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}
                </div>
              ))}
            </div>
          </InfiniteScroll>

          <Lightbox
            index={index}
            slides={slides}
            open={index >= 0}
            close={() => setIndex(-1)}
            plugins={[Video]}
            render={{
              slideFooter: ({ slide }) => (
                <div
                  className={cn(
                    "lg:w-[96%] text-left text-sm space-y-1 lg:pt-[.5rem] lg:mb-[.75rem] pb-[1rem] text-white px-0 pt-0 lg:pl-0 lg:ml-[-35px] lg:pr-[3rem]",
                    slide.type === 'video' && 'relative top-auto'
                  )}
                >
                  {slide.title && <div>{slide.title}</div>}
                  {slide.director && (
                    <div className="text-[#99AABB]">
                      <span className="font-medium">{slide.director}</span>
                    </div>
                  )}
                  {slide.description && <div>{slide.description}</div>}
                </div>
              )
            }}
          />
        </div>
      ) : (
        <Loader />
      )}

      {!loader && <Footer />}
    </RootLayout>
  )
}

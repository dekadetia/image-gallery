'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { RxCross1 } from 'react-icons/rx'
import { BsSortAlphaDown } from 'react-icons/bs'
import { TbClockDown, TbClockUp } from 'react-icons/tb'
import { FaMagnifyingGlass } from 'react-icons/fa6'
import Lightbox from 'yet-another-react-lightbox'
import Footer from '../../components/Footer'
import Fuse from 'fuse.js';
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
  const searchInputRef = useRef(null);
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

        setImages(prevImages => {
          const existingIds = new Set(prevImages.map(img => img.id))
          const uniqueImages = images.filter(img => !existingIds.has(img.id))
          return [...prevImages, ...uniqueImages]
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

        setSlides(prevSlides => {
          const existingSrcs = new Set(prevSlides.map(slide => slide.src))
          const uniqueSlides = newSlides.filter(slide => !existingSrcs.has(slide.src))
          return [...prevSlides, ...uniqueSlides]
        })
      }
    } catch (error) {
      console.error('Error fetching files:', error)
    }
    __loader(false)
  }

  const sortImages = async (order_key, order_value, order_key_2, order_value_2, size, token) => {
    try {
      __order_key(order_key)
      __order_value(order_value)
      __order_key_2(order_key_2)
      __order_value_2(order_value_2)
      __sort_loader(true)
      setSorted(!isSorted)

      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/firebase/get-ordered-images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_by_key: order_key,
          order_by_value: order_value,
          order_by_key_2: order_key_2,
          order_by_value_2: order_value_2,
          size_limit: size,
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

        setImages(prevImages => {
          const existingIds = new Set(prevImages.map(img => img.id))
          const uniqueImages = images.filter(img => !existingIds.has(img.id))
          return [...prevImages, ...uniqueImages]
        })

        const newSlides = images.map(photo => ({
          src: photo.src,
          width: 1080 * 4,
          height: 1620 * 4,
          title: photo.caption,
          description: photo.dimensions
        }))

        setSlides(prevSlides => {
          const existingSrcs = new Set(prevSlides.map(slide => slide.src))
          const uniqueSlides = newSlides.filter(slide => !existingSrcs.has(slide.src))
          return [...prevSlides, ...uniqueSlides]
        })
      }
    } catch (error) {
      console.error('Sort fetch error:', error)
    } finally {
      __sort_loader(false)
      __loader(false)
    }
  }

  const clearValues = () =>
    new Promise(resolve => {
      setImages([])
      setNextPageToken(null)
      setSlides([])
      setHasMore(true)
      resolve()
    })

  const loadMoreByCondition = () => {
    if (searchQuery.trim()) return;
    if (order_key === 'alphaname') {
      sortImages(order_key, order_value, null, null, 99, nextPageToken)
    } else if (
      order_key === 'year' &&
      order_key_2 === 'alphaname'
    ) {
      sortImages(order_key, order_value, order_key_2, order_value_2, 99, nextPageToken)
    } else {
      getImages(nextPageToken)
    }
  }

  useEffect(() => {
    if (wasCalled.current) return
    wasCalled.current = true
    __loader(true)
    getImages(nextPageToken)
    setSorted(true)
  }, [])

// 🔥 Auto-focus search input when searchOpen becomes true
useEffect(() => {
  if (searchOpen && searchInputRef.current) {
    // Delay focus until after React has fully rendered the input
    setTimeout(() => {
      searchInputRef.current.focus();
    }, 0);
  }
}, [searchOpen]);


// ✅ Debounced search
useEffect(() => {
  if (debounceRef.current) clearTimeout(debounceRef.current)

  debounceRef.current = setTimeout(async () => {
    const query = searchQuery.trim().toLowerCase()

    if (!query) {
      clearValues().then(() => getImages(null))
      return
    }

    // 🎯 Strict year and decade matching first
    let local
    if (/^\d{4}$/.test(query)) {
      // Exact 4-digit year (e.g., 1933)
      local = Images.filter(img => String(img.year) === query)
    } else if (/^\d{3}$/.test(query) || /^\d{3}x$/.test(query) || /^\d{4}s$/.test(query)) {
      // Decade queries (e.g., 193, 193x, 1930s → 1930–1939)
      const decadePrefix = query.slice(0, 3)
      local = Images.filter(img => String(img.year).startsWith(decadePrefix))
    } else {
      // ✅ Fuse for captions and alphaname
      const fuse = new Fuse(Images, {
        keys: [
          { name: 'caption', weight: 0.6 },
          { name: 'alphaname', weight: 0.4 }
        ],
        threshold: 0.4,
        distance: 200,
        includeScore: true
      })
      const fuseResults = fuse.search(query).map(r => r.item)

      // ✅ Autocomplete for director and dimensions
      const queryParts = query.split(/\s+/)
      const autocompleteResults = Images.filter(img => {
        const dir = img.director?.toLowerCase() || ''
        const dim = img.dimensions?.slice(0, 6).toLowerCase() || ''
        return queryParts.every(part =>
          dir.split(/\s+/).some(word => word.startsWith(part)) ||
          dim.startsWith(part)
        )
      })

      // ✅ Combine Fuse + autocomplete and deduplicate
      const seen = new Set()
      local = [...fuseResults, ...autocompleteResults].filter(img => {
        const key = img.src
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
    }

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

    // ✅ Backend fallback if local search fails
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
      {/* Navigation */}
      <div className="w-full flex justify-center items-center pt-9 pb-[1.69rem]">
        <div className="w-full grid place-items-center space-y-6">
          <Link href={'/'}>
            <img src="/assets/logo.svg" className="object-contain w-40" alt="" />
          </Link>

          <div className="h-12 overflow-hidden w-full grid place-items-center !mt-[1rem] !mb-0">
            {searchOpen ? (
              <div className="w-full lg:w-[32.1%] flex justify-center mt-2 mb-6 px-4">
                <div className="relative w-full">
<input
  ref={searchInputRef} // 👈 gives us programmatic focus access
  type="text"
  placeholder=""
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  onKeyDown={(e) => {
    // ⎋ Close search box on Escape key
    if (e.key === 'Escape') {
      searchInputRef.current.blur(); // optional: removes focus
      setSearchOpen(false);          // closes the search box
      setSearchQuery('');            // optional: clears search text
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
                  className="cursor-pointer transition-all duration-200 hover:scale-105 text-2xl"
                  onClick={() => {
                    clearValues().then(() => {
                      __loader(true)
                      sortImages('alphaname', 'asc', null, null, Images.length, null)
                    })
                  }}
                />
                <div onClick={() => setSearchOpen(true)}>
                  <FaMagnifyingGlass className="cursor-pointer transition-all duration-200 hover:scale-105 text-xl" />
                </div>
                {!isSorted ? (
                  <TbClockDown
                    className="cursor-pointer transition-all duration-200 hover:scale-105 text-2xl"
                    onClick={() => {
                      clearValues().then(() => {
                        __loader(true)
                        sortImages('year', 'desc', 'alphaname', 'asc', Images.length, null)
                      })
                    }}
                  />
                ) : (
                  <TbClockUp
                    className="cursor-pointer transition-all duration-200 hover:scale-105 text-2xl"
                    onClick={() => {
                      clearValues().then(() => {
                        __loader(true)
                        sortImages('year', 'asc', 'alphaname', 'asc', Images.length, null)
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
            className='mt-[-2px]'
            dataLength={Images.length}
            next={loadMoreByCondition}
            hasMore={hasMore}
            loader={
              !searchQuery.trim() && hasMore ? <MoreImageLoader /> : null
            }
          >
            <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[10px] place-items-center">
              {Images.map((photo, i) => (
                <div key={i}>
                  <img
                    alt={photo.name}
                    src={photo.src}
                    onClick={() => setIndex(i)}
                    className="aspect-[16/9] object-cover cursor-zoom-in"
                  />
                </div>
              ))}
            </div>
          </InfiniteScroll>

          {slides && (
            <Lightbox
              index={index}
              slides={slides}
              open={index >= 0}
              close={() => setIndex(-1)}
              render={{
                slideFooter: ({ slide }) => (
                  <div className="lg:!w-[96%] text-left text-sm space-y-1 lg:pt-[.5rem] lg:mb-[.75rem] pb-[1rem] text-white px-0 pt-0 lg:pl-0 lg:ml-[-35px] lg:pr-[3rem] yarl-slide-content">
                    {slide.title && (
                      <div className="yarl__slide_title">{slide.title}</div>
                    )}
                    <div className={cn("!space-y-0", slide.director && "!mb-5")}>
                      {slide.director && (
                        <div className="yarl__slide_description !text-[#99AABB]">
                          <span className="font-medium">{slide.director}</span>
                        </div>
                      )}
                      {slide.description && (
                        <div className="yarl__slide_description">{slide.description}</div>
                      )}
                    </div>
                  </div>
                )
              }}
            />
          )}
        </div>
      ) : (
        <Loader />
      )}

      {!loader && <Footer />}
    </RootLayout>
  )
}

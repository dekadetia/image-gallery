'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
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
  const PAGE_SIZE = 99

  const searchInputRef = useRef(null)
  const [isSorted, setSorted] = useState(false) // used only for clock direction UI
  const [index, setIndex] = useState(-1)
  const [slides, setSlides] = useState([])
  const [Images, setImages] = useState([])
  const [FullImages, setFullImages] = useState([])
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

  /* ---------------------------------------------------
      UNIVERSAL FIXED SLIDE BUILDER (for images + videos)
     --------------------------------------------------- */
  function buildSlidesFromPhotos(images) {
    return images.map(photo => {
      const base = {
        src: photo.src, // ALWAYS EXISTS NOW
        width: 1080 * 4,
        height: 1620 * 4,
        title: photo.caption,
        description: photo.dimensions,
        director: photo.director,
      }

      if (photo.src && photo.src.includes('.webm')) {
        return {
          ...base,
          type: 'video',
          sources: [{ src: photo.src, type: 'video/webm' }],
          poster: '/assets/transparent.png',
          autoPlay: true,
          muted: true,
          loop: true,
          controls: false,
        }
      }

      return {
        ...base,
        type: 'image',
      }
    })
  }

  /* ---------------------------------------------------
                FETCH PAGINATED ORDERED IMAGES (default)
     --------------------------------------------------- */
  const getImages = async token => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/firebase/get-ordered-images`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_by_key: 'alphaname',
            order_by_value: 'asc',
            size_limit: PAGE_SIZE,
            lastVisibleDocId: token,
          }),
        }
      )

      if (response.ok) {
        const data = await response.json()
        const images = data.images

        if (images.length === 0) {
          setHasMore(false)
          return
        }

        setNextPageToken(data.nextPageToken)

        setImages(prev => {
          const seen = new Set(prev.map(i => i.id))
          const unique = images.filter(i => !seen.has(i.id))
          return [...prev, ...unique]
        })

        const newSlides = buildSlidesFromPhotos(images)
        setSlides(prev => {
          const seen = new Set(prev.map(s => s.src))
          const unique = newSlides.filter(s => !seen.has(s.src))
          return [...prev, ...unique]
        })
      }
    } catch (err) {
      console.error('Error fetching files:', err)
    } finally {
      __loader(false)
    }
  }

  /* ---------------------------------------------------
                    FETCH ALL IMAGES (search)
     --------------------------------------------------- */
  const getAllImagesNoLimit = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/firebase/get-all-images-no-limit`
      )
      const data = await res.json()
      if (data.success) {
        setFullImages(dedupeById(data.images))
      }
    } catch (err) {
      console.error('Error preloading all images:', err)
    }
  }

  /* ---------------------------------------------------
                     SORTED LOAD
     --------------------------------------------------- */
  const sortImages = async (
    order_key,
    order_value,
    order_key_2,
    order_value_2,
    size,
    token
  ) => {
    try {
      __order_key(order_key)
      __order_value(order_value)
      __order_key_2(order_key_2)
      __order_value_2(order_value_2)
      __sort_loader(true)

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/firebase/get-ordered-images`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_by_key,
            order_by_value,
            order_by_key_2,
            order_by_value_2,
            size_limit: size,
            lastVisibleDocId: token,
          }),
        }
      )

      if (response.ok) {
        const data = await response.json()
        const images = data.images

        if (images.length === 0) {
          setHasMore(false)
          return
        }

        setNextPageToken(data.nextPageToken)

        setImages(prev => {
          const seen = new Set(prev.map(i => i.id))
          const unique = images.filter(i => !seen.has(i.id))
          return [...prev, ...unique]
        })

        const newSlides = buildSlidesFromPhotos(images)
        setSlides(prev => {
          const seen = new Set(prev.map(s => s.src))
          const unique = newSlides.filter(s => !seen.has(s.src))
          return [...prev, ...unique]
        })
      }
    } catch (err) {
      console.error('Sort fetch error:', err)
    } finally {
      __sort_loader(false)
      __loader(false)
    }
  }

  /* ---------------------------------------------------
         CLEAR STATE WHEN CHANGING SORT / SEARCH
     --------------------------------------------------- */
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

    if (order_key === 'alphaname') {
      sortImages(order_key, order_value, null, null, PAGE_SIZE, nextPageToken)
    } else if (order_key === 'year' && order_key_2 === 'alphaname') {
      sortImages(
        order_key,
        order_value,
        order_key_2,
        order_value_2,
        PAGE_SIZE,
        nextPageToken
      )
    } else {
      getImages(nextPageToken)
    }
  }

  /* ---------------------------------------------------
            INITIAL PAGE LOAD
     --------------------------------------------------- */
  useEffect(() => {
    if (wasCalled.current) return
    wasCalled.current = true
    __loader(true)
    getAllImagesNoLimit()
    getImages(null)
    setSorted(true) // your prior default behavior
  }, [])

  /* ---------------------------------------------------
      REMOVE Lightbox "title=Close" (your existing patch)
     --------------------------------------------------- */
  useEffect(() => {
    if (!slides.length) return
    const observer = new MutationObserver(() => {
      document
        .querySelectorAll('.yarl__button[title="Close"]')
        .forEach(btn => btn.removeAttribute('title'))
    })
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [slides])

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current.focus(), 0)
    }
  }, [searchOpen])

  /* ---------------------------------------------------
                      SEARCH LOGIC
     --------------------------------------------------- */
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      const rawQuery = searchQuery.trim().toLowerCase()
      if (!rawQuery) {
        clearValues().then(() => getImages(null))
        return
      }

      if (
        /^\d{4}$/.test(rawQuery) ||
        /^\d{3}$/.test(rawQuery) ||
        /^\d{3}x$/.test(rawQuery) ||
        /^\d{4}s$/.test(rawQuery)
      ) {
        fetchBackendSearch(rawQuery)
        return
      }

      const fuse = new Fuse(FullImages, {
        keys: [
          { name: 'caption', weight: 0.7 },
          { name: 'alphaname', weight: 0.2 },
          { name: 'director', weight: 0.1 },
        ],
        threshold: 0.3,
        distance: 100,
        includeScore: true,
      })

      const results = fuse.search(rawQuery).map(r => r.item)

      if (results.length < 5) {
        fetchBackendSearch(rawQuery)
        return
      }

      const deduped = dedupeById(results)
      setImages(deduped)
      setSlides(buildSlidesFromPhotos(deduped))
    }, 300)
  }, [searchQuery])

  async function fetchBackendSearch(queryText) {
    try {
      __loader(true)
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/firebase/search-ordered-images`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ queryText }),
        }
      )
      const data = await res.json()

      const deduped = dedupeById(data.results)
      setImages(deduped)
      setSlides(buildSlidesFromPhotos(deduped))
    } catch (err) {
      console.error('Backend search failed:', err)
    } finally {
      __loader(false)
    }
  }

  /* ---------------------------------------------------
                        RENDER
     --------------------------------------------------- */
  return (
    <RootLayout>
      {/* NAVIGATION */}
      <div className="w-full flex justify-center items-center pt-9 pb-[1.69rem]">
        <div className="w-full grid place-items-center space-y-6">
          <Link href="/">
            <div id="logo" className="w-40 h-auto cursor-pointer">
              <AnimatedLogo />
            </div>
          </Link>

          <div className="h-12 overflow-hidden w-full grid place-items-center !mt-[1rem] !mb-0">
            {searchOpen ? (
              <div className="w-full lg:w-[32.1%] flex justify-center mt-2 mb-6 px-4">
                <div className="relative w-full">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Escape') {
                        searchInputRef.current.blur()
                        setSearchOpen(false)
                        setSearchQuery('')
                      }
                    }}
                    className="w-full pl-1.5 pr-10 pt-[.45rem] pb-[.5rem] border-b border-b-white bg-transparent focus:outline-none text-sm"
                  />
                  <div
                    onClick={() => setSearchOpen(false)}
                    className="cursor-pointer"
                  >
                    <RxCross1 className="absolute right-3 top-2.5 text-white" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex gap-[2.3rem] items-center -mt-[2px]">
                <BsSortAlphaDown
                  className="cursor-pointer text-2xl hover:scale-105 transition-all"
                  onClick={() => {
                    clearValues().then(() => {
                      __loader(true)
                      // alpha sort should NOT flip the clock UI state
                      sortImages('alphaname', 'asc', null, null, PAGE_SIZE, null)
                    })
                  }}
                />
                <div onClick={() => setSearchOpen(true)}>
                  <FaMagnifyingGlass className="cursor-pointer text-xl hover:scale-105 transition-all" />
                </div>

                {!isSorted ? (
                  <TbClockDown
                    className="cursor-pointer text-2xl hover:scale-105 transition-all"
                    onClick={() => {
                      clearValues().then(() => {
                        __loader(true)
                        setSorted(true) // desc mode
                        sortImages(
                          'year',
                          'desc',
                          'alphaname',
                          'asc',
                          PAGE_SIZE,
                          null
                        )
                      })
                    }}
                  />
                ) : (
                  <TbClockUp
                    className="cursor-pointer text-2xl hover:scale-105 transition-all"
                    onClick={() => {
                      clearValues().then(() => {
                        __loader(true)
                        setSorted(false) // asc mode
                        sortImages(
                          'year',
                          'asc',
                          'alphaname',
                          'asc',
                          PAGE_SIZE,
                          null
                        )
                      })
                    }}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* GRID */}
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
                  key={i}
                  className="w-full aspect-[16/9] relative overflow-hidden cursor-zoom-in"
                  onClick={() => setIndex(i)}
                >
                  {photo.src && photo.src.includes('.webm') ? (
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

          {/* LIGHTBOX */}
          {slides && (
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
                      'lg:!w-[96%] text-left text-sm space-y-1 lg:pt-[.5rem] lg:mb-[.75rem] pb-[1rem] text-white px-0 pt-0 lg:pl-0 lg:ml-[-35px] lg:pr-[3rem] yarl-slide-content',
                      slide.type === 'video' && 'relative top-auto bottom-unset'
                    )}
                  >
                    {slide.title && (
                      <div className="yarl__slide_title">{slide.title}</div>
                    )}

                    <div className={cn('!space-y-0', slide.director && '!mb-5')}>
                      {slide.director && (
                        <div className="yarl__slide_description !text-[#99AABB]">
                          <span className="font-medium">{slide.director}</span>
                        </div>
                      )}
                      {slide.description && (
                        <div className="yarl__slide_description">
                          {slide.description}
                        </div>
                      )}
                    </div>
                  </div>
                ),
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

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
  const searchInputRef = useRef(null);
  const [isSorted, setSorted] = useState(false)
  const [index, setIndex] = useState(-1)
  const [slides, setSlides] = useState([])
  const [Images, setImages] = useState([])
  const [FullImages, setFullImages] = useState([]) // ⬅️ Store all images once
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/firebase/get-all-images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        const data = await response.json()
        const images = data.images

        setFullImages(images) // ⬅️ Save all images for searching
        setNextPageToken(data.nextPageToken)
        setImages(images.slice(0, 99))
        setSlides(images.slice(0, 99).map(photo => ({
          src: photo.src,
          width: 1080 * 4,
          height: 1620 * 4,
          title: photo.caption,
          description: photo.dimensions,
          director: photo.director || null,
          year: photo.year
        })))
      }
    } catch (error) {
      console.error('Error fetching files:', error)
    }
    __loader(false)
  }

  const clearValues = () =>
    new Promise(resolve => {
      setImages([])
      setNextPageToken(null)
      setSlides([])
      setHasMore(true)
      resolve()
    })

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
    debounceRef.current = setTimeout(() => {
      const query = searchQuery.trim().toLowerCase()
      if (!query) {
        setImages(FullImages.slice(0, 99))
        setSlides(FullImages.slice(0, 99).map(photo => ({
          src: photo.src,
          width: 1080 * 4,
          height: 1620 * 4,
          title: photo.caption,
          description: photo.dimensions,
          director: photo.director || null,
          year: photo.year
        })))
        return
      }

      let local

      // 📅 Decade queries: 193, 193x, 1930s
      if (/^\d{3}$/.test(query) || /^\d{3}x$/.test(query) || /^\d{4}s$/.test(query)) {
        const decadePrefix = query.slice(0, 3)
        local = FullImages.filter(img =>
          String(img.year).startsWith(decadePrefix)
        )
      }
      // 🎥 Exact year query: 1933
      else if (/^\d{4}$/.test(query)) {
        local = FullImages.filter(img =>
          String(img.year) === query
        )
      }
      // 📐 Strict aspect ratio: 1.33 or 1.33:1
      else if (/^\d\.\d{2}(:1)?$/.test(query)) {
        local = FullImages.filter(img =>
          img.dimensions?.toLowerCase().startsWith(query)
        )
      }
      else {
        // 🔥 Fuse for captions/alphaname
        const fuse = new Fuse(FullImages, {
          keys: [
            { name: 'caption', weight: 0.6 },
            { name: 'alphaname', weight: 0.4 }
          ],
          threshold: 0.4,
          distance: 200,
          includeScore: true
        })
        const fuseResults = fuse.search(query).map(r => r.item)

        // 🔥 Autocomplete for director
        const autocompleteResults = FullImages.filter(img =>
          img.director?.toLowerCase().includes(query)
        )

        const seen = new Set()
        local = [...fuseResults, ...autocompleteResults].filter(img => {
          const key = img.src
          if (seen.has(key)) return false
          seen.add(key)
          return true
        })
      }

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
                    ref={searchInputRef}
                    type="text"
                    placeholder=""
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        searchInputRef.current.blur()
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
                  className="cursor-pointer transition-all duration-200 hover:scale-105 text-2xl"
                  onClick={() => {
                    clearValues().then(() => {
                      __loader(true)
                      sortImages('alphaname', 'asc', null, null, FullImages.length, null)
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
                        sortImages('year', 'desc', 'alphaname', 'asc', FullImages.length, null)
                      })
                    }}
                  />
                ) : (
                  <TbClockUp
                    className="cursor-pointer transition-all duration-200 hover:scale-105 text-2xl"
                    onClick={() => {
                      clearValues().then(() => {
                        __loader(true)
                        sortImages('year', 'asc', 'alphaname', 'asc', FullImages.length, null)
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

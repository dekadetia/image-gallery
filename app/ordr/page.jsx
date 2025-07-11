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

  const getAllImages = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/firebase/get-all-images-ordr`)
      const data = await res.json()
      setFullImages(data.images)
      setImages(data.images.slice(0, 99))
      setSlides(data.images.slice(0, 99).map(photo => ({
        src: photo.src,
        width: 1080 * 4,
        height: 1620 * 4,
        title: photo.caption,
        description: photo.dimensions,
        director: photo.director || null,
        year: photo.year
      })))
    } catch (err) {
      console.error('Failed to fetch all images:', err)
    } finally {
      __loader(false)
    }
  }

  const sortImages = async (order_key, order_value, order_key_2, order_value_2, size, token) => {
    __order_key(order_key)
    __order_value(order_value)
    __order_key_2(order_key_2)
    __order_value_2(order_value_2)
    __sort_loader(true)
    setSorted(!isSorted)

    const sorted = [...FullImages].sort((a, b) => {
      if (order_key === 'year') {
        return order_value === 'asc'
          ? a.year - b.year
          : b.year - a.year
      }
      return a.alphaname.localeCompare(b.alphaname)
    })

    setImages(sorted.slice(0, size))
    setSlides(sorted.slice(0, size).map(photo => ({
      src: photo.src,
      width: 1080 * 4,
      height: 1620 * 4,
      title: photo.caption,
      description: photo.dimensions,
      director: photo.director || null,
      year: photo.year
    })))
    __sort_loader(false)
    __loader(false)
  }

  const clearValues = () =>
    new Promise(resolve => {
      setImages([])
      setSlides([])
      setHasMore(true)
      resolve()
    })

  useEffect(() => {
    if (wasCalled.current) return
    wasCalled.current = true
    __loader(true)
    getAllImages()
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
      if (!FullImages.length) return

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
      if (/^\d{4}$/.test(query)) {
        local = FullImages.filter(img => String(img.year) === query)
      } else if (/^\d{3}$/.test(query) || /^\d{3}x$/.test(query) || /^\d{4}s$/.test(query)) {
        const decadePrefix = query.slice(0, 3)
        local = FullImages.filter(img => String(img.year).startsWith(decadePrefix))
      } else {
        const fuse = new Fuse(FullImages, {
          keys: [
            { name: 'caption', weight: 0.5 },
            { name: 'alphaname', weight: 0.3 },
            { name: 'director', weight: 0.2 }
          ],
          threshold: 0.35,
          distance: 200,
          includeScore: true
        })
        const fuseResults = fuse.search(query).map(r => r.item)

        const autocompleteResults = FullImages.filter(img => {
          const dir = img.director?.toLowerCase() || ''
          const dim = img.dimensions?.slice(0, 6).toLowerCase() || ''
          return query.split(/\s+/).every(part =>
            dir.includes(part) || dim.startsWith(part)
          )
        })

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
        year: photo.year
      })))
    }, 300)
  }, [searchQuery])

  return (
    <RootLayout>
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
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => {
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
                    clearValues().then(() => sortImages('alphaname', 'asc', null, null, 99, null))
                  }}
                />
                <div onClick={() => setSearchOpen(true)}>
                  <FaMagnifyingGlass className="cursor-pointer transition-all duration-200 hover:scale-105 text-xl" />
                </div>
                {!isSorted ? (
                  <TbClockDown
                    className="cursor-pointer transition-all duration-200 hover:scale-105 text-2xl"
                    onClick={() => {
                      clearValues().then(() =>
                        sortImages('year', 'desc', 'alphaname', 'asc', 99, null)
                      )
                    }}
                  />
                ) : (
                  <TbClockUp
                    className="cursor-pointer transition-all duration-200 hover:scale-105 text-2xl"
                    onClick={() => {
                      clearValues().then(() =>
                        sortImages('year', 'asc', 'alphaname', 'asc', 99, null)
                      )
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
            next={() => {}}
            hasMore={false}
            loader={null}
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

'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { RxCross1 } from 'react-icons/rx'
import { BsSortAlphaDown } from 'react-icons/bs'
import { TbClockDown, TbClockUp } from 'react-icons/tb'
import { FaMagnifyingGlass } from 'react-icons/fa6'
import Lightbox from 'yet-another-react-lightbox'
console.log("🔥 Using YARL version:", Lightbox.version || "unknown");
import Video from 'yet-another-react-lightbox/plugins/video'
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

        const newSlides = images.map(photo => {
          if (photo.src.includes('.webm')) {
            return {
              type: 'video',
              width: 1080 * 4,
              height: 1620 * 4,
              title: photo.caption,
              description: photo.dimensions,
              director: photo.director,
              sources: [
                {
                  src: photo.src,
                  type: 'video/webm'
                }
              ],
              poster: '/assets/transparent.png',
              autoPlay: true,
              muted: true,
              loop: true,
              controls: false,
              className: 'yarl__slide_image',
              style: {
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                display: 'block',
                margin: '0 auto',
                backgroundColor: 'transparent'
              }
            }
          } else {
            return {
              type: 'image',
              src: photo.src,
              width: 1080 * 4,
              height: 1620 * 4,
              title: photo.caption,
              description: photo.dimensions,
              director: photo.director
            }
          }
        })

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

  const getAllImagesNoLimit = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/firebase/get-all-images-no-limit`)
      const data = await res.json()
      if (data.success) {
        setFullImages(data.images)
      }
    } catch (error) {
      console.error('Error preloading all images:', error)
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
    if (searchQuery.trim()) return
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
    getAllImagesNoLimit()
    getImages(nextPageToken)
    setSorted(true)
  }, [])

  useEffect(() => {
    if (!slides.length) return
    const observer = new MutationObserver(() => {
      document.querySelectorAll('.yarl__button[title="Close"]').forEach(btn => {
        btn.removeAttribute('title')
      })
    })
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [slides])

  return (
    <RootLayout>
      <div className="w-full flex justify-center items-center pt-9 pb-[1.69rem]">
        <div className="w-full grid place-items-center space-y-6">
          <Link href={'/'}>
            <img src="/assets/logo.svg" className="object-contain w-40" alt="" />
          </Link>
        </div>
      </div>

      {!loader ? (
        <div className="px-4 lg:px-16 pb-10 relative top-[.5px]">
          <InfiniteScroll
            className='mt-[-2px]'
            dataLength={Images.length}
            next={loadMoreByCondition}
            hasMore={hasMore}
            loader={!searchQuery.trim() && hasMore ? <MoreImageLoader /> : null}
          >
            <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[10px] place-items-center">
              {Images.map((photo, i) => (
                <div key={i}>
                  {photo.src.includes('.webm') ? (
                    <video
                      src={photo.src}
                      muted
                      autoPlay
                      loop
                      playsInline
                      preload="metadata"
                      poster="/assets/transparent.png"
                      onClick={() => setIndex(i)}
                      className="aspect-[16/9] object-cover cursor-zoom-in"
                      style={{
                        display: 'block',
                        width: '100%',
                        height: 'auto',
                        backgroundColor: 'transparent'
                      }}
                    />
                  ) : (
                    <img
                      alt={photo.name}
                      src={photo.src}
                      onClick={() => setIndex(i)}
                      className="aspect-[16/9] object-cover cursor-zoom-in"
                    />
                  )}
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
              plugins={[Video]}
              render={{
                slide: ({ slide, rect }) => {
                  const slideClass = slide.type === 'video' ? 'yarl__slide yarl__slide--video' : 'yarl__slide'
                  if (slide.type === 'video') {
                    return (
                      <video
                        src={slide.sources?.[0]?.src || slide.src}
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="auto"
                        className={`${slideClass}_image`}
                        style={{
                          maxWidth: rect.width,
                          maxHeight: rect.height,
                          objectFit: 'contain',
                          display: 'block',
                          margin: '0 auto',
                          backgroundColor: 'transparent'
                        }}
                      />
                    )
                  }

                  return (
                    <img
                      src={slide.src}
                      alt={slide.title || ''}
                      className={`${slideClass}_image`}
                      style={{
                        maxWidth: rect.width,
                        maxHeight: rect.height,
                        objectFit: 'contain'
                      }}
                    />
                  )
                },
                slideFooter: ({ slide }) => (
                  <div
                    className="lg:!w-[96%] text-left text-sm space-y-1 lg:pt-[.5rem] lg:mb-[.75rem] pb-[1rem] text-white px-0 pt-0 lg:pl-0 lg:ml-[-35px] lg:pr-[3rem] yarl-slide-content"
                  >
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

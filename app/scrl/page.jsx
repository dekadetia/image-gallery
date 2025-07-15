'use client'

import { useState, useEffect, useRef } from 'react'
import Lightbox from 'yet-another-react-lightbox'
import Link from 'next/link'
import { IoMdShuffle } from 'react-icons/io'
import { RxDoubleArrowUp } from "react-icons/rx";
import Footer from '../../components/Footer'
import RootLayout from '../layout'
import MoreImageLoader from '../../components/MoreImageLoader'
import Loader from '../../components/loader/loader'
import InfiniteScroll from 'react-infinite-scroll-component'

import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export default function Scrl() {
  const [index, setIndex] = useState(-1)
  const [Images, setImages] = useState([])
  const [loader, __loader] = useState(true)
  const [autosMode, setAutosMode] = useState(false)
  const [hideCursor, setHideCursor] = useState(false)
  const scrollRef = useRef(null)
  const cursorTimerRef = useRef(null)
  const wasCalled = useRef(false)
  const seenImageIds = useRef(new Set())

  const slides = Images.map(photo => ({
    src: photo.src,
    width: 1080 * 4,
    height: 1620 * 4,
    title: `${photo.caption}`,
    description: photo.dimensions,
    director: photo.director || null,
    year: photo.year
  }))

  const getImages = async load => {
    if (load !== 'load more') {
      __loader(true)
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/firebase/get-random-images`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        const images = data.images

        const uniqueImages = images.filter(
          img => !seenImageIds.current.has(img.id)
        )
        uniqueImages.forEach(img => seenImageIds.current.add(img.id))

        setImages(prev => [...prev, ...uniqueImages])
      } else {
        console.error('Failed to get files')
      }
    } catch (error) {
      console.log(error)
    } finally {
      __loader(false)
    }
  }

  const getRandmImages = async () => {
    __loader(true)
    setImages([])
    seenImageIds.current = new Set()

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/firebase/get-random-images`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        const images = data.images

        images.forEach(img => seenImageIds.current.add(img.id))
        setImages(images)
      } else {
        console.error('Failed to get files')
      }
    } catch (error) {
      console.log(error)
    } finally {
      __loader(false)
    }
  }

  const handleCloseLightbox = () => {
    setIndex(-1)
  }

  useEffect(() => {
    if (wasCalled.current) return
    wasCalled.current = true
    getImages()
  }, [])

  // Start auto-scrolling immediately
  useEffect(() => {
    let scrollSpeed = 0.5
    const scrollStep = () => {
      window.scrollBy(0, scrollSpeed)
      if (window.scrollY + window.innerHeight >= document.body.scrollHeight) {
        window.scrollTo(0, 0)
      }
      scrollRef.current = requestAnimationFrame(scrollStep)
    }
    scrollRef.current = requestAnimationFrame(scrollStep)

    return () => cancelAnimationFrame(scrollRef.current)
  }, [])

  // Handle autosMode fullscreen + cursor hide
  useEffect(() => {
    if (autosMode) {
      document.body.classList.add("autosmode")

      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch((err) => {
          console.warn("Fullscreen request failed:", err)
        })
      }

      const handleMouseMove = () => {
        clearTimeout(cursorTimerRef.current)
        setHideCursor(false)

        cursorTimerRef.current = setTimeout(() => {
          setHideCursor(true)
        }, 3000)
      }

      window.addEventListener("mousemove", handleMouseMove)

      const exitBtn = document.createElement("button")
      exitBtn.style.position = "fixed"
      exitBtn.style.top = "10px"
      exitBtn.style.right = "10px"
      exitBtn.style.width = "30px"
      exitBtn.style.height = "30px"
      exitBtn.style.opacity = "0"
      exitBtn.style.cursor = "pointer"
      exitBtn.style.zIndex = "9999"
      exitBtn.onclick = () => setAutosMode(false)
      document.body.appendChild(exitBtn)

      return () => {
        document.body.classList.remove("autosmode")
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch((err) => {
            console.warn("Exiting fullscreen failed:", err)
          })
        }

        clearTimeout(cursorTimerRef.current)
        window.removeEventListener("mousemove", handleMouseMove)
        exitBtn.remove()
      }
    }
  }, [autosMode])

  useEffect(() => {
    if (hideCursor && autosMode) {
      document.body.classList.add("blackmode-hide-cursor")
    } else {
      document.body.classList.remove("blackmode-hide-cursor")
    }
  }, [hideCursor, autosMode])

  const handleImageClick = (imageId) => {
    const idx = Images.findIndex(img => img.id === imageId)
    if (idx !== -1) setIndex(idx)
  }

  return (
    <RootLayout>
      <button
        onClick={() => setAutosMode(true)}
        style={{
          position: "fixed",
          top: "10px",
          right: "10px",
          width: "30px",
          height: "30px",
          opacity: 0,
          cursor: "pointer",
          zIndex: 9999,
        }}
        aria-hidden="true"
        tabIndex={-1}
      />

      {!autosMode && (
        <div className='w-full flex justify-center items-center py-9'>
          <div className='w-full grid place-items-center space-y-6'>
            <Link href={'/'}>
              <img
                src='/assets/logo.svg'
                className='object-contain w-40'
                alt=''
              />
            </Link>

        <div className='flex gap-10 items-center'>
  <Link href={'/fade'}>
    <img
      src="/assets/crossfade.svg"
      className='w-[1.4rem] object-contain transition-all duration-200 hover:scale-105 align-middle'
      alt=""
    />
  </Link>

  <Link href={'/scrl'}>
    <RiArrowUpDoubleLine
      className='cursor-pointer transition-all duration-200 hover:scale-105 text-3xl align-middle'
    />
  </Link>

  <IoMdShuffle
    onClick={getRandmImages}
    className='cursor-pointer transition-all duration-200 hover:scale-105 text-2xl align-middle'
  />
</div>

          </div>
        </div>
      )}

      <div className={autosMode ? "w-full z-50" : "px-4 lg:px-16 pb-10"}>
        {loader ? (
          <Loader />
        ) : (
          <InfiniteScroll
            dataLength={Images.length}
            next={() => getImages('load more')}
            hasMore={true}
            loader={<MoreImageLoader />}
          >
            <div className='w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[10px] place-items-center'>
              {Images.map(photo => (
                <div key={photo.id}>
                  <img
                    alt={photo.name}
                    src={photo.src}
                    onClick={() => handleImageClick(photo.id)}
                    className='aspect-[16/9] object-cover cursor-zoom-in'
                    decoding='async'
                  />
                </div>
              ))}
            </div>
          </InfiniteScroll>
        )}
      </div>

      {slides && (
        <Lightbox
          index={index}
          slides={slides}
          open={index >= 0}
          close={handleCloseLightbox}
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

      {!loader && !autosMode && <Footer />}
    </RootLayout>
  )
}

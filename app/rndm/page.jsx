'use client'

import { useState, useEffect, useRef } from 'react'
import Lightbox from 'yet-another-react-lightbox'
import Video from 'yet-another-react-lightbox/plugins/video'
import Link from 'next/link'
import { IoMdShuffle } from 'react-icons/io'
import { RxDoubleArrowUp } from "react-icons/rx";
import Footer from '../../components/Footer'
import RootLayout from '../layout'
import AnimatedLogo from '../../components/AnimatedLogo';
import MoreImageLoader from '../../components/MoreImageLoader'
import Loader from '../../components/loader/loader'
import InfiniteScroll from 'react-infinite-scroll-component'

import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export default function Random() {
  const [index, setIndex] = useState(-1)
  const [Images, setImages] = useState([])
  const [loader, __loader] = useState(true)
  const wasCalled = useRef(false)
  const seenImageIds = useRef(new Set()) // ✅ Track loaded image IDs

const slides = Images.map(photo => {
  const src = photo.src ?? '';
  if (src.toLowerCase().includes('.webm')) {
    return {
      type: 'video',
      width: 1080 * 4,
      height: 1620 * 4,
      title: `${photo.caption}`,
      description: photo.dimensions,
      director: photo.director || null,
      year: photo.year,
      sources: [{
        src,
        type: 'video/webm'
      }],
      poster: '/assets/transparent.png',
      autoPlay: true,
      muted: true,
      loop: true,
      controls: false
    };
  } else {
    return {
      type: 'image',
      src,
      width: 1080 * 4,
      height: 1620 * 4,
      title: `${photo.caption}`,
      description: photo.dimensions,
      director: photo.director || null,
      year: photo.year
    };
  }
});



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

  // 🩹 MutationObserver to remove title="Close"
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

  const handleImageClick = (imageId) => {
    const idx = Images.findIndex(img => img.id === imageId)
    if (idx !== -1) setIndex(idx)
  }

  return (
    <RootLayout>
      <div className='px-4 lg:px-16 pb-10'>
        {/* Navigation */}
        <div className='w-full flex justify-center items-center py-9'>
          <div className='w-full grid place-items-center space-y-6'>
<Link href="/">
  <div id="logo" className="w-40 h-auto cursor-pointer">
    <AnimatedLogo />
  </div>
</Link>

<div className="flex gap-8 items-center pt-[2.5px]" style={{ marginBottom: '4px' }}>
  <Link href={'/fade'}>
    <img
      src="/assets/crossfade.svg"
      className="w-[1.4rem] object-contain transition-all duration-200 hover:scale-105 align-middle mr-[3.75px]"
      alt=""
    />
  </Link>

  <Link href={'/scrl'}>
    <RxDoubleArrowUp 
      className="cursor-pointer transition-all duration-200 hover:scale-105 text-2xl align-middle"
    />
  </Link>

  <IoMdShuffle
    onClick={getRandmImages}
    className="cursor-pointer transition-all duration-200 hover:scale-105 text-2xl align-middle ml-[3.75px]"
  />
</div>


          </div>
        </div>

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
  <div
    key={photo.id}
    className="w-full aspect-[16/9] relative overflow-hidden cursor-zoom-in"
    onClick={() => handleImageClick(photo.id)}
  >
    {photo.src?.toLowerCase().includes('.webm') ? (
      <video
        src={photo.src}
        autoPlay
        muted
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
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover"
      />
    )}
  </div>
))}

            </div>
          </InfiniteScroll>
        )}

        {slides && (
<Lightbox
  index={index}
  slides={slides}
  open={index >= 0}
  close={handleCloseLightbox}
  plugins={[Video]}
  render={{
    slideFooter: ({ slide }) => (
<div className={cn(
  "lg:!w-[96%] text-left text-sm space-y-1 lg:pt-[.5rem] lg:mb-[.75rem] pb-[1rem] text-white px-0 pt-0 lg:pl-0 lg:ml-[-35px] lg:pr-[3rem] yarl-slide-content",
  slide.type === 'video' && 'relative top-auto bottom-unset'
)}>
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

      {!loader && <Footer />}
    </RootLayout>
  )
}

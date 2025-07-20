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
  console.log("🪵 Processing photo.src:", photo.src)

  if (photo.src.includes('.webm')) { // 🔥 Match anywhere in URL
    console.log("🎥 Detected as video:", photo.src)
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
      poster: '',      // Optional placeholder image
      autoPlay: true,  // 🔥 Auto-play video
      muted: true,     // 🔥 Start muted for autoplay compliance
      loop: true,      // 🔥 Loop video playback
      controls: false, // 🔥 Hide controls
      className: 'yarl__slide_image', // 🔥 Force same styles as images
     style: {
  maxWidth: '100%',
  height: 'auto',
  objectFit: 'contain',
  display: 'block',
  margin: '0 auto',
  backgroundColor: 'black'
}

    }
  } else {
    console.log("🖼️ Detected as image:", photo.src)
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
          description: photo.dimensions,
          director: photo.director
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

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current.focus();
      }, 0);
    }
  }, [searchOpen]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      const rawQuery = searchQuery.trim().toLowerCase()
      if (!rawQuery) {
        clearValues().then(() => getImages(null))
        return
      }

      if (/^\d{4}$/.test(rawQuery) || /^\d{3}$/.test(rawQuery) || /^\d{3}x$/.test(rawQuery) || /^\d{4}s$/.test(rawQuery)) {
        fetchBackendSearch(rawQuery);
        return;
      }

      const fuse = new Fuse(FullImages, {
        keys: [
          { name: 'caption', weight: 0.7 },
          { name: 'alphaname', weight: 0.2 },
          { name: 'director', weight: 0.1 }
        ],
        threshold: 0.3,
        distance: 100,
        includeScore: true
      });
      const fuseResults = fuse.search(rawQuery).map(r => r.item)

      if (fuseResults.length < 5) {
        fetchBackendSearch(rawQuery);
        return;
      }

      setImages(fuseResults)
      setSlides(fuseResults.map(photo => ({
        src: photo.src,
        width: 1080 * 4,
        height: 1620 * 4,
        title: photo.caption,
        description: photo.dimensions,
        director: photo.director
      })))
    }, 300)
  }, [searchQuery])

  async function fetchBackendSearch(queryText) {
    try {
      __loader(true)
      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/firebase/search-ordered-images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queryText })
      })
      const data = await res.json()
      setImages(data.results)
      setSlides(data.results.map(photo => ({
        src: photo.src,
        width: 1080 * 4,
        height: 1620 * 4,
        title: photo.caption,
        description: photo.dimensions,
        director: photo.director
      })))
    } catch (err) {
      console.error('Backend search failed:', err)
    } finally {
      __loader(false)
    }
  }

  return (
    <RootLayout>
      {/* Navigation */}
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
        onClick={() => setIndex(i)}
        className="aspect-[16/9] object-cover cursor-zoom-in"
        style={{
          display: 'block',
          width: '100%',
          height: 'auto',
          backgroundColor: 'black' // fallback for transparency
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
    console.log('🪵 YARL slide object:', slide);

    if (slide.type === 'video') {
      console.log('🎥 Detected video slide:', slide);
      return (
        <div
          style={{
            display: 'inline-block',
            margin: '0 auto',
            textAlign: 'center'
          }}
        >
          <video
            src={slide.sources?.[0]?.src || slide.src}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className="yarl__slide_image"
            style={{
              width: 'auto',
              height: 'auto',
              maxWidth: rect.width,
              maxHeight: rect.height,
              objectFit: 'contain',
              display: 'inline-block',
              verticalAlign: 'top',
              backgroundColor: 'black'
            }}
          />
        </div>
      );
    }

    return (
      <img
        src={slide.src}
        alt={slide.title || ''}
        className="yarl__slide_image"
        style={{
          maxWidth: rect.width,
          maxHeight: rect.height,
          objectFit: 'contain'
        }}
      />
    );
  },
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
